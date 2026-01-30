# Farm Management System – Technical Documentation

## 1) Purpose
- Provide a lightweight, local-first farm expense tracker that will grow into a farm management and decision-support system.
- Current users: data entry staff and farm managers.
- Decision support goal (future): cost visibility by crop/plot and profitability insights optimizing earnings.

## 2) Current Scope (Implemented)
- Expense entry (date, person, description, amount, business unit, optional project name).
- Expense list with delete capability.
- Dashboard summary: totals, remittances vs expenses, business-unit breakdown, project drill-down, and quarterly summaries.
- CSV import with flexible header detection and broader date parsing.

## 3) Target Scope (Planned)
- Crop management (crop registry, varieties, growth stages).
- Plot/location management.
- Linking expenses to one or more crops.
- Harvest tracking (expected vs actual).
- Profitability and cost-per-crop analytics.

## 4) User Roles (Proposed)
- Admin: full access, configuration, data correction.
- Farm Manager: view dashboards, review costs and performance.
- Data Entry: add expenses and crop activities.

## 5) Architecture Overview
- Frontend: static HTML/CSS/JS served via Live Server.
- Backend: FastAPI with SQLite (upgrade to PostgreSQL).
- Data flow: Browser → FastAPI API → SQLite.

## 6) Data Model
**Current**
- Expense: `id`, `date`, `person`, `description`, `amount`, `business_unit`, `project` (optional).

**Planned**
- Crop: type, variety, planting date, growth stage, expected/actual harvest dates.
- Aninmal: mainly used for manure purposes, culls and breeders can be traded as well.
- Plot: location/identifier and optional size.
- CropExpense: link table between crops and expenses (many-to-many).

## 7) API Endpoints
**Current**
- `GET /api/expenses`
- `POST /api/expenses`
- `GET /api/expenses/{id}`
- `PUT /api/expenses/{id}`
- `DELETE /api/expenses/{id}`

**Planned**
- `GET /api/crops`, `POST /api/crops`, `PUT /api/crops/{id}`, `DELETE /api/crops/{id}`
- `GET /api/plots`, `POST /api/plots`
- `POST /api/crops/{id}/expenses` (link)

## 8) UI Pages
**Current**
- Entry page: expense form and list.
- Dashboard: summaries, charts, quarter filter.

**Planned**
- Crop registry page.
- Plot management page.

## 9) Decision Support Logic (Planned)
- Cost per crop = total linked expenses by crop.
- Profitability = crop value (yield × price) − crop cost.
- Alerts for high cost or delayed harvest.

## 10) Data Validation Rules
**Current**
- Required: date, person, description, amount > 0.
- Optional: project.

**Planned**
- Crop lifecycle dates must be logical (planting ≤ harvest).
- Plot name unique.

## 11) Reporting & Metrics
**Current**
- Totals (remittances vs expenses).
- Business unit and project breakdown.
- Quarterly summaries.

**Planned**
- Crop profitability reports.
- Plot utilization.

## 12) Non‑Functional Requirements
- Local development on macOS.
- Data integrity (avoid schema mismatch).
- Safe incremental schema changes.

## 13) Risks & Constraints
- CSV imports can contain inconsistent dates and headers.
- Manual data entry errors.

## 14) Roadmap
**Phase 1**
- Add crop/plot tables and endpoints.
- Add crop selection to expense entry.

**Phase 2**
- Crop registry UI and linking UI.
- Reporting by crop.

**Phase 3**
- Decision support dashboards and alerts.

## 15) Change Log
- 2026-01-28: Added CSV import fixes (path handling and date parsing), dashboard JS modularized, expense form toggle UI, and schema migration helper.
