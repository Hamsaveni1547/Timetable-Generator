-- =====================================================================
-- V2: Academic Entity Tables
-- departments → users → rooms, sections, subjects, faculty → subject_allocations
-- FK order carefully managed. departments.hod_user_id added after users table.
-- =====================================================================

-- 1. departments (created before users; hod FK added via ALTER below)
CREATE TABLE departments (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    code        VARCHAR(10) NOT NULL,
    hod_user_id BIGINT NULL,
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_dept_name (name),
    UNIQUE KEY uq_dept_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- 2. users (references departments)
CREATE TABLE users (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    full_name     VARCHAR(100) NOT NULL,
    username      VARCHAR(50) NOT NULL,
    email         VARCHAR(100) NOT NULL,
    password      VARCHAR(255) NOT NULL,
    role          ENUM('ADMIN','HOD','FACULTY','STUDENT') NOT NULL,
    department_id BIGINT NULL,
    is_active     BOOLEAN NOT NULL DEFAULT TRUE,
    last_login    TIMESTAMP NULL,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_username (username),
    UNIQUE KEY uq_email (email),
    CONSTRAINT fk_user_department FOREIGN KEY (department_id)
        REFERENCES departments(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- 3. Now add hod FK on departments (users table now exists)
ALTER TABLE departments
    ADD CONSTRAINT fk_dept_hod FOREIGN KEY (hod_user_id)
        REFERENCES users(id) ON DELETE SET NULL;


-- 4. rooms (no dept FK — rooms are shared infrastructure)
CREATE TABLE rooms (
    id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    name         VARCHAR(50) NOT NULL,
    room_type    VARCHAR(30) NOT NULL,   -- 'CLASSROOM','LAB','SEMINAR_HALL' etc. — extensible VARCHAR
    capacity     INT NOT NULL,
    building     VARCHAR(50),
    floor_number INT,
    is_active    BOOLEAN NOT NULL DEFAULT TRUE,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_room_name (name),
    CONSTRAINT chk_room_capacity CHECK (capacity > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- 5. sections (belongs to a department)
CREATE TABLE sections (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    name          VARCHAR(20) NOT NULL,
    academic_year INT NOT NULL,
    semester      INT NOT NULL,
    student_count INT NOT NULL,
    department_id BIGINT NOT NULL,
    is_active     BOOLEAN NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_section (name, academic_year, semester, department_id),
    CONSTRAINT chk_section_students CHECK (student_count > 0),
    CONSTRAINT fk_section_department FOREIGN KEY (department_id)
        REFERENCES departments(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- 6. subjects (belongs to a department; all scheduling params DB-defined)
CREATE TABLE subjects (
    id                        BIGINT AUTO_INCREMENT PRIMARY KEY,
    name                      VARCHAR(100) NOT NULL,
    code                      VARCHAR(15) NOT NULL,
    department_id             BIGINT NOT NULL,
    semester                  INT NOT NULL,
    credits                   INT NOT NULL,
    hours_per_week            INT NOT NULL,
    subject_type              VARCHAR(30) NOT NULL,   -- 'THEORY','PRACTICAL' — VARCHAR, not ENUM
    required_room_type        VARCHAR(30) NOT NULL,   -- Must match rooms.room_type exactly
    consecutive_slots_required INT NOT NULL DEFAULT 1, -- Lab block size: solver reads this per subject
    min_days_between_sessions  INT NOT NULL DEFAULT 1, -- Spread: min days between same subject sessions
    max_sessions_per_day       INT NOT NULL DEFAULT 1, -- Max times subject appears in one day
    created_at                TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at                TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_subject_code (code),
    CONSTRAINT chk_subject_hours CHECK (hours_per_week > 0),
    CONSTRAINT chk_consecutive_slots CHECK (consecutive_slots_required >= 1),
    CONSTRAINT fk_subject_department FOREIGN KEY (department_id)
        REFERENCES departments(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- 7. faculty (per-row max_hours_per_week — no global constant)
CREATE TABLE faculty (
    id                BIGINT AUTO_INCREMENT PRIMARY KEY,
    name              VARCHAR(100) NOT NULL,
    employee_id       VARCHAR(20),
    email             VARCHAR(100) NOT NULL,
    phone             VARCHAR(15),
    department_id     BIGINT NOT NULL,
    max_hours_per_week INT NOT NULL DEFAULT 18,  -- Weekly workload ceiling — fully DB-defined per faculty
    designation       VARCHAR(50),
    user_id           BIGINT NULL,
    is_active         BOOLEAN NOT NULL DEFAULT TRUE,
    created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_faculty_email (email),
    UNIQUE KEY uq_faculty_employee (employee_id),
    UNIQUE KEY uq_faculty_user (user_id),
    CONSTRAINT chk_faculty_hours CHECK (max_hours_per_week > 0),
    CONSTRAINT fk_faculty_department FOREIGN KEY (department_id)
        REFERENCES departments(id) ON DELETE CASCADE,
    CONSTRAINT fk_faculty_user FOREIGN KEY (user_id)
        REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- 8. subject_allocations (multi-faculty per subject: multiple rows per subject+section)
CREATE TABLE subject_allocations (
    id                     BIGINT AUTO_INCREMENT PRIMARY KEY,
    subject_id             BIGINT NOT NULL,
    section_id             BIGINT NOT NULL,
    faculty_id             BIGINT NOT NULL,
    allocated_hours_per_week INT NOT NULL,  -- Hours THIS faculty delivers for this subject-section
    created_at             TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at             TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT chk_alloc_hours CHECK (allocated_hours_per_week > 0),
    CONSTRAINT fk_alloc_subject FOREIGN KEY (subject_id)
        REFERENCES subjects(id) ON DELETE CASCADE,
    CONSTRAINT fk_alloc_section FOREIGN KEY (section_id)
        REFERENCES sections(id) ON DELETE CASCADE,
    CONSTRAINT fk_alloc_faculty FOREIGN KEY (faculty_id)
        REFERENCES faculty(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
