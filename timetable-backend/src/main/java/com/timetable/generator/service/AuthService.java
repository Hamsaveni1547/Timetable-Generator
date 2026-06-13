package com.timetable.generator.service;

import com.timetable.generator.dto.auth.*;
import com.timetable.generator.entity.academic.Department;
import com.timetable.generator.entity.academic.Faculty;
import com.timetable.generator.entity.auth.User;
import com.timetable.generator.exception.ConflictException;
import com.timetable.generator.exception.ResourceNotFoundException;
import com.timetable.generator.exception.ValidationException;
import com.timetable.generator.repository.academic.DepartmentRepository;
import com.timetable.generator.repository.academic.FacultyRepository;
import com.timetable.generator.repository.academic.UserRepository;
import com.timetable.generator.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final AuthenticationManager authenticationManager;
    private final PasswordEncoder passwordEncoder;
    private final FacultyRepository facultyRepository;
    private final DepartmentRepository departmentRepository;

    public AuthResponse login(LoginRequest request) {
        Authentication auth = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword()));

        User user = (User) auth.getPrincipal();
        String token = jwtTokenProvider.generateToken(user);

        // Update last login
        user.setLastLogin(java.time.LocalDateTime.now());
        userRepository.save(user);

        return AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .userId(user.getId())
                .fullName(user.getFullName())
                .username(user.getUsername())
                .role(user.getRole().name())
                .departmentId(user.getDepartmentId())
                .build();
    }

    @Transactional
    public User register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new ConflictException("Username '" + request.getUsername() + "' is already taken.");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new ConflictException("Email '" + request.getEmail() + "' is already registered.");
        }

        // Validate department requirement for non-admin roles
        if (request.getRole() != User.Role.ADMIN && request.getDepartmentId() == null) {
            throw new ValidationException("Department is required for role: " + request.getRole());
        }

        User user = User.builder()
                .fullName(request.getFullName())
                .username(request.getUsername())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(request.getRole())
                .departmentId(request.getDepartmentId())
                .isActive(true)
                .build();

        final User savedUser = userRepository.save(user);

        // Auto-create Faculty profile for FACULTY and HOD roles
        if (request.getRole() == User.Role.FACULTY || request.getRole() == User.Role.HOD) {
            autoCreateFacultyProfile(savedUser, request);
        }

        // Auto-set HOD on department
        if (request.getRole() == User.Role.HOD && request.getDepartmentId() != null) {
            departmentRepository.findById(request.getDepartmentId()).ifPresent(dept -> {
                dept.setHodUserId(savedUser.getId());
                departmentRepository.save(dept);
            });
        }

        return savedUser;
    }

    /**
     * Automatically creates a Faculty profile record linked to the new user
     * account.
     * This allows HOD/Faculty users to access their dashboards immediately after
     * the admin creates their account — no manual faculty profile setup needed.
     */
    private void autoCreateFacultyProfile(User user, RegisterRequest request) {
        // Skip if a faculty profile already exists for this user
        if (facultyRepository.findByUserIdAndIsActiveTrue(user.getId()).isPresent()) {
            return;
        }
        // Skip if email already used in faculty table
        if (facultyRepository.existsByEmail(user.getEmail())) {
            return;
        }

        Department dept = departmentRepository.findById(request.getDepartmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Department", request.getDepartmentId()));

        String designation = request.getRole() == User.Role.HOD
                ? "HOD & Professor"
                : "Assistant Professor";

        String employeeId = "EMP_" + user.getUsername().toUpperCase();

        Faculty faculty = Faculty.builder()
                .name(user.getFullName())
                .employeeId(employeeId)
                .email(user.getEmail())
                .department(dept)
                .maxHoursPerWeek(18)
                .designation(designation)
                .userId(user.getId())
                .isActive(true)
                .build();

        facultyRepository.save(faculty);
    }

    public User getCurrentUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));
    }

    public List<Map<String, Object>> getAllUsers(User currentUser, Long deptId) {
        List<User> users = userRepository.findAll();

        if (currentUser.getRole() == User.Role.HOD) {
            Long hodDeptId = currentUser.getDepartmentId();
            users = users.stream()
                    .filter(user -> hodDeptId != null && hodDeptId.equals(user.getDepartmentId()))
                    .collect(Collectors.toList());
        } else if (deptId != null) {
            users = users.stream()
                    .filter(user -> deptId.equals(user.getDepartmentId()))
                    .collect(Collectors.toList());
        }

        return users.stream().map(this::toUserMap).collect(Collectors.toList());
    }

    @Transactional
    public Map<String, Object> updateUser(Long id, UpdateUserRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", id));

        validateDepartmentForRole(request.getRole(), request.getDepartmentId());

        Optional<User> existingUsernameUser = userRepository.findByUsername(request.getUsername());
        if (existingUsernameUser.isPresent() && !existingUsernameUser.get().getId().equals(id)) {
            throw new ConflictException("Username '" + request.getUsername() + "' is already taken.");
        }

        Optional<User> existingEmailUser = userRepository.findByEmail(request.getEmail());
        if (existingEmailUser.isPresent() && !existingEmailUser.get().getId().equals(id)) {
            throw new ConflictException("Email '" + request.getEmail() + "' is already registered.");
        }

        Long previousDepartmentId = user.getDepartmentId();
        User.Role previousRole = user.getRole();

        user.setUsername(request.getUsername());
        user.setFullName(request.getFullName());
        user.setEmail(request.getEmail());
        user.setRole(request.getRole());
        user.setDepartmentId(request.getRole() == User.Role.ADMIN ? null : request.getDepartmentId());
        user.setActive(Boolean.TRUE.equals(request.getIsActive()));

        User savedUser = userRepository.save(user);

        syncDepartmentHeadLink(savedUser, previousRole, previousDepartmentId);

        return toUserMap(savedUser);
    }

    @Transactional
    public void changePassword(Long userId, ChangePasswordRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new ValidationException("Current password is incorrect.");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    public java.util.List<User> getAllUsers() {
        return userRepository.findAll();
    }

    private void validateDepartmentForRole(User.Role role, Long departmentId) {
        if (role != User.Role.ADMIN && departmentId == null) {
            throw new ValidationException("Department is required for role: " + role);
        }
    }

    private void syncFacultyProfile(User user, Long departmentId) {
        if (user.getRole() != User.Role.FACULTY && user.getRole() != User.Role.HOD) {
            return;
        }

        if (departmentId == null) {
            return;
        }

        autoCreateFacultyProfile(user, new RegisterRequest() {
            {
                setFullName(user.getFullName());
                setUsername(user.getUsername());
                setEmail(user.getEmail());
                setPassword("unused");
                setRole(user.getRole());
                setDepartmentId(departmentId);
            }
        });
    }

    private void syncDepartmentHeadLink(User user, User.Role previousRole, Long previousDepartmentId) {
        if (previousRole == User.Role.HOD && previousDepartmentId != null) {
            departmentRepository.findById(previousDepartmentId).ifPresent(dept -> {
                if (user.getId().equals(dept.getHodUserId())) {
                    dept.setHodUserId(null);
                    departmentRepository.save(dept);
                }
            });
        }

        if (user.getRole() == User.Role.HOD && user.getDepartmentId() != null) {
            departmentRepository.findById(user.getDepartmentId()).ifPresent(dept -> {
                dept.setHodUserId(user.getId());
                departmentRepository.save(dept);
            });
        }
    }

    private Map<String, Object> toUserMap(User user) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", user.getId());
        map.put("fullName", user.getFullName());
        map.put("username", user.getUsername());
        map.put("email", user.getEmail());
        map.put("role", user.getRole().name());
        map.put("departmentId", user.getDepartmentId());
        map.put("isActive", user.isActive());
        map.put("lastLogin", user.getLastLogin());
        return map;
    }
}
