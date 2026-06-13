# Architecture Plan: Folder & Code Structure
> **Revision 2 — Fully Dynamic System Structure**

---

## 1. Unified Root Directory

```text
timetablegen-java/
├── architecture-plan/          # All planning and design markdown documents
├── timetable-backend/          # Spring Boot 3.x Maven API Service
└── timetable-frontend/         # Next.js 14+ TypeScript Client Application
```

---

## 2. Backend Directory Tree: `timetable-backend/`

### Key additions from Revision 1:
- New `config` entity package for `SlotTemplate`, `ScheduleConfig`, `ConstraintConfig`, `FacultyUnavailability`.
- New `solver/context` subpackage for `ConstraintContext` and `ConstraintContextBuilder`.
- New `controller/ConfigController.java` — full CRUD for all dynamic config tables.
- `ScheduleConfigService.java` — typed accessors that parse raw `config_value` strings into structured types.

```text
timetable-backend/
├── pom.xml                                         # Maven Dependencies
└── src/
    ├── main/
    │   ├── java/
    │   │   └── com/
    │   │       └── timetable/
    │   │           └── generator/
    │   │               ├── TimetableGeneratorApplication.java
    │   │               │
    │   │               ├── config/                  # Spring App Configuration Beans
    │   │               │   ├── AppConfig.java       # CORS, BCrypt, ObjectMapper
    │   │               │   └── OpenApiConfig.java   # Swagger/OpenAPI 3.0 documentation
    │   │               │
    │   │               ├── controller/              # REST API Controllers
    │   │               │   ├── AuthController.java
    │   │               │   ├── ConfigController.java         ← NEW: schedule_config, slot_templates, constraint_config CRUD
    │   │               │   ├── DepartmentController.java
    │   │               │   ├── FacultyController.java
    │   │               │   ├── FacultyUnavailabilityController.java  ← NEW
    │   │               │   ├── InfrastructureController.java         # Rooms CRUD
    │   │               │   ├── SectionController.java
    │   │               │   ├── SubjectController.java
    │   │               │   ├── SubjectAllocationController.java
    │   │               │   └── TimetableController.java
    │   │               │
    │   │               ├── dto/                     # Request / Response Data Transfer Objects
    │   │               │   ├── auth/
    │   │               │   │   ├── LoginRequest.java
    │   │               │   │   ├── RegisterRequest.java
    │   │               │   │   └── AuthResponse.java
    │   │               │   ├── config/
    │   │               │   │   ├── ScheduleConfigDto.java
    │   │               │   │   ├── SlotTemplateDto.java
    │   │               │   │   └── ConstraintConfigDto.java
    │   │               │   ├── entity/
    │   │               │   │   ├── DepartmentDto.java
    │   │               │   │   ├── RoomDto.java
    │   │               │   │   ├── SectionDto.java
    │   │               │   │   ├── SubjectDto.java
    │   │               │   │   ├── FacultyDto.java
    │   │               │   │   └── SubjectAllocationDto.java
    │   │               │   └── timetable/
    │   │               │       ├── GenerateRequest.java
    │   │               │       ├── TimetableEntryDto.java
    │   │               │       ├── GenerationStatusDto.java
    │   │               │       ├── OverrideRequest.java
    │   │               │       └── SwapValidationResult.java
    │   │               │
    │   │               ├── entity/                  # JPA Entities (maps to MySQL tables)
    │   │               │   ├── config/
    │   │               │   │   ├── ScheduleConfig.java      # key-value schedule settings
    │   │               │   │   ├── SlotTemplate.java        # Period definitions (dynamic)
    │   │               │   │   ├── ConstraintConfig.java    # Hard/soft constraint weights
    │   │               │   │   └── FacultyUnavailability.java
    │   │               │   ├── academic/
    │   │               │   │   ├── Department.java
    │   │               │   │   ├── Room.java
    │   │               │   │   ├── Section.java
    │   │               │   │   ├── Subject.java
    │   │               │   │   ├── Faculty.java
    │   │               │   │   └── SubjectAllocation.java
    │   │               │   ├── auth/
    │   │               │   │   └── User.java
    │   │               │   └── timetable/
    │   │               │       ├── TimetableGeneration.java
    │   │               │       └── TimetableEntry.java
    │   │               │
    │   │               ├── exception/
    │   │               │   ├── GlobalExceptionHandler.java
    │   │               │   ├── ResourceNotFoundException.java
    │   │               │   ├── SchedulingConstraintException.java  # Carries BottleneckReport
    │   │               │   └── ValidationException.java
    │   │               │
    │   │               ├── repository/              # Spring Data JPA Interfaces
    │   │               │   ├── config/
    │   │               │   │   ├── ScheduleConfigRepository.java
    │   │               │   │   ├── SlotTemplateRepository.java
    │   │               │   │   └── ConstraintConfigRepository.java
    │   │               │   ├── academic/
    │   │               │   │   ├── DepartmentRepository.java
    │   │               │   │   ├── RoomRepository.java
    │   │               │   │   ├── SectionRepository.java
    │   │               │   │   ├── SubjectRepository.java
    │   │               │   │   ├── FacultyRepository.java
    │   │               │   │   └── SubjectAllocationRepository.java
    │   │               │   └── timetable/
    │   │               │       ├── TimetableGenerationRepository.java
    │   │               │       └── TimetableEntryRepository.java
    │   │               │
    │   │               ├── security/
    │   │               │   ├── SecurityConfig.java
    │   │               │   ├── JwtAuthenticationFilter.java
    │   │               │   ├── JwtTokenProvider.java
    │   │               │   └── CustomUserDetailsService.java
    │   │               │
    │   │               ├── service/                 # Business Logic Layer
    │   │               │   ├── AuthService.java
    │   │               │   ├── ScheduleConfigService.java   ← NEW: typed accessors for config table
    │   │               │   ├── SlotTemplateService.java     ← NEW
    │   │               │   ├── ConstraintConfigService.java ← NEW
    │   │               │   ├── DepartmentService.java
    │   │               │   ├── RoomService.java
    │   │               │   ├── SectionService.java
    │   │               │   ├── SubjectService.java
    │   │               │   ├── FacultyService.java
    │   │               │   ├── SubjectAllocationService.java
    │   │               │   └── TimetableService.java        # Orchestrates generation + overrides
    │   │               │
    │   │               └── solver/                  # Core CSP Solver Engine
    │   │                   ├── context/
    │   │                   │   ├── ConstraintContext.java          ← NEW: immutable runtime config
    │   │                   │   └── ConstraintContextBuilder.java   ← NEW: loads from DB via services
    │   │                   ├── model/
    │   │                   │   ├── SessionVariable.java            # A schedulable class session
    │   │                   │   ├── CandidateAssignment.java        # (day, slot, room) option
    │   │                   │   └── BottleneckReport.java           # JSON-serializable failure analysis
    │   │                   ├── TimetableSolver.java                # Backtracking CSP engine
    │   │                   ├── SessionVariableBuilder.java         # Builds variables from allocations
    │   │                   ├── DomainBuilder.java                  # Builds valid assignment domain per session
    │   │                   ├── VariableMRVComparator.java          # MRV heuristic sort
    │   │                   ├── PenaltyCalculator.java              # LCV soft cost scorer
    │   │                   ├── HardConstraintChecker.java          # Evaluates all active HC_* keys
    │   │                   └── OverrideValidator.java              # Validates manual swap for hard constraints
    │   │
    │   └── resources/
    │       ├── application.yml                      # DB connection, JWT secret, server port
    │       └── db/
    │           ├── schema.sql                       # DDL for all tables (Flyway migration)
    │           └── seed-config.sql                  # Initial slot templates, constraint defaults
    │
    └── test/
        └── java/
            └── com/
                └── timetable/
                    └── generator/
                        ├── solver/
                        │   ├── TimetableSolverTest.java          # CSP algorithm unit tests
                        │   └── PenaltyCalculatorTest.java
                        ├── service/
                        │   └── TimetableServiceIntegrationTest.java
                        └── controller/
                            └── TimetableControllerTest.java       # MockMvc endpoint tests
```

