# Architecture Plan: Module-by-Module Plan
> **Revision 2 — Fully Dynamic System Modules**
> All schedule parameters (slot count, lab block sizes, workload limits, penalty weights, working days) are managed via API and stored in the database. No hardcoded constants exist anywhere in the application.

---

## Module 0: Dynamic Schedule Configuration (Foundation)
> **New module.** This must be completed first — all other modules and the solver depend on the data produced here.

Sets up the Admin-managed configuration subsystem that drives everything else in the system.

### 1. Backend Specifications

**Entities:** `ScheduleConfig`, `SlotTemplate`, `ConstraintConfig`

**`ScheduleConfig` API — Key-Value Store:**
- `GET /api/v1/config/schedule` — Returns all config entries as `{key, value, description}` list.
- `PUT /api/v1/config/schedule/{key}` — Updates a specific config value (Admin only).
  - Example: `PUT /api/v1/config/schedule/ACTIVE_DAYS` with body `{"value": "MONDAY,TUESDAY,WEDNESDAY,THURSDAY,FRIDAY,SATURDAY"}`

**`SlotTemplate` API — Period/Slot Definitions:**
- `GET /api/v1/config/slots` — Returns all slot templates ordered by `slot_number`.
- `GET /api/v1/config/slots/active` — Returns only schedulable slots (`is_break=false`, `is_active=true`).
- `POST /api/v1/config/slots` — Creates a new period slot.
  ```json
  {
    "slotNumber": 7,
    "label": "Period 6",
    "startTime": "15:00",
    "endTime": "15:55",
    "isBreak": false,
    "appliesToDays": "MONDAY,TUESDAY,WEDNESDAY,THURSDAY"
  }
  ```
- `PUT /api/v1/config/slots/{id}` — Modifies an existing slot (time, label, active status).
- `DELETE /api/v1/config/slots/{id}` — Soft-deactivates a slot (`is_active = false`). Does not delete if referenced by published timetable entries.

**`ConstraintConfig` API — Penalty Weight and Hard/Soft Toggles:**
- `GET /api/v1/config/constraints` — Returns all constraints with current `is_hard`, `penalty_weight`, `is_active`.
- `PUT /api/v1/config/constraints/{key}` — Updates penalty weight or toggles active status.
  ```json
  { "penaltyWeight": 12.5, "isActive": true }
  ```
- Constraint keys are seeded by `seed-config.sql`. Admins can only update values, not create new constraint types (constraint types are application-defined — only their weights/activation are DB-managed).

**`ScheduleConfigService` typed accessors:**
```java
public class ScheduleConfigService {
    public List<String> getActiveDays();               // Parses 'MONDAY,TUESDAY,...'
    public String getSemesterLabel();
    public LocalDate getAcademicYearStart();
    public LocalDate getAcademicYearEnd();
    public boolean isSaturdayAllowed();
}
```

### 2. Frontend Specifications — Admin Config Panel (`/dashboard/admin/config/`)

**`/config/slots` — Slot Template Editor:**
- Displays all slots in a sortable table: slot number, label, start time, end time, applies-to-days, break toggle.
- Inline editing: click any row field to edit in place.
- "Add Slot" button opens a modal with all fields.
- Break slots highlighted with a visual indicator. Inactive slots shown as strikethrough.
- Real-time preview panel: shows a visual daily schedule timeline updating as slots are saved.

**`/config/constraints` — Constraint Weight Manager:**
- Displays all constraint keys in two groups: `HARD CONSTRAINTS` (toggles only) and `SOFT CONSTRAINTS` (toggle + numeric weight slider + input).
- Soft constraint weight input: number field + drag slider (0.0 to 100.0).
- Enabling/disabling hard constraints shows a confirmation warning: _"Disabling HC_ROOM_CAPACITY may allow classrooms to be overbooked. Confirm?"_
- Animated save status feedback.

**`/config/schedule` — Working Days & Calendar:**
- Checkbox toggles for each day of the week (Mon–Sat).
- Academic year date range picker.
- Semester label text input.

