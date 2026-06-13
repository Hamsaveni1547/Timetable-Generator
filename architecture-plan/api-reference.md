# Architecture Plan: API Reference & Seed Configuration
> Complete REST endpoint listing and initial database seed data guide.

---

## 1. Complete REST API Reference

All endpoints are prefixed with `/api/v1`. All protected endpoints require `Authorization: Bearer <JWT>` header.

### 1.1. Authentication
| Method | Endpoint | Role Required | Description |
|---|---|---|---|
| POST | `/auth/login` | Public | Login, returns JWT |
| POST | `/auth/register` | ADMIN | Create user account |
| GET | `/auth/me` | Any authenticated | Get current user profile |
| PUT | `/auth/change-password` | Any authenticated | Change own password |

### 1.2. Dynamic Configuration
| Method | Endpoint | Role Required | Description |
|---|---|---|---|
| GET | `/config/schedule` | ADMIN | List all schedule config keys |
| PUT | `/config/schedule/{key}` | ADMIN | Update a config value |
| GET | `/config/slots` | ADMIN | List all slot templates |
| GET | `/config/slots/active` | Any | List schedulable slots only |
| POST | `/config/slots` | ADMIN | Create new slot |
| PUT | `/config/slots/{id}` | ADMIN | Update slot |
| DELETE | `/config/slots/{id}` | ADMIN | Deactivate slot |
| GET | `/config/constraints` | ADMIN | List all constraint configs |
| PUT | `/config/constraints/{key}` | ADMIN | Update penalty weight / toggle |

### 1.3. Departments
| Method | Endpoint | Role | Description |
|---|---|---|---|
| GET | `/departments` | Any | List all departments |
| POST | `/departments` | ADMIN | Create department |
| PUT | `/departments/{id}` | ADMIN | Update department |
| DELETE | `/departments/{id}` | ADMIN | Delete department |

### 1.4. Rooms (Infrastructure)
| Method | Endpoint | Role | Description |
|---|---|---|---|
| GET | `/rooms` | Any | List rooms (filter: `?type=LAB`) |
| GET | `/rooms/types` | Any | Distinct room types for dropdowns |
| POST | `/rooms` | ADMIN | Create room |
| PUT | `/rooms/{id}` | ADMIN | Update room |
| DELETE | `/rooms/{id}` | ADMIN | Deactivate room |

### 1.5. Sections
| Method | Endpoint | Role | Description |
|---|---|---|---|
| GET | `/sections` | Any | List (filter: `?deptId&academicYear&semester`) |
| POST | `/sections` | ADMIN, HOD | Create section |
| PUT | `/sections/{id}` | ADMIN, HOD | Update section |
| DELETE | `/sections/{id}` | ADMIN, HOD | Delete section |

### 1.6. Subjects
| Method | Endpoint | Role | Description |
|---|---|---|---|
| GET | `/subjects` | Any | List (filter: `?deptId&semester`) |
| POST | `/subjects` | ADMIN, HOD | Create subject |
| PUT | `/subjects/{id}` | ADMIN, HOD | Update subject (incl. `consecutiveSlotsRequired`) |
| DELETE | `/subjects/{id}` | ADMIN, HOD | Delete subject |

### 1.7. Faculty
| Method | Endpoint | Role | Description |
|---|---|---|---|
| GET | `/faculty` | Any | List (filter: `?deptId`) |
| POST | `/faculty` | ADMIN, HOD | Create faculty |
| PUT | `/faculty/{id}` | ADMIN, HOD | Update (incl. `maxHoursPerWeek`) |
| DELETE | `/faculty/{id}` | ADMIN, HOD | Deactivate faculty |
| GET | `/faculty/{id}/workload-summary` | ADMIN, HOD, FACULTY | Real-time workload from allocations |
| GET | `/faculty/{id}/unavailability` | ADMIN, HOD, FACULTY | List unavailability blocks |
| POST | `/faculty/{id}/unavailability` | ADMIN, HOD | Add unavailability block |
| DELETE | `/faculty/unavailability/{id}` | ADMIN, HOD | Remove block |

### 1.8. Subject Allocations
| Method | Endpoint | Role | Description |
|---|---|---|---|
| GET | `/allocations` | ADMIN, HOD, FACULTY | List (filter: `?deptId&semester`) |
| POST | `/allocations` | ADMIN, HOD | Create allocation |
| PUT | `/allocations/{id}` | ADMIN, HOD | Update hours or faculty |
| DELETE | `/allocations/{id}` | ADMIN, HOD | Remove allocation |
| GET | `/allocations/validate` | ADMIN, HOD | Validate allocation completeness |

### 1.9. Timetable Generation
| Method | Endpoint | Role | Description |
|---|---|---|---|
| POST | `/timetable/generate` | ADMIN, HOD | Trigger solver |
| GET | `/timetable/generations` | ADMIN, HOD | List generation history |
| GET | `/timetable/generations/{id}` | ADMIN, HOD | Generation details + bottleneck report |
| GET | `/timetable/generations/{id}/entries` | ADMIN, HOD | Full entry list |
| POST | `/timetable/generations/{id}/publish` | ADMIN, HOD | Publish draft |
| DELETE | `/timetable/generations/{id}` | ADMIN, HOD | Delete draft generation |