---

## 3. Frontend Directory Tree: `timetable-frontend/`

### Key additions from Revision 1:
- New `ConfigPanel` components for dynamic slot template editor and constraint weight manager.
- New `useDynamicConfig` hook to load and cache slot/constraint definitions.
- Constraint weight editor panel inside Admin Settings.

```text
timetable-frontend/
├── package.json
├── tsconfig.json
├── next.config.js
├── public/
│   └── assets/
└── src/
    ├── app/                                         # Next.js App Router
    │   ├── layout.tsx                               # Root layout (providers: Auth, QueryClient, Theme)
    │   ├── page.tsx                                 # Landing page (public)
    │   ├── login/
    │   │   └── page.tsx
    │   └── dashboard/
    │       ├── layout.tsx                           # Sidebar + Navbar shell
    │       ├── admin/
    │       │   ├── page.tsx                         # Overview + generation trigger
    │       │   ├── config/
    │       │   │   ├── slots/page.tsx               # ← NEW: Slot template editor
    │       │   │   ├── constraints/page.tsx         # ← NEW: Constraint weight editor
    │       │   │   └── schedule/page.tsx            # ← NEW: Working days, academic calendar
    │       │   ├── departments/page.tsx
    │       │   ├── rooms/page.tsx
    │       │   ├── faculty/page.tsx
    │       │   └── timetable/[deptId]/page.tsx
    │       ├── hod/
    │       │   ├── page.tsx
    │       │   ├── sections/page.tsx
    │       │   ├── subjects/page.tsx
    │       │   ├── allocations/page.tsx             # Multi-faculty allocation manager
    │       │   ├── unavailability/page.tsx          # ← NEW: Faculty unavailability settings
    │       │   └── generate/page.tsx                # Generate + view draft timetable
    │       ├── faculty/
    │       │   ├── page.tsx                         # Personal schedule view
    │       │   └── workload/page.tsx
    │       └── student/
    │           └── page.tsx                         # Section timetable view
    │
    ├── components/
    │   ├── ui/                                      # Atomic elements
    │   │   ├── Button.tsx
    │   │   ├── Input.tsx
    │   │   ├── Select.tsx
    │   │   ├── Badge.tsx
    │   │   ├── Modal.tsx
    │   │   ├── GlassCard.tsx
    │   │   ├── Toast.tsx
    │   │   └── ProgressBar.tsx
    │   ├── config/                                  ← NEW: Dynamic config management components
    │   │   ├── SlotTemplateEditor.tsx               # Table + CRUD form for slot periods
    │   │   ├── ConstraintWeightPanel.tsx            # Sliders/inputs for each SC_* penalty weight
    │   │   └── WorkingDaysSelector.tsx              # Multi-toggle for active days
    │   ├── timetable/
    │   │   ├── TimetableGrid.tsx                    # Interactive slot grid (drag-and-drop override)
    │   │   ├── AllocationMatrix.tsx                 # HOD faculty-to-subject allocation UI
    │   │   ├── WorkloadBar.tsx                      # Faculty weekly workload visual bar
    │   │   ├── ConflictPanel.tsx                    # Lists hard constraint violations
    │   │   ├── BottleneckReport.tsx                 # ← NEW: Displays solver bottleneck JSON
    │   │   └── GenerationControl.tsx
    │   ├── Sidebar.tsx
    │   └── Navbar.tsx
    │
    ├── hooks/
    │   ├── useAuth.ts
    │   ├── useDynamicConfig.ts                      ← NEW: Loads slot_templates + constraint_config
    │   ├── useTimetable.ts
    │   └── useWorkload.ts                           ← NEW: Computes per-faculty weekly usage
    │
    ├── services/
    │   ├── api.ts                                   # Axios base instance + JWT interceptors
    │   ├── authService.ts
    │   ├── configService.ts                         ← NEW: CRUD for config, slots, constraints
    │   ├── facultyService.ts
    │   └── timetableService.ts
    │
    ├── styles/
    │   ├── globals.css                              # Resets, typography, scrollbar
    │   └── theme.css                               # CSS vars: colors, glass effects, spacing
    │
    └── types/
        ├── entities.ts                              # Academic entity interfaces
        ├── config.ts                               ← NEW: SlotTemplate, ConstraintConfig interfaces
        └── timetable.ts                            # TimetableEntry, GenerationStatus, BottleneckReport
```

