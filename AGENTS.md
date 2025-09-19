# Repository Guidelines

## Project Structure & Module Organization
Source lives in `src/`. Use `src/app` for application shell and routing, `src/features` for domain-specific flows, and `src/components` for reusable UI. Shared helpers sit in `src/utils`, `src/lib`, and `src/services`; keep logic closest to its consumer to avoid bloat. Assets belong in `src/assets`, while deployable static files stay in `public/`. Firebase rules and indexes are tracked in `firestore.rules`, `storage.rules`, and `firestore.indexes.json`; update them whenever data contracts change.

## Build, Test, and Development Commands
Install dependencies with `npm install` (or `bun install` when the team agrees). Run `npm run dev` for the Vite dev server, `npm run build` for a production bundle, and `npm run preview` to verify the built output locally. Execute `npm run lint` to apply the ESLint suite before every commit to catch TypeScript and React issues early.

## Coding Style & Naming Conventions
Favor TypeScript everywhere and stick to 2-space indentation matching the existing files. Components and hooks use `PascalCase` (`UserTable.tsx`) and utilities use `camelCase` (`formatCurrency.ts`). Keep CSS co-located with components via CSS modules or Tailwind utility classes; global overrides belong in `src/globals.css`. Run ESLint’s autofixes and keep imports sorted logically: React, third-party, internal modules, then styles.

## Testing Guidelines
Automated tests are not yet configured; when adding coverage, prefer Vitest with React Testing Library to stay aligned with Vite. Name files `*.test.ts(x)` and place them beside the unit they verify or under `src/__tests__` for broader scenarios. Include integration checks for data-heavy features (e.g., Firestore adapters) and document any required test fixtures in the PR.

## Commit & Pull Request Guidelines
Follow Conventional Commits, as seen in history (`fix:`, `chore:`). Scope commits narrowly, write imperative subjects, and reference tickets when available (`feat: add booking filters (SEVA-123)`). Pull requests should explain intent, outline testing performed, and attach screenshots or recordings for UI changes. Link associated Firebase or Vercel config updates and request review from the owning feature squad before merging.

## Environment & Deployment Notes
Local env vars follow the `VITE_` prefix and load from `.env.local`; never commit secrets. Deployments target Vercel, while Firebase handles backend rules. After modifying rules, run `firebase emulators:start --only firestore,storage` to validate locally before submitting a PR.