### 3. Verification Checklist
- [ ] Add 6 slots Mon–Fri, 5 slots on Friday only. Verify solver domain builder returns correct slot sets per day.
- [ ] Set `SC_FACULTY_DAILY_GAP` penalty to 0. Verify solver stops penalizing faculty gaps.
- [ ] Toggle `HC_ROOM_CAPACITY = false`. Verify solver accepts a room with capacity < section count (with appropriate UI warning).
- [ ] Deactivate a slot that is referenced by a published entry. Verify API returns `409 Conflict` with explanation.

---

## Module 1: Authentication & Role-Based Access Control

### 1. Backend Specifications

**Entities:** `User`

**Endpoints:**
- `POST /api/v1/auth/login` — Returns JWT token, role, userId, departmentId (if HOD/Faculty/Student), fullName.
- `POST /api/v1/auth/register` — Admin-only. Creates user account with role + optional department assignment.
- `GET /api/v1/auth/me` — Validates token, returns current user's profile.
- `PUT /api/v1/auth/change-password` — Self-service password update.

**Role Permission Matrix:**

| Endpoint Group | ADMIN | HOD | FACULTY | STUDENT |
|---|---|---|---|---|
| Config APIs (slots, constraints) | ✅ Full CRUD | ❌ | ❌ | ❌ |
| Departments CRUD | ✅ Full | ❌ | ❌ | ❌ |
| Rooms CRUD | ✅ Full | ❌ | ❌ | ❌ |
| Sections CRUD | ✅ Full | ✅ Own Dept | ❌ | ❌ |
| Subjects CRUD | ✅ Full | ✅ Own Dept | ❌ | ❌ |
| Faculty CRUD | ✅ Full | ✅ Own Dept | ❌ | ❌ |
| Allocations CRUD | ✅ Full | ✅ Own Dept | 🔍 View only | ❌ |
| Unavailability | ✅ Full | ✅ Own Dept | ✅ Own | ❌ |
| Timetable Generate | ✅ Full | ✅ Own Dept | ❌ | ❌ |
| Timetable Override | ✅ Full | ✅ Own Dept | ❌ | ❌ |
| Timetable View | ✅ Full | ✅ Own Dept | ✅ Own only | ✅ Own section |

### 2. Frontend Specifications
- Next.js middleware (`middleware.ts`) reads JWT role from decoded token and redirects unauthorized role access.
- `LoginPage` — glassmorphic full-page card, animated fields, role-specific redirect on success.
- Role badge rendered in Navbar showing current user's active role.

### 3. Verification Checklist
- [ ] Faculty token accessing `POST /generate` returns `403 Forbidden`.
- [ ] HOD token accessing another department's timetable returns `403 Forbidden`.
- [ ] Expired JWT returns `401 Unauthorized` with clear error.

---

## Module 2: Academic Entity Management (Infrastructure & Academics)

### 1. Backend Specifications

**Entities:** `Department`, `Room`, `Section`, `Subject`, `Faculty`

**Key Dynamic Behaviors (no hardcoding):**
- Room types (`room_type` field) are stored as free-text `VARCHAR`. No application ENUM. The UI reads distinct room types from the DB to populate dropdowns dynamically.
- Subject `consecutive_slots_required` is an integer field editable via API — no code change needed to change lab block size.
- Faculty `max_hours_per_week` is set individually per faculty record — no global constant.
- Section `academic_year` is an unconstrained integer — supports any number of years (1 through N).

**Endpoints (for each entity, standard REST):**

`/api/v1/departments` — Full CRUD  
`/api/v1/rooms` — Full CRUD + `GET /api/v1/rooms/types` (returns distinct room_type values for dynamic dropdowns)  
`/api/v1/sections?deptId&academicYear&semester` — Full CRUD + filtering  
`/api/v1/subjects?deptId&semester` — Full CRUD  
`/api/v1/faculty?deptId` — Full CRUD + `GET /api/v1/faculty/{id}/workload-summary` (real-time weekly hours total)

**Workload Summary Response (computed from current allocations):**
```json
{
  "facultyId": 12,
  "name": "Prof. Suresh",
  "maxHoursPerWeek": 18,
  "allocatedHoursPerWeek": 14,
  "remainingCapacity": 4,
  "allocationBreakdown": [
    { "subjectName": "DBMS", "sectionName": "CSE-2A", "hours": 3 },
    { "subjectName": "OS",   "sectionName": "CSE-2B", "hours": 4 }
  ]
}
```

