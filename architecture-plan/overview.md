# Architecture Plan: Overview & Architecture
> **Revision 2 — Fully Dynamic System**
> All schedule structure, constraints, limits, and rules are defined and mutated exclusively through the database and REST API. Zero values are hardcoded in the application code.

---

## 1. Core Design Principle: API as Single Source of Truth

Every aspect of the scheduling system — from how many periods exist per day, to whether labs span 2 or 3 consecutive periods, to each faculty member's weekly workload ceiling — is fetched from the database at runtime. The application code contains **no hardcoded constants** for any scheduling parameter.

```mermaid
graph LR
    A[Admin / HOD] -->|Configures via UI| B[REST API]
    B -->|Writes to| C[(MySQL Database)]
    C -->|Runtime read by| D[Solver Engine]
    C -->|Runtime read by| E[Frontend Dashboards]
    style C fill:#1e40af,color:#fff,stroke:#3b82f6
    style D fill:#7c3aed,color:#fff,stroke:#8b5cf6
```

**What the database fully controls:**
| Category | Configurable Parameters |
|---|---|
| **Schedule Structure** | Days active per week, total slots per day, start/end times of every individual slot, which slots are breaks |
| **Rooms** | Type (Classroom / Lab / Seminar Hall / Any custom type), capacity, active status, availability windows |
| **Subjects** | Hours needed per week, whether it requires consecutive multi-slot blocks, minimum and maximum days between repetitions |
| **Faculty** | Maximum weekly teaching hours, preferred teaching days, leave/unavailability slots |
| **Constraints** | Penalty weights for every soft constraint category, hard constraint toggles per department |

---

## 2. Project Vision & Goals

The **Class Timetable Generation System** is an enterprise-grade academic planning platform that models the scheduling problem as a dynamic Constraint Satisfaction Problem (CSP) — where every constraint value, every time boundary, and every resource limit is read from the database at the time the solver is invoked.

### Key Deliverables:
- **Zero-Hardcode Guarantee**: All schedule parameters (slot count, slot times, break positions, lab block sizes, workload ceilings) are fully managed through the Admin UI and stored in the database.
- **Dynamic Constraint Engine**: The solver engine reads and respects current constraint configurations before each run. Changing a constraint in the database immediately takes effect on the next generation request.
- **Clash-Free Scheduling at Scale**: Guaranteed zero double-bookings across classrooms, labs, faculty, and sections — based entirely on runtime data.
- **Fair, Configurable Workload Balancing**: Faculty weekly workload limits are set per-faculty in the database. Penalty weights for exceeding those limits are also stored as system-level configuration, not code.
- **Role-Based Portals**:
  - **Admin**: Full system configuration, timetable generation, manual overrides with live conflict validation, audit trails.
  - **HOD**: Department-scoped configuration, faculty-to-subject mapping, generation triggers for their own department, approval workflows.
  - **Faculty**: Reads only personal allocation view, can flag preferences (preferred days, unavailable slots).
  - **Student**: Reads their section's published timetable, room and instructor details.
- **Manual Override Safety Net**: Admin/HOD can drag-and-drop or click-swap any generated slot. The backend validates the proposed change against all hard constraints before committing.

---

## 3. Technology Stack

```mermaid
graph TD
    subgraph Frontend [Next.js Client — Port 3000]
        A[Next.js 14 App Router + TypeScript]
        B[React Query — API State]
        C[Custom Vanilla CSS — Glassmorphism]
        D[Axios with JWT interceptors]
        A --- B
        A --- C
        A --- D
    end
    subgraph Backend [Spring Boot API — Port 8080]
        E[Spring Boot 3.x Java 17]
        F[Spring Security + JWT]
        G[Spring Data JPA + Hibernate]
        H[Dynamic CSP Solver Engine]
        E --- F
        E --- G
        E --- H
    end
    subgraph DB [MySQL 8.x]
        I[(Schedule Config Tables)]
        J[(Academic Entity Tables)]
        K[(Generated Timetable Tables)]
    end
    Frontend <-->|JSON over REST| Backend
    Backend <-->|Hibernate ORM| DB
```

| Layer | Technology | Rationale |
|:---|:---|:---|
| **Backend Framework** | Spring Boot 3.x (Java 17, Maven) | Powerful DI, JPA, Security, async support; Java ideal for constraint-heavy algorithmic code |
| **Database** | MySQL 8.x | ACID, FK constraints, JSON column support for flexible constraint configs, window functions for workload queries |
| **ORM** | Spring Data JPA + Hibernate | Eliminates SQL boilerplate; manages complex entity graphs (Allocations, Entries, Configs) |
| **Security** | Spring Security + JJWT | Stateless JWT; role-scoped endpoint protection; token refresh support |
| **Frontend** | Next.js 14 (App Router, TypeScript) | SSR for public-facing pages, CSR for dashboards, built-in route protection via middleware |
| **Styling** | Custom Vanilla CSS | Maximum theme control; glassmorphic dark palette; no utility-class lock-in |
| **API Layer** | React Query + Axios | Automatic caching, background refetching, mutation state for generation flows |

---

## 4. High-Level Architecture & Generation Flow

