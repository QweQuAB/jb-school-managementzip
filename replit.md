# School Management System

A professional, full-featured school management web application built as a single-page application with a clean dark sidebar and modern card-based UI.

## Architecture

- **Frontend:** Vanilla JS single-page application (SPA) in `school-system/public/index.html`
- **Backend:** Express.js server (`server.js`) serving static files
- **Data Storage:** Browser localStorage (all data persists between sessions)
- **Port:** 5000 (webview)

## Features

### Academic Management
- **Students** — Full CRUD with admission numbers, class assignment, parent/guardian info, status tracking
- **Teachers** — Staff management with qualifications, subjects, and staff IDs
- **Classes** — Class groups with capacity tracking and teacher assignment
- **Subjects** — Subject registry with categories (Core/Elective/Vocational) and teacher assignment
- **Assessments** — Score entry (Test 1 /20, Test 2 /20, Exam /60) with automatic grade calculation
- **Attendance** — Class-based daily attendance marking and record viewing
- **Report Cards** — Auto-generated term report cards with attendance summary and signature lines

### Finance Management
- **Fees & Payments** — Payment records with billing/payment/balance tracking and multiple payment methods
- **Arrears** — Auto-filtered view of students with outstanding balances, with badge count in sidebar
- **Bill Generator** — Placeholder section ready to be linked to the existing bill generator

### System
- **Dashboard** — Live stats, class enrollment bars, recent activity feed
- **Settings** — School info, logo upload, academic term/year, grading system, currency, admin details
- **Data Export** — JSON export of all data
- **Print Support** — Print-friendly report cards and tables

## File Structure

```
server.js                    # Express static file server (port 5000)
school-system/
  public/
    index.html               # Complete SPA — all HTML, CSS, and JS in one file
package.json                 # Root package.json with express dependency
jb-school-management/        # Original source material (Electron app — reference only)
```

## Design Language

- **Sidebar:** Dark navy (`#0f172a`) with active state indicators
- **Primary Color:** Blue (`#0d6efd`)
- **Typography:** Inter font
- **Spacing:** 16/20/24/28px rhythm
- **Cards:** White with subtle borders and shadows
- **Badges:** Color-coded (success/warning/danger/info/neutral)

## Bill Generator Integration Points

The Bill Generator section (accessible via sidebar) exposes:
- `data.students` — all student records
- `data.fees` — all fee/payment records
- `data.settings` — school info, currency, current term
- The `currency()` and `fmt()` utility functions for consistent number formatting
