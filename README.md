# SALS Security Team — Incident Statement & Incident Report Registry (OEF-23)

Centralized incident statement reporting, registry management, and verification workspace designed for the SALS Security Team. Built to run seamlessly across both Cloudflare Workers (with Cloudflare D1 distributed storage) and standalone Node.js runtimes (with native SQLite).

---

## Key Features & Architecture

### 1. Incident Statement Workspace
- **Standardized OEF-23 Form:** Complete digital form capturing report metadata, supervisor, employee details, passport/ID, department, agency, incident type, location, incident timestamp, asset details, estimated value, status, narrative description, reference information, investigating officer actions/comments, police station details, and recording officer information.
- **Independent Complainant Name:** The employee name and complainant signature name operate completely independently with isolated event handlers, allowing accurate recording when the complainant is not the subject employee.
- **Signature Verification:** On-screen touch canvas elements have been streamlined in favor of dedicated, high-contrast signature spaces on generated PDFs for physical or digital pen execution. Legacy PNG signatures in historical records remain preserved.

### 2. Incident Report Registry
- **Central Registry:** Access all historical reports through the **Incident Report Registry** tab with real-time background polling (every 10 seconds while visible and on window focus). Active form inputs are never overwritten by background synchronizations.
- **Dynamic Navigation:** Header navigation cleanly switches between the active statement editor and the report registry with dynamic document titles.
- **Concurrency & Versioning:** Every report maintains an incremental `_version` attribute. Stale updates or simultaneous edits return conflict warnings rather than silently overwriting another officer's submission.
- **Unique Numeric Numbering:** All reports enforce positive, numeric report numbers.
- **Admin-Only Bulk Deletion:** Administrators can purge reports in bulk with mandatory two-step confirmation (typing `DELETE ALL`) and report-count verification, while protecting existing user accounts.

### 3. Client-Side PDF Generation & Printing
- **Privacy-First In-Browser Generation:** A4 PDF documents are generated entirely in the user's browser using vendored `pdf-lib` (located in `public/vendor/`). No incident details or names are ever transmitted to third-party services.
- **Intelligent Pagination:** Dynamic statement text-fitting and automatic pagination for long narrative entries.
- **Signature Blocks:** Renders two designated signature areas:
  1. *Signature of Complainant*
  2. *Signature of Recording Officer*
- **Audit Attribution:** PDF and print footers explicitly reflect the authenticated user who prepared or exported the draft (`Prepared by: <username>`).

### 4. Authentication & Role-Based Access Control (RBAC)
- **Role Hierarchy:**
  - **Admin:** Full access to reports, user creation, user listing, credential management, bulk report deletion, and credential backup/restore.
  - **Standard User:** Create, view, update, and export assigned incident statements. User management and bulk deletion APIs are strictly blocked.
- **Security Hardening:**
  - Salted PBKDF2-SHA256 password hashing (100,000 iterations).
  - Secure session cookies (`__Host-oef_session`, `SameSite=None`, `Partitioned`, `Secure`, `HttpOnly`) with fallback Authorization Bearer header support for iframe environments.
  - Brute-force throttling per IP (maximum 20 failed login attempts per 15-minute sliding window).
- **Initial Credentials:** First deployment initializes an administrative account with username `admin` and password `admin`.
- **User Account Backup & Restore:** Administrators can export and import user accounts via encrypted/hashed JSON backups.

### 5. Login Interface & Brand Presentation
- **SALS Security Branding:** Prominent, centered SALS emblem above the credentials box.
- **Clean Credentials Card:** Focused sign-in form with clear error handling.
- **Support Notice:** Centered administrator assistance contact text (`Need an account? Contact your administrator.`).
- **Version Badge:** Centered application version badge located beneath the help notice (`v1.0.0`). Dynamically verified via the public `/api/version` endpoint.
- **Legal & Property Notice:** Official property statement centered beneath the login card:
  > *© 2026 SALS Security Team. All rights reserved.*  
  > *This is the property of SALS Security Team and may not be reproduced, distributed, or used without prior written authorization.*

---

## Dual Deployment & Runtime Environments

### A. Cloudflare Workers & D1 (Production Edge)
The application is configured as a Cloudflare Worker using Wrangler with static asset bindings:
- **Worker Configuration:** `wrangler.jsonc` declaring Worker `oef-23`, asset directory `./public`, and D1 database binding `DB` (`oef-23-reports`).
- **Worker Entry Point:** `src/worker.mjs` serving `/api/*` endpoints and passing static assets through `env.ASSETS`.
- **Automatic Schema Initialization:** Database tables (`reports`, `users`, `sessions`, `login_limits`) are provisioned automatically on the first API request.
- **Deploy Command:**
  ```bash
  npm run deploy
  # or
  npx wrangler deploy
  ```

### B. Standalone Node.js Runtime (Development / Cloud Run)
The application includes a self-contained Node.js HTTP server:
- **Server Entry Point:** `server.mjs` running on `PORT 3000` (`0.0.0.0`).
- **Native SQLite:** Powered by Node.js built-in `node:sqlite` (`DatabaseSync`), adapting queries to match Cloudflare D1's Promise-based API.
- **Development & Start Commands:**
  ```bash
  # Start local development server
  npm start
  # or
  npm run dev
  ```

---

## API Endpoints

| Method | Route | Access | Description |
|---|---|---|---|
| `GET` | `/api/version` | Public | Returns build number, app version, and formatted display string. |
| `POST` | `/api/login` | Public | Authenticates credentials with rate-limiting; sets session token. |
| `POST` | `/api/logout` | Authenticated | Revokes current session token server-side. |
| `GET` | `/api/session` | Authenticated | Validates session token and returns active user profile. |
| `GET` | `/api/reports` | Authenticated | Retrieves all reports sorted descending by report number. |
| `POST` | `/api/reports` | Authenticated | Creates a new report record; assigns authenticated `preparedBy`. |
| `PUT` | `/api/reports/:id` | Authenticated | Updates an existing report with optimistic concurrency validation. |
| `DELETE` | `/api/reports/:id` | Authenticated | Deletes an individual report with version verification. |
| `DELETE` | `/api/reports` | Admin only | Bulk purges all reports (requires confirmation and count). |
| `GET` | `/api/users` | Admin only | Lists all registered accounts and assigned roles. |
| `POST` | `/api/users` | Admin only | Creates a new user account with specified role. |
| `GET` | `/api/backup-users` | Admin only | Exports JSON credential backup of all users. |
| `POST` | `/api/restore-users`| Admin only | Restores user accounts from a valid backup file. |

---

## Verification & Automated Tests

Run the full automated test suite using:
```bash
npm test
```

The test runner validates:
1. **`tests/signatures.cjs`:** Asserts removal of on-screen canvas inputs, validates double signature areas in generated PDFs, and verifies historical signature image preservation.
2. **`tests/pdf.cjs`:** Validates client-side A4 PDF output, statement auto-pagination, report registry export, and print dialog controls.
3. **`tests/shared.mjs`:** Comprehensive SQLite/D1 integration suite verifying multi-user read/write isolation, concurrent update conflicts, bulk deletion guards, credential hashing, session expiration, and role escalation prevention.
