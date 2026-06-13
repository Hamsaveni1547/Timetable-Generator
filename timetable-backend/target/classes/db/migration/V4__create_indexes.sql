-- =====================================================================
-- V4: Performance Indexes
-- Optimizes clash-checking during solver execution and role-scoped queries.
-- =====================================================================

-- Faculty personal schedule lookup (faculty portal)
CREATE INDEX idx_entry_faculty_gen
    ON timetable_entries (faculty_id, generation_id);

-- Student section schedule lookup (student portal)
CREATE INDEX idx_entry_section_gen
    ON timetable_entries (section_id, generation_id);

-- Admin/HOD full department schedule view
CREATE INDEX idx_entry_gen
    ON timetable_entries (generation_id);

-- Room occupancy view
CREATE INDEX idx_entry_room_gen
    ON timetable_entries (room_id, generation_id);

-- Override audit filter
CREATE INDEX idx_entry_override
    ON timetable_entries (generation_id, is_manually_overridden);

-- Solver clash checking composites (used heavily during backtracking)
CREATE INDEX idx_clash_room
    ON timetable_entries (generation_id, room_id, day_of_week, slot_template_id);

CREATE INDEX idx_clash_faculty
    ON timetable_entries (generation_id, faculty_id, day_of_week, slot_template_id);

CREATE INDEX idx_clash_section
    ON timetable_entries (generation_id, section_id, day_of_week, slot_template_id);

-- Config table lookups
CREATE INDEX idx_slot_active_break
    ON slot_templates (is_active, is_break);

CREATE INDEX idx_constraint_key_active
    ON constraint_config (constraint_key, is_active);

-- Allocation aggregate queries (workload summary)
CREATE INDEX idx_alloc_faculty
    ON subject_allocations (faculty_id);

CREATE INDEX idx_alloc_subject_section
    ON subject_allocations (subject_id, section_id);

-- Generation status filter (HOD/Admin dashboard)
CREATE INDEX idx_gen_dept_status
    ON timetable_generations (department_id, status);

-- Faculty unavailability lookup (solver pre-load)
CREATE INDEX idx_unavail_faculty
    ON faculty_unavailability (faculty_id);
