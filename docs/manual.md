# Seva Platform Manual

Comprehensive reference for developers, operators, and administrators working on the Seva Experience platform.

## Table of contents
1. [Overview](#overview)
2. [System architecture](#system-architecture)
3. [Module map](#module-map)
4. [Environment setup](#environment-setup)
5. [Development workflow](#development-workflow)
6. [Authentication and roles](#authentication-and-roles)
7. [Feature walkthrough](#feature-walkthrough)
8. [Data model reference](#data-model-reference)
9. [Shared services & utilities](#shared-services--utilities)
10. [Security practices](#security-practices)
11. [Working with Firebase](#working-with-firebase)
12. [Deployment guide](#deployment-guide)
13. [Maintenance & operations](#maintenance--operations)
14. [Troubleshooting](#troubleshooting)
15. [Appendix: CLI workflows & commands](#appendix-cli-workflows--commands)

## Overview
Seva is a role-aware form and asset management application that enables squads to design intake workflows, monitor submissions, audit activity, and manage users. The UI is Vite-powered React with Tailwind styling, and Firebase provides authentication, document storage, and file hosting.

Key objectives:
- Provide a guided onboarding experience for the first administrator
- Allow managers to assemble reusable forms and collect submissions
- Give contributors a single place to review and edit their submissions
- Surface real-time dashboards and audit trails for compliance

## System architecture
- **Presentation layer** – React 19 with Suspense-based routing (`src/app/router/router.tsx`) and layouts in `src/app/layouts`. Shared UI primitives live in `src/components/ui`.
- **State & data** – React Query 5 (`src/libs/react-query.ts`) handles Firestore-backed queries and caches. Feature hooks orchestrate queries/mutations.
- **Authentication** – Firebase Auth + `AuthProvider` context (`src/features/authentication/contexts/auth-context.tsx`) manage session state, while `ProtectedRoute` enforces access control.
- **Backend services** – Firestore for forms, submissions, users, audit logs; Firebase Storage for uploads. A `SecureApiClient` abstraction (`src/utils/secure-api-client.ts`) is ready for future HTTP integrations.
- **Cross-cutting concerns** – `AuditService` logs every significant event, `logger` standardises console output, and `ErrorBoundary` guards runtime errors.

## Module map
```
src/
  app/              # Layout shell, navigation, protected routing
  features/
    authentication/ # Auth forms, hooks, services
    admin-setup/    # First-admin bootstrap wizard
    dashboard/      # KPI cards, stats hooks
    form-builder/   # Form designer, list, detail, submissions
    user-management/# User directory, creation workflows
    audit/          # Activity log screens & hooks
  entities/         # TypeScript contracts shared across modules
  libs/             # Firebase, React Query setup
  services/         # FileUploadService and other gateways
  utils/            # Logging, encryption, validation, formatting helpers
  scripts/          # Automations (e.g., `create-admin.ts`)
```

## Environment setup
1. **Install dependencies** (Node.js ≥ 18):
   ```bash
   npm install
   ```
2. **Create Firebase resources:** enable Email/Password auth, Firestore (in native mode), and Storage.
3. **Configure Firebase client:** update `src/libs/firebase.ts` with your project's keys. For secrets hygiene, expose them as `VITE_` variables in `.env.local` and import them in the module.
4. **Optional tooling:** install `firebase-tools` for rule deployment and emulator testing.
5. **Set up local env vars:**
   ```bash
   cp .env.local.example .env.local # create one if you add an example file
   # Populate values such as VITE_FIREBASE_API_KEY, VITE_FIREBASE_PROJECT_ID, etc.
   ```
6. **Bootstrap data:** use the `/admin-setup` route or CLI script to mint the first administrator before inviting others.

## Development workflow
- `npm run dev` – start the Vite dev server with HMR at `http://localhost:5173`
- `npm run lint` – run ESLint (TypeScript + React rules)
- `npm run build` – perform a type check (`tsc -b`) and emit production assets
- `npm run preview` – serve the production bundle locally

Recommended flow:
1. Start `npm run dev`
2. Make feature changes inside the relevant `src/features/<domain>` folder
3. Run `npm run lint` before committing
4. If Firebase schemas change, update the rule/index files and validate in the emulator

## Authentication and roles
Authentication relies on Firebase Email/Password. Role data is stored in the Firestore `users` collection and mirrored client-side via `AuthProvider`.

| Role    | Default permissions (see `src/entities/auth/permissions.types.ts`) |
|---------|-------------------------------------------------------------------|
| `admin` | Full CRUD on assets, users, forms; audit access; admin routes      |
| `manager` | CRUD on assets/forms they own, read access for user management   |
| `user`  | Create/update personal assets/forms; restricted submissions view  |

- `ProtectedRoute` components gate routes by `requiredRole` and redirect unauthorised users.
- `usePermissions` exposes booleans for fine-grained UI control (e.g., show/hide buttons).
- User roles are cached in `localStorage` for quicker nav rendering between reloads.

### Creating administrators
- UI flow: visit `/admin-setup` and complete the guided form.
- CLI: run `bun run src/scripts/create-admin.ts <email> <password> <displayName> [department]`.
Both options create the Firebase Auth user and a Firestore document with the `admin` role and audit entries.

## Feature walkthrough
### Dashboard (`src/features/dashboard/components/dashboard-page.tsx`)
- Displays aggregate metrics (`totalForms`, `activeForms`, `totalSubmissions`, monthly growth).
- Highlights top-performing forms with submission counts.
- Shortcuts for creating a form or viewing the full list.

### Form builder & forms hub (`src/features/form-builder`)
- `form-builder-page.tsx` offers drag ordering, field templates, preview mode, and settings (authentication requirements, confirmation message, submission limits).
- `forms-list-page.tsx` lists all accessible forms with filters and status tags.
- `form-view-page.tsx` renders a form for submission; `form-detail-page.tsx` shows schema metadata; `form-submissions-page.tsx` aggregates responses for managers.
- `my-submissions-page.tsx` lets contributors review, edit, or export their own submissions.
- Services (`form.service.ts`, `form-submission.service.ts`) encapsulate Firestore operations and audit logging.

### User management (`src/features/user-management`)
- `user-management-page.tsx` mixes KPI cards and a detailed table.
- Managers/admins can create users (`create-user-form.tsx`), toggle activation, and adjust roles.
- Hooks (`use-user-management.ts`) wrap React Query mutations with audit calls (`AuditService.logUserCreated`, etc.).

### Audit logs (`src/features/audit`)
- `audit-logs-page.tsx` lists enriched entries with filters for action, user, date range.
- `use-audit-tracker` and `use-session-tracker` automatically record navigation events and session details from `MainLayout`.
- `AuditService` writes to `audit_logs` with metadata (user agent, session id, location).

### Authentication (`src/features/authentication`)
- `login-page.tsx` and `register-page.tsx` rely on `AuthService` for Firebase interactions and `AuditService` logging.
- `AuthProvider` watches `onAuthStateChanged`, hydrates Firestore user docs, and seeds missing documents when new users sign in directly via Firebase.

### Admin setup (`src/features/admin-setup`)
- Guided wizard to create the first admin with friendly feedback and next-step guidance.
- Uses Zod validation and surfaces Firebase Auth errors for duplicates/weak passwords.

## Data model reference
Primary TypeScript contracts live in `src/entities`:
- `auth/auth.types.ts` – `AuthUser`, login/register payloads.
- `auth/permissions.types.ts` – role-to-permission map used by `usePermissions`.
- `form/form.types.ts` – form schema, fields, and settings definitions.
- `form-submission/form-submission.types.ts` – submission payloads, metadata, and status fields.
- `user/user.types.ts` – core user fields (role, department, activation state).
- `audit/audit.types.ts` – audit log structure (`action`, `resourceType`, metadata).

Firestore collections:
- `users` – stored alongside Firebase Auth with role, department, and timestamps.
- `forms` – includes `fields` array (ordered), `settings`, owner, activation flags.
- `form_submissions` – stores `submissionData` and references back to form/user.
- `audit_logs` – tracks all notable events with metadata enriched by `AuditService`.

## Shared services & utilities
- `src/libs/firebase.ts` – initialises primary and admin Firebase app instances; exports `auth`, `db`, `storage`.
- `src/libs/react-query.ts` – centralises Query Client configuration and devtools toggles.
- `src/services/file-upload.service.ts` – upload, delete, and validation helpers for Firebase Storage.
- `src/utils/encryption.ts` & `src/utils/secure-api-client.ts` – AES-256-GCM helpers and HTTP client capable of encrypting payloads.
- `src/utils/logger.ts` – environment-aware console logging with optional persistence in production.
- `src/components/error-boundary.tsx` – reusable error boundary with custom fallbacks.

## Security practices
- Keep Firebase credentials out of source control; prefer `.env.local` and CI secret stores.
- Update `firestore.rules` and `storage.rules` to mirror collection/field changes and run the Firebase emulator before deploying updates.
- `ProtectedRoute` and `usePermissions` provide defence-in-depth, but Firestore security rules are the source of truth.
- Encryption helpers default to AES-GCM; disable or polyfill when running in environments without `crypto.subtle`.
- Audit logging is non-blocking—errors are logged but do not crash workflows; monitor for frequent failures as they may indicate permission issues.

## Working with Firebase
1. **Rules:** keep `firestore.rules` and `storage.rules` aligned with your collections. After edits, run:
   ```bash
   firebase emulators:start --only firestore,storage
   ```
   Use the emulator UI to replay flows and validate read/write access.
2. **Indexes:** update `firestore.indexes.json` whenever composite queries are added (e.g., filters in audit logs).
3. **Deploying:**
   ```bash
   firebase deploy --only firestore:rules,firestore:indexes,storage:rules
   ```
4. **Service accounts:** for server-side scripts, create scoped service accounts instead of sharing admin credentials. The frontend only uses client SDKs.

## Deployment guide
1. Ensure lint and build pass locally: `npm run lint && npm run build`.
2. Provision environment variables in the hosting platform (Vercel is the default target) with the same `VITE_` keys.
3. Configure rewrite rules if hosting behind a proxy; the app uses client-side routing.
4. Deploy the `dist/` folder output. Vercel + Vite default settings are compatible; for other hosts, serve `dist` as static assets with SPA fallback.
5. After deployment, smoke-test using `npm run preview` locally and confirm Firebase rules are deployed.

## Maintenance & operations
- **Dependency updates:** run `npm outdated` periodically. Upgrade in small batches and validate with lint/build.
- **Data migrations:** use feature hooks/services to automate updates; log actions via `AuditService` for traceability.
- **Monitoring:** inspect the `audit_logs` collection for anomalies. In production, integrate `logger.sendToLogService` with an external provider.
- **Backups:** enable automated backups in Firebase for critical collections (`forms`, `form_submissions`).
- **Housekeeping:** clean stale `localStorage` keys if you refactor roles or session metadata.

## Troubleshooting
- **Auth state loops:** ensure the `users` document exists and has `role` set; the `AuthProvider` creates a default doc if missing, but failures are logged to the console.
- **Permission denied (Firestore):** confirm the signed-in user’s role matches the expected permissions and that security rules allow the operation.
- **Form builder missing fields:** check browser console for validation errors; fields require unique IDs and at least one field before saving.
- **Audit logs empty:** verify Firestore rules permit writes to `audit_logs` and that `navigator.userAgent` is available (e.g., not running in Node).
- **Encryption errors:** disable encryption via `SecureApiClient` configuration when running in environments without Web Crypto or supply a polyfill.

## Appendix: CLI workflows & commands
- **Create admin user:** `bun run src/scripts/create-admin.ts <email> <password> <displayName> [department]`
- **Run Firebase emulators:** `firebase emulators:start --only firestore,storage`
- **Deploy Firebase rules/indexes:** `firebase deploy --only firestore:rules,firestore:indexes,storage:rules`
- **Check lint/build in CI:** `npm run lint && npm run build`
- **Preview production bundle locally:** `npm run preview`

Keep this manual alongside the repository and update it whenever the architecture or operational flows evolve.
