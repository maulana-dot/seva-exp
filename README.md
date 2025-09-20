# Seva Experience Platform

Seva is an internal-facing React + Firebase application for managing digital asset intake, dynamic forms, and operational oversight. The app bundles a form builder, submission workflows, audit logging, and user administration into a single workspace so managers and admins can standardise processes across squads.

## Features
- Role-aware routing with protected layouts for admins, managers, and contributors
- Authentication, registration, and first-admin bootstrap backed by Firebase Auth
- Form builder with drag ordering, field presets, preview mode, and per-form settings
- Submission management including personal history, manager oversight, and inline edits
- User management dashboards with activation controls, role updates, and asset visibility
- Real-time dashboards with top-form analytics and growth metrics sourced from Firestore
- Comprehensive audit logging for authentication, form, and user events
- Shared services for secure API calls, AES-GCM payload encryption, and Firebase Storage uploads

## Tech Stack
- React 19, TypeScript, Vite 7
- React Router 7 for routing, Suspense-based code splitting
- React Query 5 for data fetching and caching
- Tailwind CSS 4 with Radix UI primitives and custom component wrappers
- Firebase (Auth, Firestore, Storage)
- React Hook Form + Zod validation, Sonner toast notifications

## Getting Started
### Prerequisites
- Node.js 18 LTS or newer
- npm 9+ (preferred); Bun is supported for scripts such as `create-admin`
- Firebase project with Authentication, Firestore, and Storage enabled
- Optional: `firebase-tools` CLI for emulators and rule deployment

### Installation
```bash
npm install
```

### Environment configuration
Firebase client configuration currently lives in `src/libs/firebase.ts`. Replace the placeholder values with your project credentials before running the app. For cleaner secrets management, you can expose `VITE_` variables in `.env.local` and import them in `src/libs/firebase.ts`.

Update the security artefacts whenever you adjust Firestore or Storage data contracts:
- `firestore.rules`
- `firestore.indexes.json`
- `storage.rules`

Run `firebase emulators:start --only firestore,storage` to verify changes locally.

## Development workflows
- `npm run dev` – start the Vite dev server at `http://localhost:5173`
- `npm run lint` – run ESLint across the project
- `npm run build` – type-check (`tsc -b`) and build a production bundle
- `npm run preview` – serve the production bundle locally for smoke-testing

### Creating the first admin
Visit `/admin-setup` in a freshly bootstrapped environment or run the Bun script:
```bash
bun run src/scripts/create-admin.ts <email> <password> <displayName> [department]
```
Both options seed an `admin` role user with an accompanying Firestore document.

## Project structure
```
src/
  app/          # Layouts, routing, protected navigation
  assets/       # Static assets consumed by the app
  components/   # Shared UI primitives (buttons, tables, cards, etc.)
  entities/     # Type definitions for core domain models
  features/     # Feature modules (auth, dashboard, form-builder, audit, users, admin-setup)
  lib/ & libs/  # Cross-cutting libraries (Firebase, React Query)
  services/     # External service wrappers (e.g., file uploads)
  utils/        # Helpers for logging, encryption, formatting, validation
  scripts/      # Node/Bun automation such as create-admin
```

## Firebase collections at a glance
- `users` – role, department, lifecycle flags for each authenticated user
- `forms` – form metadata, schema definition, and settings
- `form_submissions` – submission payloads keyed by form/user
- `audit_logs` – enriched audit entries for auth, form, and user activities

## Additional documentation
A detailed operations and developer manual lives at `docs/manual.md`.

## Contributing
Follow the repository guidelines:
- Use TypeScript with 2-space indentation and sorted imports
- Keep logic close to its consumer (`src/features` first, then shared folders)
- Run `npm run lint` before committing changes
- Follow Conventional Commits when preparing commits and PRs

## Troubleshooting
- **Firebase permission errors** – double-check the credential object in `src/libs/firebase.ts` and ensure the authenticated user has the required role in Firestore.
- **Forms missing from dashboards** – verify that `AuditService` writes succeed and that Firestore indexes (`firestore.indexes.json`) are deployed.
- **Encryption issues** – the AES-GCM helper in `src/utils/encryption.ts` uses the Web Crypto API. For legacy browsers or server-side execution, disable encryption via the `SecureApiClient` config or polyfill `crypto.subtle`.

For deeper dives into the feature set, deployment, and maintenance tasks, see the manual.
