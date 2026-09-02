# VIDEO ROOM Connected Pages Design

## Goal

Extend the established VIDEO ROOM visual world across the video detail, episode playback, My Bag, staff inventory, and video registration flows while preserving the existing Supabase course, lesson, enrollment, and progress model.

## Product Mapping

- A `course` is presented as one rentable video title or VHS case.
- A `lesson` is presented as one episode stored inside that title.
- An `enrollment` is presented as a title placed in My Bag.
- A `lesson_progress` row is presented as a completed episode.
- Existing thumbnail and video URLs remain the only factual media sources.

## Visual Direction

The established main-page world remains authoritative: near-black dark navy surfaces, violet primary actions, warm orange highlights, off-white text, soft borders, VHS materials, restrained neon, and a blue-eyed Staff Cat. The reference images guide composition and density, but the product remains VIDEO ROOM rather than VIDEO STORE.

The user-facing pages feel cinematic and object-led. The admin pages use the same materials with higher information density, standard forms, and compact tables. Motion is limited to state feedback and hover transitions. No pixel-art treatment, excessive glow, beige vintage theme, or nested decorative cards.

## Shared App Shell

A reusable server component owns the desktop sidebar, mobile navigation, brand, active state, utility actions, and optional Staff Cat panel. Desktop uses a fixed-width sidebar plus a `minmax(0, 1fr)` content column. At 1024px and below the sidebar becomes a horizontal header; at 768px and below actions and dense grids stack.

The root document and every app shell must fill the viewport width, use a dark background on both `html` and `body`, prevent accidental horizontal overflow, and never depend on a fixed browser width.

## Pages

### Video Detail

The title page shows a large physical VHS case or uploaded artwork, title metadata derived from real data, description, My Bag action, and an episode shelf. Enrolled users can play episodes; others are guided to add the title to My Bag. Empty episode state uses a prepared VHS motif.

### Episode Playback

The playback page places the real video element inside a high-quality CRT television frame. It shows title, episode number, completion state, previous/next navigation, and the episode list. A missing video uses a clear prepared-state screen instead of a broken player.

### My Bag

The new `/my-page` route lists enrolled titles and derives progress from real lesson-progress rows. Titles with incomplete episodes appear under "대여 중" with a continue action. Fully completed titles appear under "시청 완료" with replay and detail actions. Empty states direct users back to `/main`.

### Staff Inventory

The existing `/admin` route becomes a dense VIDEO INVENTORY surface. It retains real status, episode count, enrollment count, and created date. Search and status filtering use server-side search parameters. Each row links to the existing edit flow; destructive deletion remains a form action.

### Video Registration And Episode Editing

`/admin/courses/new` creates the title and may optionally create the first episode in the same submission. The form includes title details, cover upload, optional episode title, optional episode video, and publication state. After creation it redirects to the existing course edit route. That edit route remains the place to add, reorder, update, or remove all later episodes and is restyled into the same Staff Only visual system.

## Data And Error Handling

- No database migration is required.
- Creating the optional first episode uses the existing `lessons` and `lesson_contents` tables.
- If a course is created but the optional episode insert fails, the user still lands in the edit screen where the episode can be retried.
- Missing Supabase configuration and empty data use branded inline states.
- Existing authentication and role checks remain unchanged.

## Accessibility And Responsive Behavior

- All controls use semantic links, buttons, labels, tables, and native media controls.
- Icon-only controls receive accessible names.
- Focus states remain visible against dark surfaces.
- Uploaded images preserve descriptive alternatives through labeled image regions.
- Layouts are verified at 1440px, 1024px, 768px, and 375px with no horizontal document overflow.

## Verification

Utility behavior is implemented test-first with Vitest. Completion requires passing tests, TypeScript, ESLint, production build, Impeccable detector, and one bounded desktop/mobile visual inspection pass including measured document widths.
