# Task: Monorepo Implementation (Hono + Vite + Zod)

## 📋 Checklist

### Phase 1: Shared Schemas and Types (Completed)
- [x] Create the task checklist in `tasks/todo.md`
- [x] Define the schemas in `packages/shared/src/schemas/`:
  - [x] `roomLayout.ts` (RoomLayout schema and SaveRoomLayoutInputSchema)
  - [x] `seatStatus.ts` (SeatStatus schema)
  - [x] `broadcastEvent.ts` (BroadcastEvent schemas)
  - [x] `index.ts` to export all schemas
- [x] Extract TypeScript types in `packages/shared/src/types/`:
  - [x] `roomLayout.ts`
  - [x] `seatStatus.ts`
  - [x] `broadcastEvent.ts`
  - [x] `index.ts` to export all types
- [x] Update `packages/shared/src/index.ts` to re-export schemas and types
- [x] Validate Phase 1 implementation (compilation/type check)

### Phase 2: Backend API (Hono + D1) (Completed)
- [x] Create migration file `0001_create_rooms_table.sql` in `packages/backend/migrations/`
- [x] Configure D1 database binding in `packages/backend/wrangler.toml`
- [x] Install `@hono/zod-validator` in `packages/backend`
- [x] Implement API endpoints in `packages/backend/src/index.ts`:
  - [x] `GET /api/hello` (Restored/Health Check)
  - [x] `GET /api/rooms` (List all rooms)
  - [x] `GET /api/rooms/:id` (Fetch layout)
  - [x] `POST /api/rooms` (Create new room with UUID)
  - [x] `PUT /api/rooms/:id` (Update room layout with max 5 configurations)
- [x] Validate Phase 2 implementation (compilation/type check)

### Phase 3: Teacher Layout Editor UI (Completed)
- [x] Customize page headers & import Outfit font in `packages/frontend/index.html`
- [x] Install `@dnd-kit/core` drag and drop library in `packages/frontend`
- [x] Author premium styled CSS design system in `packages/frontend/src/index.css`
- [x] Implement Layout Editor in `packages/frontend/src/main.tsx`:
  - [x] 9x9 CSS interactive layout grid with cell state styling
  - [x] Drag & drop palette supporting drag mapping
  - [x] Cell click cycling support
  - [x] Multi-case configuration tabs (up to 5 cases)
  - [x] Save & Load via D1 Database Hono RPC
  - [x] Custom row-layout generator preset with aisle support
  - [x] Real-time Toast notification center
- [x] Add `"build"` scripts to `@my-app/shared` and `@my-app/backend` package definitions
- [x] Execute and verify production build compilation (`npm run build`)
- [x] Document lessons and findings in `tasks/lessons.md`

### Phase 4: Supabase Broadcast Communication (Completed)
- [x] Install `@supabase/supabase-js` inside the `packages/frontend` workspace
- [x] Append stylish responsive CSS definitions for dual-view and student actions to `packages/frontend/src/index.css`
- [x] Implement dual views inside `packages/frontend/src/main.tsx`:
  - [x] **View Mode Switcher**: Easily toggle between Teacher View and Student View on the fly
  - [x] **Teacher Realtime Panel**: Form to input Supabase credentials, automatically saved to `localStorage`
  - [x] **Dynamic Subscription**: Subscribes to Supabase Realtime channel matching the room's UUID
  - [x] **Live Logs & Activity Feed**: Receives broadcasts, displays in an activity log, and runs `console.log`
  - [x] **Visual Grid Overlay**: Updates seat status visually on the 9x9 classroom layout grid in real-time
  - [x] **Student View Portal**: Minimal mobile-first dashboard containing Room UUID channel, Seat Coordinates, Student Name, Optional Comment, and massive high-impact "OK" / "NG" buttons
  - [x] **Student Broadcast**: Broadcasts `student_to_teacher` event to specified channel
- [x] Verify typecheck and production build compilations pass perfectly

### Phase 5: Teacher Status Monitoring & Reset (Completed)
- [x] Integrate Local Storage status persistence:
  - [x] Load seat statuses automatically on room load / render from `localStorage`
  - [x] Persist seat statuses automatically to `localStorage` on any update
- [x] Create visual feedback overlays on grid:
  - [x] Change student seat color to vibrant green for OK status
  - [x] Change student seat color to vibrant red for NG status
  - [x] **NG Pulse Animation**: Apply subtle red pulse glow animation to NG seats for quick visual tracking
  - [x] **Hover Tooltips**: Implement gorgeous floating absolute tooltip displaying student name, status, and comments upon hover