---

## 4. Key Backend Dependencies (`pom.xml`)

```xml
<dependencies>
    <!-- Spring Boot Core -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-data-jpa</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-security</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-validation</artifactId>
    </dependency>

    <!-- JWT -->
    <dependency>
        <groupId>io.jsonwebtoken</groupId>
        <artifactId>jjwt-api</artifactId>
        <version>0.12.5</version>
    </dependency>
    <dependency>
        <groupId>io.jsonwebtoken</groupId>
        <artifactId>jjwt-impl</artifactId>
        <version>0.12.5</version>
        <scope>runtime</scope>
    </dependency>

    <!-- MySQL -->
    <dependency>
        <groupId>com.mysql</groupId>
        <artifactId>mysql-connector-j</artifactId>
        <scope>runtime</scope>
    </dependency>

    <!-- Flyway DB Migrations -->
    <dependency>
        <groupId>org.flywaydb</groupId>
        <artifactId>flyway-core</artifactId>
    </dependency>
    <dependency>
        <groupId>org.flywaydb</groupId>
        <artifactId>flyway-mysql</artifactId>
    </dependency>

    <!-- Lombok -->
    <dependency>
        <groupId>org.projectlombok</groupId>
        <artifactId>lombok</artifactId>
        <optional>true</optional>
    </dependency>

    <!-- OpenAPI / Swagger -->
    <dependency>
        <groupId>org.springdoc</groupId>
        <artifactId>springdoc-openapi-starter-webmvc-ui</artifactId>
        <version>2.5.0</version>
    </dependency>

    <!-- Testing -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-test</artifactId>
        <scope>test</scope>
    </dependency>
    <dependency>
        <groupId>org.springframework.security</groupId>
        <artifactId>spring-security-test</artifactId>
        <scope>test</scope>
    </dependency>
</dependencies>
```
