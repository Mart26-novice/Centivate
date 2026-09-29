# Centivate Design System

The visual language Centivate already uses, written down so new screens match it. Everything here is taken from the current components. Tailwind v4 utilities are used inline; there is no theme file (`src/index.css` contains only `@import "tailwindcss"`), so these rules are the "tokens".

## 1. Principles

1. **Institutional and trustworthy.** Deep navy with a gold accent, echoing a school crest. The UI should feel official, not playful.
2. **Status first.** People come to report or to check status. Status and priority badges are the most important visual elements after the primary action.
3. **Readable on a phone.** Many students file from phones on campus. Every screen must work at 390 px with no horizontal scroll, with touch targets of at least 44 px.
4. **Honest.** Empty states say "No data yet". Never show placeholder numbers as if they were real.

## 2. Color

### Brand

| Role | Tailwind | Hex | Used for |
|---|---|---|---|
| Primary (navy) | `blue-950` | `#172554` | Headings, primary text on light backgrounds, dark hero and sidebar surfaces, `theme-color` |
| Primary strong | `blue-900` / `blue-800` | `#1e3a8a` / `#1e40af` | Primary buttons (hover `blue-800`), active nav, links |
| Accent (gold) | `amber-400` | `#fbbf24` | Call-to-action buttons, focus rings on forms, active indicators, highlights on navy |
| Accent hover | `amber-300` | `#fcd34d` | Hover on gold buttons, gold text on navy |

Gold is always paired with navy text (`bg-amber-400 text-blue-950`), never white text, which fails contrast.

### Neutrals (slate)

| Tailwind | Use |
|---|---|
| `slate-50` | Page background, input fill |
| `slate-100` / `slate-200` | Subtle panels, dividers, default card border (`border-slate-200`) |
| `slate-300` | Input borders |
| `slate-400` | Placeholder and disabled text only (not for body text) |
| `slate-500` / `slate-600` | Secondary text, metadata |
| `slate-700` / `slate-800` | Body text, form labels |
| `white` | Cards, modals, text on navy |

### Status

Badges use a light fill plus dark text of the same hue.

| Status | Classes |
|---|---|
| Filed | `bg-blue-100 text-blue-800` |
| Pending | `bg-amber-100 text-amber-800` |
| In Progress | `bg-indigo-100 text-indigo-800` |
| Resolved | `bg-emerald-100 text-emerald-800` (add `border border-emerald-300` on detail views) |
| Cancelled | `bg-slate-200 text-slate-700` (as in `ComplaintDetailsModal`; see section 9) |

### Priority

| Priority | Classes |
|---|---|
| Low | `bg-slate-100 text-slate-700` |
| Medium | `bg-blue-100 text-blue-800` |
| High | `bg-orange-100 text-orange-800` |
| Urgent / Hazard | `bg-red-100 text-red-800 border border-red-300` (currently also `animate-pulse`; see section 9) |

Errors use `red-500`/`red-600` text on `red-50` panels. Success messages use the emerald set. Never rely on color alone: badges always contain the status word.

## 3. Typography

- **Family:** Tailwind's default sans stack (system UI fonts). No webfont is loaded, which keeps the first load fast on campus Wi-Fi. `font-mono` is used for tracking codes, IDs and dates in tables.
- **Weights:** heavy. Headings and badges use `font-black`/`font-extrabold`, labels and buttons `font-bold`, body `font-medium`/`font-semibold`. Avoid `font-normal` for UI text; it looks out of place next to the rest.

| Role | Classes |
|---|---|
| Page / section title | `text-2xl sm:text-3xl font-black tracking-tight text-blue-950` (white on navy) |
| Card title | `text-lg` or `text-xl font-extrabold text-blue-950` |
| Section label | `text-xs font-black uppercase tracking-wider text-blue-950` |
| Form label | `block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2` |
| Body | `text-sm font-medium text-slate-700` |
| Table cell / meta | `text-xs` |
| Badge | `text-[11px] font-black uppercase tracking-wider` |

`text-xs` (12 px) is the workhorse and `text-[11px]` appears about 90 times. Treat 11 px as the minimum, and only for badges and dense table metadata. Anything a user must read carefully (descriptions, notes, instructions) is at least `text-sm`.

## 4. Spacing and layout

- **Scale:** Tailwind's 4 px scale. Common values: `gap-2`/`gap-3` inside components, `gap-4`/`gap-6` between cards, `p-4` on small cards, `p-6` on main cards and modals, `p-3.5` in table cells.
- **App shell:** `AppSidebar` on the left (persistent and collapsible from `lg`/1024 px up, slide-in drawer below), `Header` on top, content on `bg-slate-50`.
- **Admin dashboard:** its own section rail (Work Orders, Technicians, Student Directory) that starts collapsed to icons below 1536 px, and a tab bar with counts on phones.
- **Breakpoints:** mobile-first, using `sm:` and `md:` most, `lg:` for the sidebar switch. Always check 390, 820, 1024 and 1440 px.