### 1.10. Timetable Viewing & Overrides
| Method | Endpoint | Role | Description |
|---|---|---|---|
| GET | `/timetable/faculty/{id}` | ADMIN, HOD, FACULTY | Faculty personal schedule |
| GET | `/timetable/section/{id}` | ADMIN, HOD, STUDENT | Section timetable |
| GET | `/timetable/department/{id}` | ADMIN, HOD | Department-wide timetable |
| GET | `/timetable/room/{id}` | ADMIN | Room occupancy view |
| POST | `/timetable/entries/validate-swap` | ADMIN, HOD | Pre-flight override check |
| PUT | `/timetable/entries/{id}` | ADMIN, HOD | Commit manual override |

---

## 2. Initial Database Seed Configuration

The `seed-config.sql` file provides sensible default data for a typical 6-period/5-day organization. **This is a starting point only** — Admins are expected to modify it through the UI.

### 2.1. Default `schedule_config` Seed

```sql
INSERT INTO schedule_config (config_key, config_value, description) VALUES
('ACTIVE_DAYS',         'MONDAY,TUESDAY,WEDNESDAY,THURSDAY,FRIDAY', 'Comma-separated working days'),
('ALLOW_SATURDAY',      'false',                                    'Whether Saturday classes are enabled'),
('SEMESTER_LABEL',      'Odd Semester 2026',                        'Current academic term name'),
('ACADEMIC_YEAR_START', '2026-06-01',                               'Academic year start date (ISO format)'),
('ACADEMIC_YEAR_END',   '2026-11-30',                               'Academic year end date (ISO format)');
```

### 2.2. Default `slot_templates` Seed

```sql
INSERT INTO slot_templates (slot_number, label, start_time, end_time, is_break, applies_to_days, is_active) VALUES
(1, 'Period 1',     '09:00:00', '09:55:00', false, 'ALL', true),
(2, 'Period 2',     '10:00:00', '10:55:00', false, 'ALL', true),
(3, 'Period 3',     '11:00:00', '11:55:00', false, 'ALL', true),
(4, 'Short Break',  '12:00:00', '12:15:00', true,  'ALL', true),
(5, 'Period 4',     '12:15:00', '13:10:00', false, 'ALL', true),
(6, 'Lunch Break',  '13:10:00', '14:00:00', true,  'ALL', true),
(7, 'Period 5',     '14:00:00', '14:55:00', false, 'ALL', true),
(8, 'Period 6',     '15:00:00', '15:55:00', false, 'ALL', true);
-- Admin can add/modify these freely through the Config API
```

> Note: The solver automatically identifies only `is_break=false, is_active=true` rows as valid scheduling slots. The seed produces **6 schedulable periods per day** (Periods 1–6) with breaks excluded.

### 2.3. Default `constraint_config` Seed

```sql
INSERT INTO constraint_config (constraint_key, is_hard, penalty_weight, is_active, description) VALUES
-- Hard Constraints (is_hard=true, penalty_weight unused)
('HC_NO_SECTION_CLASH',      true,  0.00, true,  'Section cannot have 2 classes in same slot'),
('HC_NO_FACULTY_CLASH',      true,  0.00, true,  'Faculty cannot teach 2 classes simultaneously'),
('HC_NO_ROOM_CLASH',         true,  0.00, true,  'Room cannot host 2 classes simultaneously'),
('HC_ROOM_TYPE_MATCH',       true,  0.00, true,  'Subject required_room_type must match room type'),
('HC_ROOM_CAPACITY',         true,  0.00, true,  'Room capacity must >= section student count'),
('HC_CONSECUTIVE_BLOCKS',    true,  0.00, true,  'Multi-slot subjects must use consecutive slots'),
('HC_RESPECT_UNAVAILABILITY',true,  0.00, true,  'Faculty unavailability blocks are inviolable'),

-- Soft Constraints (is_hard=false, solver adds penalty_weight per violation)
('SC_FACULTY_WEEKLY_WORKLOAD', false, 20.00, true, 'Penalty per slot exceeding max_hours_per_week'),
('SC_FACULTY_DAILY_GAP',       false,  5.00, true, 'Penalty per idle gap slot in faculty daily schedule'),
('SC_STUDENT_DAILY_GAP',       false,  8.00, true, 'Penalty per idle gap slot in section daily schedule'),
('SC_SUBJECT_DAILY_REPEAT',    false, 15.00, true, 'Penalty when same subject appears more than max_sessions_per_day in one day'),
('SC_SUBJECT_SPREAD',          false, 10.00, true, 'Penalty for uneven weekly distribution of subject sessions');
```

### 2.4. Default Admin User Seed

```sql
INSERT INTO users (full_name, username, email, password, role, is_active) VALUES
('System Administrator', 'admin', 'admin@institution.edu',
 '$2a$12$<bcrypt_hash_of_Admin@123>', 'ADMIN', true);
-- Password: Admin@123 (must be changed on first login)
```

---

## 3. Flyway Migration Strategy

Database changes are managed by **Flyway** with versioned SQL scripts:

```
src/main/resources/db/migration/
├── V1__create_config_tables.sql
├── V2__create_academic_entity_tables.sql
├── V3__create_timetable_tables.sql
├── V4__create_indexes.sql
└── V5__seed_initial_config.sql
```

This ensures:
- Reproducible database setup across environments (dev, test, production).
- Safe incremental schema changes tracked in version control.
- No manual SQL needed to set up a fresh environment.