- [x] Implement global **Bulk Reset**:
  - [x] Clear local state in React component
  - [x] Clear persisting room status data in `localStorage`
  - [x] Broadcast dynamic reset event (`teacher_reset`) to all student clients via Supabase Realtime
- [x] Verify typecheck and production build compilations compile with 100% success

### Phase 6: Student Login and Fixed Seat Lock (Completed)
- [x] Implement Student Setup & Selection Wizard:
  - [x] **Stage 1 (Login)**: Input Room UUID & Student Name, load classroom layout from Hono / D1 DB
  - [x] **Stage 2 (Seat Select)**: Display interactive 9x9 layout preview where only student seats are clickable
  - [x] **Stage 3 (Dashboard)**: Send OK / NG statuses and comments once registered
- [x] Implement Fixed Seat Lock Mechanism:
  - [x] Save `seatId` and `name` to student's `localStorage` under dynamic classroom key
  - [x] Skip configuration steps on subsequent loads and jump straight to the Status Dashboard
  - [x] Handle global resets from Teacher: listen for `teacher_reset` broadcast, erase student's `localStorage` registration, and return to Stage 1
- [x] Prevent Student Seat Abuse (Seat Locking):
  - [x] Add "座席ロック" (Seat Lock) toggle switch inside Teacher's workspace header
  - [x] Broadcast dynamic `'teacher_lock_state'` with locked boolean payload over Supabase Realtime channel on toggle
  - [x] Listen to `'teacher_lock_state'` on student client, and dynamically disable the "Change Seat" option and selection grid while lock is active
- [x] Confirm clean monorepo builds with 100% success

### Phase 7: Student Self-Reset & Seat Re-Selection (Completed)
- [x] Implement Student Screen Self-Reset UI:
  - [x] Add confirmation dialog: `"現在の座席設定を解除して選び直しますか？"` upon clicking "席の変更 (Change Seat)" button on student dashboard.
- [x] Incorporate Teacher's "Seat Lock" Toggle Synchronization:
  - [x] Disable the "席の変更 (Change Seat)" button dynamically when `studentLiveSeatLocked` is true.
  - [x] Intercept click and throw an error toast if any unauthorized attempt occurs.
- [x] Maintain Data Consistency (No Ghost Registrations):
  - [x] Upon confirmation, broadcast a `student_to_teacher` event with `status: 'none'` along with the previous seat ID.
  - [x] Update the teacher's subscription node to detect `status === 'none'`, delete the registration from both state and teacher's `localStorage` cache, and append a custom released message in the logs feed.
- [x] Guarantee High UX:
  - [x] Retain student's name in state and in `localStorage` under `student_name_${studentClassroomId}` so they only have to select their new seat on the interactive map without re-typing their login credentials.
- [x] Confirm 100% successful workspace typecheck and production build compilations.

### Phase 8: Refactoring & Modularization (Completed)
- [x] Custom Hooks Extraction:
  - [x] Extract classroom layout and API operations into `useRoomLayout.ts`
  - [x] Extract seat status persistence and lock toggles into `useSeatManager.ts`
  - [x] Extract Supabase real-time broadcast and logging into `useRealtimeSession.ts`
- [x] Component Granularization & Separation:
  - [x] Extract classroom 9x9 layout cell renderer into `SeatCell.tsx`
  - [x] Extract 9x9 classroom layout grid into `SeatMap.tsx`
  - [x] Extract control action buttons and channel UUID status into `ControlPanel.tsx`
- [x] Rendering and Performance Optimizations:
  - [x] Apply `React.memo` to `SeatCell` to avoid unnecessary re-renderings when unrelated student statuses update
  - [x] Apply `React.memo` to `SeatMap` to optimize the grid rendering tree
  - [x] Apply `React.memo` to `ControlPanel` to isolate button actions
  - [x] Wrap critical event callbacks (`handleDragEnd`, `handleCellCycle`) in `useCallback` inside `main.tsx`
- [x] Verify typecheck and production build compilations compile with 100% success

### Phase 9: Local Launch and Verification
- [x] Set up tasks/todo.md for application launch
- [x] Run backend migrations locally
- [x] Launch backend development server (Wrangler)
- [x] Launch frontend development server (Vite)
- [x] Open browser to verify application functionality