## 5. Shape and elevation

| Element | Radius | Shadow |
|---|---|---|
| Buttons, inputs, small panels | `rounded-xl` (`rounded-lg` for compact table buttons) | `shadow` on buttons |
| Cards | `rounded-2xl` | `shadow-md`, raised to `shadow-xl` on hover |
| Modals | `rounded-2xl` / `rounded-3xl` | `shadow-2xl` |
| Badges, avatars, pills | `rounded-full` | none |

## 6. Components

**Primary action (gold)**, for the main thing on a screen (file a report, track, submit):
```
px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-blue-950 font-black text-xs
uppercase tracking-wider rounded-xl shadow transition-colors flex items-center gap-1.5
```

**Secondary action (navy)**, for everyday actions (Manage, Save, Assign):
```
px-5 py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs
rounded-xl shadow transition-colors
```

Use one gold button per view. Destructive actions (archive, delete staff) use red and always ask for confirmation.

**Text input / select:**
```
w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5
font-semibold text-blue-950 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white
```
Search fields inside the admin dashboard use `focus:ring-blue-900` and a leading icon (`pl-9`). Every input has a visible `<label>`.

**Card:**
```
bg-white rounded-2xl p-6 border border-slate-200 shadow-md
```
Clickable cards add `hover:shadow-xl hover:border-amber-400 transition-all`.

**Badge:** `px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider whitespace-nowrap` plus a status or priority color from section 2.

**Modal:**
- Overlay: `fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs` (or `bg-blue-950/80` for branded dialogs).
- Panel: white, `rounded-2xl`, `shadow-2xl`, scrollable inside on small screens.
- Must close on `Esc` (`useEscapeKey`) and have a labelled close button.

**Tables (admin):** tracking codes never wrap (`whitespace-nowrap font-mono`), titles wrap to two lines, row actions are right-aligned. On phones, prefer stacked cards over wide tables.

**Icons:** `lucide-react`, sized `w-4 h-4` inline with text and `w-5 h-5` in buttons. Icon-only buttons need `aria-label`.

## 7. Interaction states

- **Hover:** darken navy (`blue-900` → `blue-800`), lighten gold (`amber-400` → `amber-300`), raise cards.
- **Focus:** `focus:ring-2` in gold on forms and navy in dashboards. Never remove the outline without adding a ring. Prefer `focus-visible:` for new code so mouse clicks don't show rings.
- **Disabled:** `opacity-50 cursor-not-allowed`, and keep the label readable.
- **Loading:** `animate-spin` on a `Loader2` icon inside the button, with the button disabled.
- **Empty:** a short sentence plus the next action, e.g. "No reports yet. File your first report."
- **Error:** inline under the field in `text-red-600 text-xs font-semibold`, plus a summary above the submit button for server errors.

## 8. Motion

Keep motion short and functional: `transition-colors` or `transition-all` at the default 150 ms, `duration-500` only for large reveals such as the intro overlay.

## 9. Known inconsistencies to fix

| Issue | Where | Fix |
|---|---|---|
| Status badge colors are duplicated per component and drift: the admin table and student history have no `Cancelled` case, so Cancelled shows in Filed's blue | `AdminDashboard.tsx`, `StudentPortal.tsx`, `PublicTracker.tsx`, `ComplaintDetailsModal.tsx` | Move the mapping into one shared helper and use it everywhere |
| `animate-fadeIn` is used on 17 elements but never defined, so it does nothing | Modals and panels across components | Define it with `@theme` / `@keyframes` in `src/index.css`, or remove the class |
| No reduced-motion handling; `Urgent / Hazard` badges pulse forever | `AdminDashboard.tsx` | Add `motion-reduce:animate-none`, or drop the pulse and rely on the red badge |
| Heavy use of 11–12 px text | Tables, badges, labels | Keep 11 px for badges only; move readable content to `text-sm` |
| `focus:` instead of `focus-visible:` | Most inputs and buttons | Switch gradually in new or touched code |
| Colors are repeated as raw class strings | Every component | If the palette changes, add `@theme` tokens (e.g. `--color-brand`, `--color-accent`) in `src/index.css` |

## 10. Checklist for a new screen

- [ ] Navy/gold/slate only; status colors only for status.
- [ ] One gold primary action.
- [ ] Every input labelled; icon buttons have `aria-label`; dialogs close on `Esc`.
- [ ] Works at 390, 820, 1024 and 1440 px with no horizontal scroll.
- [ ] Touch targets at least 44 px (`h-11` or `min-h-[44px]`).
- [ ] Empty, loading and error states designed.
- [ ] Checked in a real browser (`playwright-cli`) with no console errors.
