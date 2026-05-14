# Lessons Learned & Insights

## 1. TypeScript & tsconfig Options
- **Failure mode**: `baseUrl` configuration is deprecated under newer TypeScript versions (like 5.9.x) which causes type check compilation errors with exit code 1.
- **Detection signal**: Error TS5101: `Option 'baseUrl' is deprecated and will stop functioning in TypeScript 7.0.`
- **Prevention rule**: Set compilerOptions `"ignoreDeprecations": "5.0"` in `tsconfig.json` to silence this warning/error and allow the codebase to typecheck successfully. Avoid using `"6.0"` since it is not recognized as a valid value by some 5.x compilers.

## 2. Monorepo Validation Order
- **Finding**: Running typechecks before installing node modules leads to massive untraceable import errors.
- **Action**: Always ensure workspace root `npm install` is executed before compiling/typechecking packages inside a multi-package workspaces monorepo.

## 3. Hono RPC Client Type Resolution
- **Failure mode**: Removing backend endpoints that are still called by the frontend (such as `/hello` used for bootstrap check) causes the Hono RPC Client types to fail to resolve, resulting in typescript errors like: `Parameter 'res' implicitly has an 'any' type.` on unrelated parameters.
- **Detection signal**: TypeScript compiler complaining about implicit `any` on responses or client objects on the frontend when backend routes change.
- **Action**: Ensure health check endpoints are preserved or the frontend code is synchronized when backend API routes are refactored.

## 4. Monorepo Workspace Build Choreography
- **Failure mode**: In an `npm workspaces` monorepo, a global build script that runs `npm run build --workspaces` will crash and fail with code 1 if any child workspace package does not have a `"build"` script defined in its `package.json`.
- **Detection signal**: `Missing script: "build"` error under workspace execution.
- **Prevention rule**: Ensure all child packages in a monorepo define at least a dummy build task (e.g. `"build": "tsc --noEmit"` or `"build": ""`) so that global workspaces build commands execute successfully across the monorepo.

## 5. Supabase Realtime + React useEffect: Infinite Resubscribe Loop
- **Failure mode**: Placing unstable callback references (inline functions, non-memoized `addToast`, etc.) in a `useEffect` dependency array that manages a Supabase Realtime channel subscription causes the effect to re-run on **every render**. Each re-run calls `channel.unsubscribe()` then `channel.subscribe()`, creating a rapid teardown-reconnect cycle. If the effect body also triggers a state change (e.g. showing a toast), it additionally causes an infinite render loop.
- **Detection signal**: The receiving side never updates despite broadcasts being sent successfully. Console may show rapid repeated `Successfully subscribed to channel` logs. If the effect body shows a toast, toasts will stack infinitely.
- **Root cause**: `addToast`, `onTeacherReset`, `onTeacherLockState` were inline functions recreated on every render and included as `useEffect` dependencies. Any re-render — regardless of cause — produced new function references, which React treated as dependency changes, re-running the effect. The channel was **never stable long enough to receive a message**.
- **Prevention rule**: For `useEffect` hooks that manage long-lived subscriptions (WebSocket, Supabase Realtime, SSE), **never include callback functions directly in the dependency array**. Instead:
  1. Store callbacks in `useRef` and update the ref in a separate `useEffect`.
  2. Inside the subscription handler, call `callbackRef.current(...)`.
  3. Only include truly identity-stable values in deps (e.g., `supabase` client instance, `roomId` string).
  4. Wrap frequently-used callbacks like `addToast` in `useCallback(…, [])` at the definition site.

## 6. LocalStorage-Based Multi-Session Analytics & CSV Export (Pattern A)
- **Problem**: Capturing student response times and session histories in educational settings normally requires massive backend tables, indexing, and high write volumes (DB write storm) whenever students submit multiple OK/NG statuses. Furthermore, identifying students via raw manually typed names inevitably breaks data correlation due to spelling/spacing inconsistencies.
- **Solution**: 
  1. Enforce strict character-level input validation on Student ID at input time (e.g., regex-guided filtering, auto-uppercase).
  2. Implement precise client-side latency tracking (milliseconds) starting from dashboard load, resetting upon subsequent submissions.
  3. Rather than writing every single real-time event to the cloud DB, archive completed session snapshots to the teacher's browser `localStorage` upon bulk-clearing ("状態クリア ＆ 質問保存").
  4. Perform data pivoting and aggregation entirely in frontend JavaScript to build a highly optimized, Excel-compatible CSV output with BOM (`[0xEF, 0xBB, 0xBF]`) to completely prevent UTF-8 encoding garbles in Japanese spreadsheets.

## 7. Realtime Broadcast Stale State Trap (React Asynchronous Batching)
- **Failure mode**: When a user clicks a button to update local state (e.g., `setStudentComment('[順調]...')`) and immediately triggers a broadcast transmission function (`handleSend('ok')`) on the next line, the broadcast payload sends the **old, un-updated state value** (such as an empty string). The updated message only transmits upon a second button tap.
- **Root cause**: React state updater functions operate asynchronously (state batching). At the exact moment `handleSend` executes, the parent component's `studentComment` variable has not yet re-rendered with the new value.
- **Prevention rule**: For realtime broadcast methods triggered by UI interactions, always design the broadcast handler to accept an **immediate, optional override parameter** (e.g., `onSendBroadcast(status, overrideComment?)`). Pass the exact literal string directly into both the state updater and the broadcast handler simultaneously to guarantee zero-latency synchronous delivery.

## 8. Mobile UI Layout: Absolute Single-Line Label Design & Transparent Grid Esthetics
- **Failure mode**: In responsive multi-column layouts (such as 2x3 grid buttons on mobile screens), long button labels wrap unpredictably across multiple lines, destroying vertical alignment and the premium feel of glassmorphism cards. Similarly, rendering dense dotted borders and solid background fills for empty or inactive grid cells creates overwhelming visual noise for teachers monitoring a crowded classroom.
- **Solution**:
  1. Compress mobile button labels to strict 4-5 character micro-copy combined with high-impact emojis (`✨ バッチリ！`, `✍️ メモ待って`), enforced with `whiteSpace: nowrap` and responsive font sizing.
  2. Implement a "subtractive design esthetic" on classroom monitoring grids: empty student seats render exclusively as vibrant colored borders with zero fill (`transparent`), while unassigned floor cells render completely transparent without borders or fills. This instantly draws the human eye directly to active student check-ins.
