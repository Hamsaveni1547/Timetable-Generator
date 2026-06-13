-- =====================================================================
-- V3: Timetable Output Tables
-- faculty_unavailability: solver hard-excludes these slot+day combos
-- timetable_generations: metadata per solver run (status, bottleneck JSON)
-- timetable_entries: atomic schedule records with DB-level clash prevention
-- =====================================================================

-- 1. faculty_unavailability (solver treats these as hard constraint blocks)
CREATE TABLE faculty_unavailability (
    id               BIGINT AUTO_INCREMENT PRIMARY KEY,
    faculty_id       BIGINT NOT NULL,
    day_of_week      VARCHAR(15) NOT NULL,   -- 'MONDAY','TUESDAY', etc.
    slot_template_id BIGINT NOT NULL,
    reason           VARCHAR(255),
    effective_from   DATE NULL,
    effective_to     DATE NULL,              -- NULL means permanent
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_unavail_faculty FOREIGN KEY (faculty_id)
        REFERENCES faculty(id) ON DELETE CASCADE,
    CONSTRAINT fk_unavail_slot FOREIGN KEY (slot_template_id)
        REFERENCES slot_templates(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- 2. timetable_generations: one row per solver execution attempt
CREATE TABLE timetable_generations (
    id                BIGINT AUTO_INCREMENT PRIMARY KEY,
    department_id     BIGINT NOT NULL,
    academic_year     INT NOT NULL,
    semester          INT NOT NULL,
    status            ENUM('IN_PROGRESS','DRAFT','PUBLISHED','FAILED') NOT NULL DEFAULT 'IN_PROGRESS',
    triggered_by      BIGINT NOT NULL,
    solver_duration_ms BIGINT NULL,
    bottleneck_report  JSON NULL,           -- Detailed failure analysis stored as JSON
    generated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    published_at      TIMESTAMP NULL,
    CONSTRAINT fk_gen_department FOREIGN KEY (department_id)
        REFERENCES departments(id) ON DELETE CASCADE,
    CONSTRAINT fk_gen_triggered_by FOREIGN KEY (triggered_by)
        REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- 3. timetable_entries: atomic schedule records
--    3 composite UNIQUE keys provide DB-level clash prevention guarantee
--    (no room, section, or faculty can be double-booked at same day+slot)
CREATE TABLE timetable_entries (
    id                    BIGINT AUTO_INCREMENT PRIMARY KEY,
    generation_id         BIGINT NOT NULL,
    section_id            BIGINT NOT NULL,
    subject_id            BIGINT NOT NULL,
    faculty_id            BIGINT NOT NULL,
    room_id               BIGINT NOT NULL,
    slot_template_id      BIGINT NOT NULL,
    day_of_week           VARCHAR(15) NOT NULL,
    is_manually_overridden BOOLEAN NOT NULL DEFAULT FALSE,
    override_reason       VARCHAR(255) NULL,
    override_by           BIGINT NULL,
    created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Hard clash prevention at the database level
    UNIQUE KEY uq_room_day_slot    (room_id, day_of_week, slot_template_id, generation_id),
    UNIQUE KEY uq_section_day_slot (section_id, day_of_week, slot_template_id, generation_id),
    UNIQUE KEY uq_faculty_day_slot (faculty_id, day_of_week, slot_template_id, generation_id),

    CONSTRAINT fk_entry_generation FOREIGN KEY (generation_id)
        REFERENCES timetable_generations(id) ON DELETE CASCADE,
    CONSTRAINT fk_entry_section FOREIGN KEY (section_id)
        REFERENCES sections(id) ON DELETE CASCADE,
    CONSTRAINT fk_entry_subject FOREIGN KEY (subject_id)
        REFERENCES subjects(id) ON DELETE CASCADE,
    CONSTRAINT fk_entry_faculty FOREIGN KEY (faculty_id)
        REFERENCES faculty(id) ON DELETE CASCADE,
    CONSTRAINT fk_entry_room FOREIGN KEY (room_id)
        REFERENCES rooms(id) ON DELETE CASCADE,
    CONSTRAINT fk_entry_slot FOREIGN KEY (slot_template_id)
        REFERENCES slot_templates(id) ON DELETE CASCADE,
    CONSTRAINT fk_entry_override_by FOREIGN KEY (override_by)
        REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
