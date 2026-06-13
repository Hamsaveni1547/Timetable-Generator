-- =====================================================================
-- V5: Initial Seed Data
-- Provides sensible defaults for a 5-day/6-period schedule.
-- All values are STARTING POINTS — Admins modify them via the API/UI.
-- Password: Admin@123 (BCrypt strength=12)
-- =====================================================================

-- ===== 1. Default Admin User =====
INSERT INTO departments (name, code, is_active) VALUES ('Administration', 'ADMIN', TRUE);

INSERT INTO users (full_name, username, email, password, role, department_id, is_active)
VALUES (
    'System Administrator',
    'admin',
    'admin@institution.edu',
    '$2a$12$/.4zOCHmk5qSSyKvhcAQ4unn6VT0DIOxXXsJjUnORx5OBBfOFWz2i',
    'ADMIN',
    1,
    TRUE
);
-- Password above is BCrypt hash of: Admin@123


-- ===== 2. Schedule Config (Global Parameters) =====
INSERT INTO schedule_config (config_key, config_value, description) VALUES
('ACTIVE_DAYS',          'MONDAY,TUESDAY,WEDNESDAY,THURSDAY,FRIDAY',
    'Comma-separated working days. Modify to include/exclude days for the solver.'),
('ALLOW_SATURDAY',       'false',
    'Set to true to enable Saturday scheduling.'),
('SEMESTER_LABEL',       'Odd Semester 2026',
    'Current academic term display label.'),
('ACADEMIC_YEAR_START',  '2026-06-01',
    'Academic year start date (ISO format YYYY-MM-DD).'),
('ACADEMIC_YEAR_END',    '2026-11-30',
    'Academic year end date (ISO format YYYY-MM-DD).');


-- ===== 3. Slot Templates (Default: 6 periods + 2 breaks) =====
-- Admins can add/remove/modify slots via API. Solver uses only is_break=FALSE rows.
INSERT INTO slot_templates (slot_number, label, start_time, end_time, is_break, applies_to_days, is_active) VALUES
(1,  'Period 1',    '09:00:00', '09:55:00', FALSE, 'ALL', TRUE),
(2,  'Period 2',    '10:00:00', '10:55:00', FALSE, 'ALL', TRUE),
(3,  'Period 3',    '11:00:00', '11:55:00', FALSE, 'ALL', TRUE),
(4,  'Short Break', '12:00:00', '12:15:00', TRUE,  'ALL', TRUE),
(5,  'Period 4',    '12:15:00', '13:10:00', FALSE, 'ALL', TRUE),
(6,  'Lunch Break', '13:10:00', '14:00:00', TRUE,  'ALL', TRUE),
(7,  'Period 5',    '14:00:00', '14:55:00', FALSE, 'ALL', TRUE),
(8,  'Period 6',    '15:00:00', '15:55:00', FALSE, 'ALL', TRUE);


-- ===== 4. Constraint Config (Hard + Soft Constraints) =====
-- HC_* rows: is_hard=TRUE → solver REJECTS assignment if violated
-- SC_* rows: is_hard=FALSE → solver adds penalty_weight to cost score
INSERT INTO constraint_config (constraint_key, is_hard, penalty_weight, is_active, description) VALUES

-- Hard Constraints (penalty_weight is ignored; set to 0)
('HC_NO_SECTION_CLASH',      TRUE,  0.00, TRUE,
    'A student section cannot attend more than one class at the same day and slot.'),
('HC_NO_FACULTY_CLASH',      TRUE,  0.00, TRUE,
    'A faculty member cannot teach two classes simultaneously.'),
('HC_NO_ROOM_CLASH',         TRUE,  0.00, TRUE,
    'A room cannot host more than one class at the same day and slot.'),
('HC_ROOM_TYPE_MATCH',       TRUE,  0.00, TRUE,
    'Subjects must be scheduled in a room whose room_type matches required_room_type.'),
('HC_ROOM_CAPACITY',         TRUE,  0.00, TRUE,
    'The assigned room capacity must be >= the section student count.'),
('HC_CONSECUTIVE_BLOCKS',    TRUE,  0.00, TRUE,
    'Subjects with consecutive_slots_required > 1 must occupy back-to-back slots without interruption.'),
('HC_RESPECT_UNAVAILABILITY',TRUE,  0.00, TRUE,
    'Faculty cannot be assigned to slots marked in faculty_unavailability.'),

-- Soft Constraints (penalty_weight applied per violation unit)
('SC_FACULTY_WEEKLY_WORKLOAD', FALSE, 20.00, TRUE,
    'Penalty per slot assigned beyond the faculty max_hours_per_week ceiling.'),
('SC_FACULTY_DAILY_GAP',       FALSE,  5.00, TRUE,
    'Penalty per idle gap-slot in a faculty member daily teaching schedule.'),
('SC_STUDENT_DAILY_GAP',       FALSE,  8.00, TRUE,
    'Penalty per idle gap-slot in a section daily class schedule.'),
('SC_SUBJECT_DAILY_REPEAT',    FALSE, 15.00, TRUE,
    'Penalty when the same subject is scheduled more than max_sessions_per_day times in one day.'),
('SC_SUBJECT_SPREAD',          FALSE, 10.00, TRUE,
    'Penalty for uneven distribution of subject sessions across the working week.');