### Phase 10: Multi-Teacher Decentralized Realtime Sync
- [x] Define updated Zod schema inside `packages/shared/src/schemas/roomLayout.ts` (add `supabaseUrl` and `supabaseAnonKey` to `SaveRoomLayoutInputSchema`)
- [x] Create database migration `0002_add_supabase_config_to_rooms.sql` in `packages/backend/migrations/`
- [x] Apply migration locally via wrangler to local D1 SQLite DB
- [x] Update Hono API endpoints (`POST /api/rooms`, `PUT /api/rooms/:id`, `GET /api/rooms/:id`) to handle, save, and return Supabase configurations
- [x] Refactor `useRoomLayout.ts` to include Supabase credentials in save payloads and load states
- [x] Modify `useRealtimeSession.ts` to support dynamic Supabase initialization based on active loaded room settings (instead of strict localStorage dependencies)
- [x] Refactor Student Config / Select Wizard to dynamically fetch Supabase configurations from Hono / D1 DB when logging in via Room UUID
- [x] Integrate URL dynamic entry: parse `?room=UUID` query parameters on app load, auto-triggering student login setup
- [x] Add lightweight QR Code Generator overlay to Teacher's View header to ease mobile access for students
- [x] Execute production build (`npm run build`) and perform end-to-end integration verification

### Phase 11: Route Separation (Teacher vs Student Pages)
- [x] Install `react-router-dom` in `packages/frontend`
- [x] Create `TeacherPage.tsx` and `StudentPage.tsx` components to house their respective logic
- [x] Refactor `App.tsx` to use `<BrowserRouter>`, `<Routes>`, and `<Route>`
- [x] Move Teacher-specific state (`useRoomLayout`, `useSeatManager`) into `TeacherPage.tsx`
- [x] Move Student-specific state (`useRealtimeSession` auto-login) into `StudentPage.tsx`
- [x] Update QR Code generation in `ControlPanel.tsx` to use the new `/student/:roomId` path
- [x] Verify functionality and execute production build

### Phase 12: Teacher UI Separation & Login
- [x] Implement `.env.local` based simple login authentication for Teachers.
- [x] Create `LoginPage.tsx` at `/` for teacher authentication.
- [x] Create `TeacherLayoutPage.tsx` at `/manage` for the layout studio.
- [x] Create `TeacherMonitorPage.tsx` at `/seating` with a wider monitor view (no sidebar/palette).
- [x] Add navigation header to allow teachers to switch between Manage and Seating.
- [x] Verify functionality and execute production build.

### Phase 13: Layout Studio and Seating Monitor Fine-Tuning
- [x] Remove Supabase connection settings card from layout studio (`/manage`) to focus strictly on creation.
- [x] Create a custom layout for seating monitor (`/seating`) with Supabase configs quietly positioned in the top-right.
- [x] Implement room/case dropdown selections inside `/seating`.
- [x] Configure massive grid cells (2x cell scale: max-width 960px, larger gap) in seating monitor.
- [x] Add dynamic premium guides/placeholders in seating monitor when no room is selected.
- [x] Run production build to confirm types are fully integrated.

### Phase 14: Student ID Validation, Latency Measurement, & Multi-Session Export (Completed)
- [x] Extend Broadcast schemas and types inside `@my-app/shared` to support `studentId` and `responseTime`.
- [x] Integrate robust numeric/alphabetic input validation inside `StudentConfig.tsx` for Student ID (auto-uppercase and filtering).
- [x] Implement precise frontend-side response latency tracking (milliseconds) inside `StudentDashboard.tsx`.
- [x] Capture and store session states securely on the Teacher's browser `localStorage` dynamically upon trigger resets.
- [x] Implement BOM-supported responsive CSV Exporter (Excel compatible) matching Pattern A layout (Students as rows, Questions/Sessions as columns).
- [x] Inject Student ID and response metrics seamlessly into the Seating Grid Tooltip (hover cards).
- [x] Run workspace monorepo production build with 100% successful compilation.

### Phase 15: Testing & CI Setup
- [x] Setup Vitest testing environment across workspaces
- [x] Implement shared schemas validation tests (Zod parsing, validation limits)
- [x] Implement backend Hono API integration tests (using Mock D1 binding)
- [x] Implement frontend critical business logic tests (Student ID validator, Latency tracker, Matrix CSV exporter)
- [x] Add `.github/workflows/ci.yml` to automatically run Lint, Typecheck, and Tests
- [x] Verify everything compiles, lint passes, and tests run with 100% success locally

### Phase 16: Teacher ID/PW Auth & Supabase JWT (Approach B)
- [x] **Step 1: Schema & Type Definitions (Shared)**
  - [x] Define `TeacherLoginInputSchema` inside `packages/shared/src/schemas/auth.ts` (validates username and password)
  - [x] Extract TypeScript type `TeacherLoginInput` inside `packages/shared/src/types/auth.ts`
  - [x] Re-export the schema and type in `packages/shared/src/index.ts`
