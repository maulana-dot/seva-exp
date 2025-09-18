# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Digital Asset Management System** built with React 19, TypeScript, Firebase, and TailwindCSS. The application manages IT assets (laptops, desktops, monitors, etc.) with features for tracking, assignment, maintenance, and user management.

## Development Commands

```bash
# Start development server (runs on http://localhost:5173 by default)
npm run dev

# Build for production
npm run build

# Run linting
npm run lint

# Preview production build
npm run preview
```

## Architecture

### Tech Stack
- **Frontend**: React 19 + TypeScript + Vite
- **Styling**: TailwindCSS 4.x with Radix UI components
- **State Management**: TanStack Query (React Query) for server state
- **Authentication**: Firebase Auth with custom user roles
- **Database**: Firebase Firestore
- **Storage**: Firebase Storage for file uploads
- **Routing**: React Router v7
- **Forms**: React Hook Form + Zod validation
- **Build Tool**: Vite with SWC

### Project Structure

The codebase follows a **Feature-Driven Development (FDD)** architecture:

```
src/
├── app/                    # App-level configuration
│   ├── layouts/           # Layout components (main, auth)
│   └── router/            # Route definitions and protected routes
├── components/ui/         # Reusable UI components (shadcn/ui style)
├── entities/              # Domain entities and types
│   ├── asset/            # Asset-related types
│   ├── auth/             # Authentication types
│   ├── audit/            # Audit trail types
│   └── user/             # User types
├── features/              # Feature modules
│   ├── assets/           # Asset management
│   ├── authentication/   # Login/register/auth
│   ├── dashboard/        # Dashboard overview
│   └── user-management/  # User CRUD operations
├── libs/                  # Third-party library configurations
├── utils/                 # Utility functions
└── scripts/              # Build/deployment scripts
```

### Key Architectural Patterns

#### Entity-Feature Architecture
- **Entities** (`src/entities/`): Domain types and interfaces shared across features
- **Features** (`src/features/`): Self-contained modules with components, hooks, and services
- Each feature follows the structure: `components/`, `hooks/`, `services/`

#### Type Safety with Branded Types
The codebase uses branded types for IDs to prevent mixing different entity IDs:
```typescript
export type UserId = string & { readonly brand: unique symbol }
export type AssetId = string & { readonly brand: unique symbol }
```

#### Firebase Integration
- **Auth Context**: `src/features/authentication/contexts/auth-context.tsx` manages authentication state
- **Firestore**: All data operations use proper TypeScript types with Firestore converters
- **Real-time Updates**: Components use React Query with Firestore real-time listeners

#### Error Handling
- Centralized error handling in `src/utils/error-handling.ts`
- Custom error classes: `AuthenticationError`, `AuthorizationError`, `NetworkError`
- React Query configured with smart retry logic

## Key Development Patterns

### Component Development
- Use `src/components/ui/` for reusable UI components
- Feature-specific components go in their respective feature folders
- Follow the shadcn/ui pattern for component APIs

### State Management
- **Server State**: TanStack Query for all Firebase operations
- **Client State**: React useState/useContext for local component state
- **Auth State**: Centralized in AuthContext with Firebase Auth integration

### Form Handling
- Use React Hook Form + Zod for all forms
- Form schemas defined in feature-specific files or `src/utils/validation-schemas.ts`
- Consistent error display patterns across all forms

### API/Service Layer
- Services in `src/features/*/services/` handle all external data operations
- Services return properly typed data and throw custom errors
- All Firebase operations use proper error handling and logging

## Firebase Configuration

The app connects to Firebase project "digital-asset-mapping":
- **Authentication**: Email/password with custom user roles (admin, manager, user)
- **Firestore**: Document-based storage with security rules
- **Storage**: File uploads for asset photos and documents

### User Roles & Permissions
- **admin**: Full system access, user management
- **manager**: Asset management, limited user operations
- **user**: Basic asset viewing and self-service operations

## Important Development Notes

### Path Aliases
- `@/` maps to `src/` directory (configured in vite.config.ts)

### Code Style
- ESLint configured with TypeScript, React hooks, and React refresh plugins
- Follow existing patterns for file organization and naming
- Use meaningful commit messages

### Authentication Flow
- Login redirects to dashboard after 100ms delay (allows auth state to update)
- Protected routes automatically redirect to login if unauthenticated
- Auth state managed through Firebase onAuthStateChanged listener

### Asset Management
- Assets have comprehensive metadata including photos, ownership, maintenance
- Status workflow: Available → In Use → Maintenance → Available (or Retired)
- Support for bulk operations and CSV export/import

### Audit Trail
- All user actions logged through `AuditService`
- Includes login/logout, asset operations, user management
- Stored in Firestore with proper typing

## Development Server

The development server runs on port 5173 by default. If you need to run on a different port:

```bash
npm run dev -- --port 3004
```

## Firebase Deployment

The project includes `firebase.json` configuration for:
- Firestore rules and indexes
- Storage rules
- No hosting configuration (frontend hosted elsewhere)