### 2. Frontend Specifications
- **Room Type** dropdown is populated via `GET /api/v1/rooms/types` — new types appear automatically.
- **Subject Form**: Includes `consecutiveSlotsRequired` number input (1=theory, 2/3=lab blocks) and `requiredRoomType` dropdown (loaded from rooms API).
- **Faculty Card**: Shows animated workload progress bar (`allocatedHoursPerWeek / maxHoursPerWeek`), colored green/yellow/red based on load percentage.

### 3. Verification Checklist
- [ ] Create a custom room type `DRAWING_HALL`. Verify it appears in Subject form's room type dropdown without any code changes.
- [ ] Create a subject with `consecutiveSlotsRequired = 3`. Verify solver assigns 3 consecutive slots.
- [ ] Set a faculty's `maxHoursPerWeek = 10`. Allocate 11 hours. Verify workload summary shows overflow warning.

---

## Module 3: Faculty Unavailability & Preference Management

### 1. Backend Specifications

**Entity:** `FacultyUnavailability`

**Endpoints:**
- `GET /api/v1/faculty/{id}/unavailability` — Returns all unavailability blocks for a faculty member.
- `POST /api/v1/faculty/{id}/unavailability` — Registers a new unavailability block.
  ```json
  {
    "dayOfWeek": "WEDNESDAY",
    "slotTemplateId": 5,
    "reason": "Research Lab",
    "effectiveFrom": "2026-06-01",
    "effectiveTo": null
  }
  ```
- `DELETE /api/v1/faculty/unavailability/{id}` — Removes the block.
- `GET /api/v1/departments/{deptId}/unavailability` — HOD view: all unavailability in the department.

**Solver Integration:**  
`ConstraintContextBuilder` fetches all active unavailability entries at solver startup and builds:
```java
Map<Long, Set<String>> facultyBlockedSlots
// key = facultyId
// value = Set of "WEDNESDAY_5" (day + slotTemplateId concatenated)
```
`HardConstraintChecker.isUnavailable(facultyId, day, slotId)` checks this map in O(1).

### 2. Frontend Specifications
- **HOD `Unavailability` page**: Visual weekly grid per faculty. Blocked slots shown with shaded cells. Click empty cell → quick-add unavailability form. Click filled cell → remove option.
- **Faculty personal page**: Can view their own blocked slots. HOD/Admin can edit.

### 3. Verification Checklist
- [ ] Mark Prof. X as unavailable on `MONDAY Slot 2`. Generate timetable. Verify Prof. X has no class assigned on Monday Slot 2.
- [ ] Remove the unavailability. Regenerate. Verify Monday Slot 2 is now eligible for Prof. X.

---

## Module 4: Subject Allocation (Multi-Faculty & Workload Split)

### 1. Backend Specifications

**Entity:** `SubjectAllocation`

**Endpoints:**
- `GET /api/v1/allocations?deptId={id}&semester={sem}` — All allocations for department.
- `POST /api/v1/allocations` — Create allocation (one faculty-to-subject-section entry).
  ```json
  {
    "subjectId": 7,
    "sectionId": 3,
    "facultyId": 12,
    "allocatedHoursPerWeek": 2
  }
  ```
- `PUT /api/v1/allocations/{id}` — Update allocated hours or change assigned faculty.
- `DELETE /api/v1/allocations/{id}` — Remove allocation.
- `GET /api/v1/allocations/validate?subjectId={id}&sectionId={id}` — Validates that all allocation rows for this subject-section correctly sum to the subject's `hours_per_week`.

**Validation Response:**
```json
{
  "subjectId": 7,
  "subjectName": "Computer Networks",
  "requiredHoursPerWeek": 4,
  "allocatedTotal": 3,
  "isComplete": false,
  "deficit": 1,
  "allocations": [
    { "facultyName": "Prof. Anand", "allocatedHours": 2 },
    { "facultyName": "Prof. Maya",  "allocatedHours": 1 }
  ]
}
```

### 2. Frontend Specifications

**`AllocationMatrix.tsx`:**
- Grid view: rows = subjects, columns = sections. Each cell shows the list of faculty allocated to that subject-section combo.
- Color coding: green (allocation complete, hours match), yellow (partially allocated), red (unallocated).
- Click any cell → side drawer opens with faculty allocation form.
- Faculty dropdown in form shows only active faculty in the department with remaining weekly capacity > 0.
- Hours input auto-validates against subject's `hours_per_week`.

