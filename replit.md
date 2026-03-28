# School Management System

A professional, full-featured school management web application built for Ghanaian schools (Primary to JHS).

## Architecture

- **Backend:** Node.js + Express on port 5000
- **Database:** SQLite via `better-sqlite3` (file-based, stored at `school-system/db/school.db`)
- **Frontend:** Vanilla HTML/CSS/JS single-page application
- **API:** RESTful JSON API (all routes under `/api/`)

> Note: The original project used Microsoft Access (.accdb) on Windows via Electron/ODBC. Since this runs on Linux, SQLite is used instead — it is equally file-based and portable. Data can be exported to JSON and imported into Access if needed.

## File Structure

```
server.js                  - Express server + SQLite API backend
school-system/
  db/school.db             - SQLite database (auto-created on first run)
  public/
    index.html             - Main SPA (HTML + CSS)
    js/
      app.js               - Frontend logic (API calls, CRUD, UI)
      timetable.js         - Timetable generator module
package.json
```

## Features

### Academic Management
- **Students** — Enrollment, CRUD, profile view, search/filter, admission number auto-generation
- **Teachers** — Staff records, qualifications, subject assignment, staff ID auto-generation
- **Classes** — Class management with teacher assignment, capacity tracking, enrollment counts
- **Subjects** — Subject catalogue with code, category (Core/Elective/Vocational), teacher link
- **Assessments** — Record Test 1/Test 2/Exam scores (20/20/60), auto-grade calculation (A-F)
- **Attendance** — Mark attendance per class per day; view/filter records
- **Report Cards** — Auto-generated term report cards with scores, grades, attendance summary

### Timetable Generator
- **Period Setup** — Configure your school day (period names, times, breaks/recess)
- **Teacher Configuration** — Per-teacher settings:
  - Type: Full-time (Permanent) or Part-time
  - Available days (Mon–Fri, checkboxes for part-timers)
  - Max periods per day
  - Is class teacher (and which class)
  - Subject assignments per class (periods per week + contact hours)
- **Auto-generation** — Greedy constraint-based algorithm places subjects respecting teacher availability and max periods per day; conflicts flagged with ⚠
- **View modes** — By Class or By Teacher
- **Print** — Branded timetable print with school logo, motto, and signatures

### Class List Printing
- Opens a branded print window with:
  - School logo at the top and bottom
  - School motto and contact info on the right
  - Full class list table (name, admission no., gender, DOB, parent, contact)
  - Signature lines for Class Teacher and Head Teacher

### Finance
- **Fees & Payments** — Record billed/paid amounts, method, balance auto-calculated
- **Arrears** — Filtered view of students with outstanding balances; print list
- **Bill Generator** — Connect to "School Billing Assistant" app via URL setting

### Setup Wizard
- First-run multi-step wizard (4 steps):
  1. School info (name, motto, address, phone, email)
  2. Academic settings (term, year, currency, admission prefix)
  3. Administrator details
  4. Billing app URL (optional integration)
- Dismissable at any time; re-openable via the ⚙ button in the topbar
- Saves all data to SQLite settings table

### Settings
- School information (name, motto, address, logo upload)
- Academic settings (current term, year, currency, standard fee, grading)
- Billing Assistant URL integration
- Administrator details
- Data export (JSON) and reset

## API Routes

| Method | Route | Description |
|--------|-------|-------------|
| GET/PUT | `/api/settings` | School settings |
| GET | `/api/stats` | Dashboard statistics |
| GET | `/api/activity` | Recent activity log |
| GET/POST/PUT/DELETE | `/api/students/:id` | Student CRUD |
| GET/POST/PUT/DELETE | `/api/teachers/:id` | Teacher CRUD |
| GET/POST/PUT/DELETE | `/api/classes/:id` | Class CRUD |
| GET/POST/PUT/DELETE | `/api/subjects/:id` | Subject CRUD |
| GET/POST/DELETE | `/api/assessments/:id` | Assessment CRUD |
| GET/POST/DELETE | `/api/fees/:id` | Fee CRUD |
| GET/POST/DELETE | `/api/attendance/:id` | Attendance CRUD |
| GET/POST | `/api/timetable/periods` | School periods config |
| GET/POST/DELETE | `/api/timetable/config` | Teacher timetable config |
| GET/POST | `/api/timetable/slots` | Generated timetable slots |
| GET | `/api/export` | Export all data as JSON |

## Database Schema

Tables: `settings`, `counters`, `activity`, `students`, `teachers`, `classes`, `subjects`, `assessments`, `fees`, `attendance`, `timetable_periods`, `timetable_teacher_meta`, `timetable_assignments`, `timetable_slots`