```mermaid
sequenceDiagram
    autonumber
    actor Admin
    participant UI as Next.js UI
    participant API as Spring Boot API
    participant CS as ConfigService
    participant SE as Dynamic CSP Solver
    participant DB as MySQL

    Admin->>UI: Configure slots, rooms, workloads, constraints via UI
    UI->>API: CRUD calls — write all config to DB
    API->>DB: Persist all dynamic configuration

    Admin->>UI: Click "Generate Timetable" for Dept + Academic Year
    UI->>API: POST /api/v1/timetable/generate {deptId, academicYear, semester}
    
    API->>CS: Load full runtime config from DB
    CS->>DB: Fetch slot_templates, constraint_configs, faculty_workload_config
    DB-->>CS: All dynamic parameters returned

    API->>SE: Initialise solver with runtime ConstraintContext
    SE->>DB: Fetch rooms, sections, subject_allocations, faculty_unavailability
    DB-->>SE: All entity data returned

    SE->>SE: Build SessionVariables from allocations
    SE->>SE: Build domain (valid slot+room combos) dynamically from DB data
    SE->>SE: Execute Backtracking MRV/LCV with dynamic penalty weights
    
    alt Solved
        SE-->>API: Return TimetableResult (list of entries)
        API->>DB: Save entries as DRAFT in timetable_entries
        API-->>UI: HTTP 200 + draft schedule JSON
        UI-->>Admin: Interactive schedule grid (drag/drop enabled)
    else Bottleneck Detected
        SE-->>API: SchedulingConstraintException + BottleneckReport
        API-->>UI: HTTP 422 + detailed bottleneck JSON
        UI-->>Admin: Show conflict modal — highlight problematic entities
    end
```

---

## 5. Dynamic Configuration Architecture

The system introduces a **Schedule Configuration** subsystem — a set of database tables that define the rules, not the application code.

```mermaid
graph TD
    A[schedule_config] -->|defines working days| B[slot_templates]
    B -->|defines time boundaries| C[Solver Domain Builder]
    D[constraint_config] -->|penalty weights| C
    E[faculty.max_hours_per_week] -->|weekly ceiling| C
    F[subjects.consecutive_slots_required] -->|lab block size| C
    G[faculty_unavailability] -->|slot exclusions| C
    C --> H[CSP Backtracking Engine]
```

**Configuration Tables Summary:**
1. **`schedule_config`** — Master toggle: active days per week (stored as comma-separated day names), global academic calendar settings per semester.
2. **`slot_templates`** — Every period slot definition (slot number, start time, end time, is_break, applies_to_days). Fully managed by Admin.
3. **`constraint_config`** — Named penalty weights and hard/soft flags per constraint type: `FACULTY_GAP_PENALTY`, `STUDENT_GAP_PENALTY`, `SUBJECT_REPEAT_PENALTY`, etc. Each stored as a configurable float.
4. **`faculty_unavailability`** — Faculty-specific slot blocks (e.g., "Prof X unavailable Monday Slot 1-3 for research"). Treated as a hard constraint by the solver.

---

## 6. Project Duration & Milestones (10 Weeks)

```mermaid
gantt
    title Timetable Generator — Full Dynamic System Timeline
    dateFormat  YYYY-MM-DD
    section Phase 1: Foundation
    DB Schema Design + JPA Entities + Maven Setup       :a1, 2026-06-01, 6d
    Dynamic Config Tables + Slot Template APIs          :a2, after a1, 5d
    section Phase 2: Auth & CRUD Core
    Spring Security JWT Auth Module                     :a3, 2026-06-12, 5d
    CRUD APIs — Depts, Rooms, Sections, Subjects, Faculty :a4, after a3, 7d
    section Phase 3: Allocation & Constraint Config
    Subject Allocation Module (Multi-Faculty Support)   :a5, 2026-06-24, 5d
    Constraint Config CRUD + Workload Config APIs       :a6, after a5, 4d
    Faculty Unavailability Module                       :a7, after a6, 3d
    section Phase 4: The Solver Engine
    Dynamic CSP Session Builder                         :a8, 2026-07-06, 5d
    Backtracking Solver Core + Penalty Scorer           :a9, after a8, 8d
    Solver Edge Case Hardening + Load Testing           :a10, after a9, 4d
    section Phase 5: Frontend Dashboards
    Next.js Setup + CSS Design Tokens + Layout          :a11, 2026-07-20, 5d
    Admin Config Panels (Slots, Rooms, Constraints)     :a12, after a11, 5d
    HOD Allocation + Generation Trigger UI              :a13, after a12, 5d
    Timetable Grid + Manual Override Drag-Drop UI       :a14, after a13, 5d
    Faculty + Student Portals                           :a15, after a14, 4d
    section Phase 6: Testing & Polish
    Integration Testing + Seed Datasets                 :a16, 2026-08-17, 5d
    UI/UX Polish + Edge Case Handling                   :a17, after a16, 5d
```

### Phase Overview:

| Phase | Duration | Focus |
|---|---|---|
| **1 — Foundation** | Week 1–2 | DB schema, JPA setup, dynamic slot template system |
| **2 — Auth & CRUD** | Week 3–4 | JWT security, all entity CRUD APIs |
| **3 — Allocation & Config** | Week 4–5 | Multi-faculty allocations, constraint config, unavailability |
| **4 — Solver Engine** | Week 5–7 | Dynamic CSP builder, backtracking solver, scoring, load tests |
| **5 — Frontend** | Week 7–9 | All 4 role portals, config panels, schedule grid, override UI |
| **6 — QA & Polish** | Week 9–10 | Seed data tests, constraint scenario validation, UI refinement |