**`WorkloadBar.tsx`:**
- Live-updated bar for each faculty showing `allocatedHoursPerWeek / maxHoursPerWeek`.
- Tooltip shows breakdown by subject + section.

### 3. Verification Checklist
- [ ] Allocate 2 hrs to Prof. A and 2 hrs to Prof. B for the same subject (4 hrs/week). Validate endpoint returns `isComplete: true`.
- [ ] Set Prof. A's `maxHoursPerWeek = 5`. Allocate 6 hours total. Verify workload bar shows red overflow.
- [ ] Attempt generating timetable with incomplete allocations. Verify API returns validation error listing unallocated subjects.

---

## Module 5: Timetable Generation Engine

### 1. Backend Specifications

**Orchestration Flow in `TimetableService.generate()`:**
1. Validate all subject allocations are complete (`allocatedTotal == hours_per_week` for all).
2. `ConstraintContextBuilder.build(deptId, semester)` — load all config, constraints, unavailability from DB.
3. `SessionVariableBuilder.build(allocations, ctx)` — expand allocations into `SessionVariable` list using `consecutive_slots_required` from DB.
4. `TimetableSolver.solve(variables, rooms, ctx)` — run backtracking. Each call to the solver is pure Java in-memory; no DB calls during search (all data pre-loaded).
5. On success: persist `TimetableGeneration` + `TimetableEntry` records to DB with status `DRAFT`.
6. On failure: persist `TimetableGeneration` with status `FAILED` + `bottleneck_report` JSON.

**Endpoints:**
- `POST /api/v1/timetable/generate` — Triggers generation.
  ```json
  {
    "departmentId": 2,
    "academicYear": 2,
    "semester": 3
  }
  ```
- `GET /api/v1/timetable/generations?deptId={id}` — History of all generation runs (status, duration, timestamps).
- `GET /api/v1/timetable/generations/{id}` — Full details including `bottleneckReport` JSON.
- `GET /api/v1/timetable/generations/{id}/entries` — Full timetable entry list for a generation.
- `POST /api/v1/timetable/generations/{id}/publish` — Promotes DRAFT → PUBLISHED.
- `DELETE /api/v1/timetable/generations/{id}` — Deletes a DRAFT generation (cannot delete PUBLISHED).

**Generation Response (success):**
```json
{
  "generationId": 45,
  "status": "DRAFT",
  "solverDurationMs": 1243,
  "totalEntriesCreated": 138,
  "sectionsScheduled": 6,
  "message": "Timetable generated successfully. Review and publish when ready."
}
```

**Generation Response (failure):**
```json
{
  "generationId": 46,
  "status": "FAILED",
  "solverDurationMs": 8540,
  "bottleneckReport": {
    "type": "UNSOLVABLE",
    "bottlenecks": [
      {
        "category": "RESOURCE_SHORTAGE",
        "entityType": "ROOM",
        "description": "Only 1 LAB room available for 3 sections needing simultaneous lab sessions."
      }
    ],
    "suggestedActions": [
      "Add 2 more LAB rooms or stagger lab session requirements across different days."
    ]
  }
}
```

### 2. Frontend Specifications

**`GenerationControl.tsx`:**
- Department + academic year + semester selectors (loaded from DB).
- "Generate Timetable" button with animated pulsing loader during execution.
- Success: auto-navigates to draft timetable grid view.
- Failure: expands `BottleneckReport.tsx` panel listing each issue as an actionable card.

**`BottleneckReport.tsx` (NEW):**
- Renders each bottleneck as a card: category badge, description, and suggested action.
- "Fix It" shortcuts: clicking a bottleneck card navigates to the relevant config page (e.g., Rooms page for `RESOURCE_SHORTAGE/ROOM`).

### 3. Verification Checklist
- [ ] Generate timetable with 0 allocated subjects. Verify `400 Bad Request` with message listing missing allocations.
- [ ] Generate with 2 sections needing simultaneous lab but only 1 lab. Verify `FAILED` status + bottleneck JSON describing room shortage.
- [ ] Full generate with 3 departments, 12 sections, 40 subjects. Verify zero overlaps in DB using:
  ```sql
  SELECT faculty_id, day_of_week, slot_template_id, COUNT(*)
  FROM timetable_entries WHERE generation_id = {id}
  GROUP BY faculty_id, day_of_week, slot_template_id
  HAVING COUNT(*) > 1;
  -- Must return 0 rows
  ```

