# BYOSE TECH - Project History (Firebase Implementation)

This document tracks the critical structural and configuration changes made to the Firebase integration to ensure stability and resolve registration errors.

## Ledger Persistence Migration (2025-05-15)
- **Summary**: Moved ledger persistence to Firestore to ensure data remains consistent across sessions and environment rebuilds.
- **Root Cause**: localStorage is non-durable in certain preview environments (like Google AI Studio), leading to apparent data loss.
- **Files Changed**: `App.tsx`
- **Modifications**:
  - Removed all `localStorage.getItem`/`setItem` logic for inflows, outflows, and overdrafts.
  - Implemented real-time `onSnapshot` listeners for subcollections: `users/{uid}/inflows`, `users/{uid}/outflows`, `users/{uid}/overdrafts`.
  - Updated all CRUD callbacks (`add`, `update`, `delete`, `settle`) to use Firestore document and collection references.
  - Added persistence debug logging for read/write verification.

## Bugfixes & Optimization (2025-05-15)
- **Summary**: Resolved mobile sidebar "black rectangle" artifact and sticky hover states.
- **Root Cause**: The interaction between `backdrop-filter: blur` on a fixed overlay and CSS `transform` animations caused compositing glitches in Chromium-based mobile browsers. Additionally, touch devices were triggering sticky hover states.
- **Files Changed**: `components/Sidebar.tsx`
- **Modifications**:
  - Removed `backdrop-blur-sm` from the mobile sidebar overlay.
  - Applied `transform-gpu` to the sidebar `aside` container for hardware acceleration.
  - Added `will-change: transform` to optimize layer promotion during drawer animation.
  - Supplemented touch interaction with `active:*` Tailwind states for immediate feedback on mobile.

## Module Resolution & Syntax Fix (2025-05-15)
- **Summary**: Fixed `Uncaught SyntaxError: The requested module 'firebase/app' does not provide an export named 'default'`.
- **Root Cause**: The previous gstatic URLs pointed to the Modular SDK (v9+) which does not provide a default export. The application code uses v8-compatible syntax (`import firebase from 'firebase/app'`).
- **Files Changed**: `index.html`
- **Modifications**:
  - Redirected Firebase imports in `importmap` to `esm.sh/firebase@11.1.0/compat/*`.
  - This ensures the browser receives the compatibility layer that supports the legacy singleton/default export pattern while running on the v11 core.

## Firebase Configuration & Versioning
- **SDK Version**: Hard-downgraded and pinned all modules to **Firebase v11.1.0**.
- **Import Map Alignment**: Updated `index.html` to use official **gstatic** bundle versions (previously) then moved to **esm.sh/compat** for syntax compatibility.
- **Conflict Resolution**: Removed all wildcard/generic `firebase/` mappings and higher version (v12) imports. This ensures only one SDK version is ever loaded by the browser, fixing the "Component auth has not been registered yet" error.

## Service Initialization Logic
- **Bootstrap Order**: In `App.tsx`, the Firebase service import is now the first line of code, ensuring registration happens before React components mount.
- **Singleton Pattern**: In `services/firebase.ts`, implemented a robust singleton pattern using `!getApps().length ? initializeApp(config) : getApp()`.
- **Clean Dependencies**: Removed all `firebase-admin` references and eliminated any `as any` casting in the initialization logic.

## Authentication & User Data Sync
- **Collection**: `/users/`
- **Trigger**: User profile synchronization happens on `onAuthStateChanged` (in `App.tsx`) and immediately after manual registration/login (in `Auth.tsx`).
- **Fields**: Each user document now guarantees the following fields:
  - `uid`: Unique identifier from Firebase Auth.
  - `name`: Display name (synced from `displayName`).
  - `email`: User email address.
  - `photoFileName`: String field (default: `default_avatar.png`).
  - `createdAt`: ISO timestamp of first account creation.

## Administrative Logic
- **Authorized Emails**: `mshamiyanice@gmail.com`, `gakundohope5@gmail.com`.
- **Logic**: The `isAdmin` state is derived directly from the authenticated `user.email` from the singleton `auth` instance.
- **Permissions**: Admin mode unlocks the ability to Create, Update, and Delete inflows, outflows, and settle overdrafts.

## AI Integration
- **Model**: Upgraded to `gemini-3-pro-preview` for financial analysis.
- **Task**: Provides structured JSON insights (Health Score, Summary, Suggestions) based on transaction history.