- [x] **Step 2: Database Migration (Backend)**
  - [x] Create `0003_create_teachers_table.sql` inside `packages/backend/migrations/` with `teachers` table structure (id, username, password_hash, created_at)
  - [x] Seed a default admin teacher account with a secure bcrypt hashed password in the migration SQL
  - [x] Run wrangler local migrations to update the local SQLite database
- [x] **Step 3: Backend Authentication & JWT Issuance (Hono)**
  - [x] Install `bcryptjs` and `@types/bcryptjs` in the workspace root or specified workspaces
  - [x] Create JWT utility functions to sign Supabase-compatible tokens (using Supabase JWT secret from wrangler.toml)
  - [x] Implement `POST /api/auth/teacher/login` using `@hono/zod-validator` and `bcryptjs.compare`
  - [x] Implement Hono endpoints to issue temporary student Supabase JWT tokens when checking into a room
- [x] **Step 4: Frontend Login Integration (Vite/React)**
  - [x] Refactor `LoginPage.tsx` to handle authentic ID/PW authentication via Hono API
  - [x] Persist the signed Teacher JWT and the Supabase access token in LocalStorage
  - [x] Protect `/manage` and `/seating` routes with real JWT presence checks
- [x] **Step 5: Dynamic Supabase Client Authorization (Approach B)**
  - [x] Integrate JWT access token retriever in Teacher's Supabase client initialization
  - [x] Integrate JWT access token retriever in Student's Supabase client initialization upon check-in
  - [x] Set up proper Supabase Realtime Authorization settings (verify connections with custom JWT claims)
- [x] **Step 6: Verification, Testing & QA**
  - [x] Add unit/integration tests in `packages/backend` verifying password verification and JWT token generation
  - [x] Verify types, run lint checks, and execute vitest suite to ensure 100% stability

### Phase 17: Teacher Account Management (CRUD with Token Auth)
- [ ] **Step 1: Backend Middleware & Repository Extension**
  - [ ] Implement `teacherAuth` middleware/guard in `packages/backend/src/index.ts` to verify incoming Authorization Bearer JWT tokens
  - [ ] Extend `TeacherRepository` and its implementations (`D1TeacherRepository` / `InMemoryTeacherRepository`) with `create`, `delete`, and `listAll` methods
- [ ] **Step 2: Backend CRUD Endpoints**
  - [ ] Implement `GET /api/auth/teachers` (List all teachers - returns id, username, createdAt) protected by `teacherAuth`
  - [ ] Implement `POST /api/auth/teachers` (Create new teacher - validates input, hashes password via bcrypt) protected by `teacherAuth`
  - [ ] Implement `DELETE /api/auth/teachers/:id` (Delete teacher account - protects against self-deletion locking out the system) protected by `teacherAuth`
- [ ] **Step 3: Frontend API & State Client Integration**
  - [ ] Create a dedicated header tab/interface or settings panel inside Teacher Workspace (Manage page) to manage accounts
  - [ ] Update frontend Hono RPC call interceptor or headers to dynamically attach `Authorization: Bearer <teacher_jwt>` for protected routes
  - [ ] Implement interactive Account Manager UI: fetch teachers list, show "Add Teacher" modal, and display "Delete Account" confirmations with secure self-deletion guards
- [ ] **Step 4: Quality Assurance & Integration Testing**
  - [ ] Add integration tests in `packages/backend/src/index.test.ts` verifying protected list, create, and delete teacher routes
  - [ ] Ensure perfect monorepo typecheck, run vitest suites, and execute a final production build

### Phase 18: UI De-AI Redesign (Corporate & Educational SaaS Style) (Completed)
- [x] Create the UI redesign plan at [de_ai_redesign_plan.md](file:///C:/Users/matsu/.gemini/antigravity/brain/c64c1176-a632-4060-a2cb-7d466a80a1f2/de_ai_redesign_plan.md)
- [x] Refactor core CSS variables in `packages/frontend/src/index.css` to build a clean Slate-Indigo light theme
- [x] Strip out glassmorphism, background radial glows, and tech text gradients
- [x] Style student action dashboard big buttons (OK/NG) with solid Emerald and Rose colors and clean touch elevations
- [x] Relax classroom alert animations from high-frequency glowing neon to clean border shadow pulses
- [x] Validate and compile the entire monorepo with 100% success using `npm run build`
