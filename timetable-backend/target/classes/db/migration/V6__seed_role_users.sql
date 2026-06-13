-- =====================================================================
-- V6: Seed Role-Specific Users & Faculty Profiles
-- Creates HOD, Faculty, and Student accounts for testing.
-- Default Password for all seeded accounts: 123456789
-- =====================================================================

-- 1. Insert CSE Department if not exists
INSERT IGNORE INTO departments (name, code, is_active) 
VALUES ('Computer Science & Engineering', 'CSE', TRUE);

-- 1b. Insert MCA Department if not exists
INSERT IGNORE INTO departments (name, code, is_active)
VALUES ('Master of Computer Applications', 'MCA', TRUE);

-- 2. Insert HOD user for CSE
INSERT IGNORE INTO users (full_name, username, email, password, role, department_id, is_active)
SELECT 'CSE HOD', 'csehod', 'csehod@institution.edu', '$2a$12$ruNxHbeqN2/SKB3lLKOneOhKm/R/i55SstM5hsPMKyo8ryKA7Je7W', 'HOD', id, TRUE
FROM departments WHERE code = 'CSE';

-- 3. Update HOD reference in departments table
UPDATE departments d
SET d.hod_user_id = (SELECT u.id FROM users u WHERE u.username = 'csehod')
WHERE d.code = 'CSE';

-- 4. Insert Faculty user for CSE
INSERT IGNORE INTO users (full_name, username, email, password, role, department_id, is_active)
SELECT 'CSE Faculty One', 'csefaculty1', 'csefac1@institution.edu', '$2a$12$ruNxHbeqN2/SKB3lLKOneOhKm/R/i55SstM5hsPMKyo8ryKA7Je7W', 'FACULTY', id, TRUE
FROM departments WHERE code = 'CSE';

-- 5. Insert Student user for CSE
INSERT IGNORE INTO users (full_name, username, email, password, role, department_id, is_active)
SELECT 'CSE Student One', 'csestudent1', 'csestud1@institution.edu', '$2a$12$ruNxHbeqN2/SKB3lLKOneOhKm/R/i55SstM5hsPMKyo8ryKA7Je7W', 'STUDENT', id, TRUE
FROM departments WHERE code = 'CSE';

-- 6. Insert Faculty Profile for CSE HOD and link it to the user
INSERT IGNORE INTO faculty (name, employee_id, email, phone, department_id, max_hours_per_week, designation, user_id, is_active)
SELECT 'CSE HOD', 'EMP_CSE_HOD', 'csehod@institution.edu', '9876543211', d.id, 18, 'HOD & Professor', u.id, TRUE
FROM departments d
JOIN users u ON u.username = 'csehod'
WHERE d.code = 'CSE';

-- 7. Insert Faculty Profile for CSE Faculty One and link it to the user
INSERT IGNORE INTO faculty (name, employee_id, email, phone, department_id, max_hours_per_week, designation, user_id, is_active)
SELECT 'CSE Faculty One', 'EMP_CSE_FAC1', 'csefac1@institution.edu', '9876543212', d.id, 16, 'Assistant Professor', u.id, TRUE
FROM departments d
JOIN users u ON u.username = 'csefaculty1'
WHERE d.code = 'CSE';

-- 8. Insert MCA HOD user
INSERT IGNORE INTO users (full_name, username, email, password, role, department_id, is_active)
SELECT 'MCA HOD', 'mcahod', 'mcahod@institution.edu', '$2a$12$ruNxHbeqN2/SKB3lLKOneOhKm/R/i55SstM5hsPMKyo8ryKA7Je7W', 'HOD', id, TRUE
FROM departments WHERE code = 'MCA';

-- 9. Update HOD reference in departments table
UPDATE departments d
SET d.hod_user_id = (SELECT u.id FROM users u WHERE u.username = 'mcahod')
WHERE d.code = 'MCA';

-- 10. Insert MCA Faculty user
INSERT IGNORE INTO users (full_name, username, email, password, role, department_id, is_active)
SELECT 'MCA Faculty One', 'mcafaculty1', 'mcafac1@institution.edu', '$2a$12$ruNxHbeqN2/SKB3lLKOneOhKm/R/i55SstM5hsPMKyo8ryKA7Je7W', 'FACULTY', id, TRUE
FROM departments WHERE code = 'MCA';

-- 11. Insert MCA Student user
INSERT IGNORE INTO users (full_name, username, email, password, role, department_id, is_active)
SELECT 'MCA Student One', 'mcastudent1', 'mcastud1@institution.edu', '$2a$12$ruNxHbeqN2/SKB3lLKOneOhKm/R/i55SstM5hsPMKyo8ryKA7Je7W', 'STUDENT', id, TRUE
FROM departments WHERE code = 'MCA';

-- 12. Insert Faculty Profile for MCA HOD and link it to the user
INSERT IGNORE INTO faculty (name, employee_id, email, phone, department_id, max_hours_per_week, designation, user_id, is_active)
SELECT 'MCA HOD', 'EMP_MCA_HOD', 'mcahod@institution.edu', '9876543213', d.id, 18, 'HOD & Professor', u.id, TRUE
FROM departments d
JOIN users u ON u.username = 'mcahod'
WHERE d.code = 'MCA';

-- 13. Insert Faculty Profile for MCA Faculty One and link it to the user
INSERT IGNORE INTO faculty (name, employee_id, email, phone, department_id, max_hours_per_week, designation, user_id, is_active)
SELECT 'MCA Faculty One', 'EMP_MCA_FAC1', 'mcafac1@institution.edu', '9876543214', d.id, 16, 'Assistant Professor', u.id, TRUE
FROM departments d
JOIN users u ON u.username = 'mcafaculty1'
WHERE d.code = 'MCA';