---

## Module 6: Timetable Viewing, Overrides & Role Portals

### 1. Backend Specifications

**Override Endpoints:**
- `POST /api/v1/timetable/entries/validate-swap` — Pre-flight check before committing a swap.
  ```json
  {
    "entryId": 201,
    "newDay": "TUESDAY",
    "newSlotTemplateId": 4,
    "newRoomId": 8
  }
  ```
  Response: `{ "isValid": true }` or `{ "isValid": false, "violations": ["Room 8 occupied on TUESDAY Slot 4"] }`

- `PUT /api/v1/timetable/entries/{id}` — Commits override (only after validation passes).
  ```json
  {
    "newDay": "TUESDAY",
    "newSlotTemplateId": 4,
    "newRoomId": 8,
    "overrideReason": "Room maintenance on original slot"
  }
  ```
  Sets `is_manually_overridden = true`, records `override_by` userId and `override_reason`.

**Role-Scoped View Endpoints:**
- `GET /api/v1/timetable/faculty/{facultyId}?generationId={id}` — Faculty's personal entries only.
- `GET /api/v1/timetable/section/{sectionId}?generationId={id}` — Student's section entries only.
- `GET /api/v1/timetable/department/{deptId}?generationId={id}` — Full department timetable (Admin/HOD).
- `GET /api/v1/timetable/room/{roomId}?generationId={id}` — Room occupancy view (Admin).
- `GET /api/v1/timetable/faculty/{facultyId}/workload-actual?generationId={id}` — Actual assigned hours this generation.

**Audit Trail**: All overridden entries include `is_manually_overridden`, `override_reason`, `override_by`, and `updated_at`. Admin can filter entries by `is_manually_overridden = true` for full audit view.

### 2. Frontend Specifications

**Admin/HOD — `TimetableGrid.tsx`:**
- Dual-axis grid view: **Section vs Time** (rows = time slots, columns = sections) or **Room vs Time** (configurable toggle).
- Slot cells show: subject abbreviation, faculty name, room name. Color-coded by subject type.
- Manually overridden cells have a distinct visual marker (e.g., a small yellow dot or asterisk badge).
- Click any cell → detail popover with full entry info + "Move to Another Slot" button.
- Drag-and-drop: drag a cell to another empty cell → triggers `validate-swap` API → shows green/red indicator → confirm dialog → commits on confirm.
- Publish button with confirmation dialog: "Publishing locks this timetable and makes it visible to faculty and students."

**Faculty Portal:**
- Personal weekly calendar showing only own sessions.
- Workload summary card: `X hours this week / Y max hours`.
- No editing capability; read-only.

**Student Portal:**
- Section timetable grid, pre-filtered to their section.
- Shows slot times (loaded from `slot_templates`), room names, faculty names, subject names.
- "Download PDF" button generates a printable timetable view.
- No editing capability; read-only.

### 3. Verification Checklist
- [ ] Swap Entry 201 from Monday Slot 3 to Monday Slot 4 where another class already exists. Verify validate-swap returns `isValid: false` with collision description.
- [ ] Valid swap: move Entry 201 to empty slot. Verify `is_manually_overridden = true` in DB.
- [ ] Faculty token accessing `/timetable/section/{sectionId}` returns `403 Forbidden`.
- [ ] Student token accessing all department entries returns `403 Forbidden`.
- [ ] Published timetable: verify `slot_template` start/end times dynamically drive the display (change a slot time in DB → immediately reflected in next load without code change).

---

## Cross-Cutting API Design Standards

| Concern | Standard |
|---|---|
| **Response Envelope** | All responses wrapped: `{ "success": true, "data": {...}, "message": "..." }` |
| **Error Format** | `{ "success": false, "error": "VALIDATION_ERROR", "details": ["field errors"] }` |
| **Pagination** | All list endpoints support `?page=0&size=20&sort=createdAt,desc` |
| **Versioning** | All endpoints under `/api/v1/` |
| **Documentation** | Swagger UI auto-generated at `/swagger-ui.html` (springdoc-openapi) |
| **CORS** | Configured in `AppConfig.java` to allow Next.js frontend origin |
