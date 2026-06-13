# Auth Theme Toggle + Logo Variants — Design Spec
**Date:** 2026-06-13
**Status:** Approved

---

## Scope

Three self-contained changes:
1. Add a theme toggle to the auth pages (sign-in / sign-up) so users can switch light/dark
2. Make the auth layout brand mark logo theme-aware (plain in light, amber box in dark)
3. Replace the `GlobeIcon` in the main app sidebar with the same theme-aware logo

---

## 1. Theme Toggle on Auth Pages

**File:** `src/app/(auth)/layout.tsx`

The auth layout is a server component. `ThemeToggle` (`src/components/theme-toggle.tsx`) is already a client component — it can be imported directly into the server layout without any wrapper.

**Placement:** Top-right corner of the page, absolutely positioned to mirror the brand mark on the top-left:

```tsx
<div className="absolute top-6 right-6">
  <ThemeToggle />
</div>
```

The light and dark CSS variables are already fully defined in `globals.css`. Auth pages use semantic tokens (`bg-background`, `text-foreground`, `bg-card`, etc.) that automatically respond when `next-themes` toggles the `.dark` class on `<html>`. No additional CSS changes required — the light version works out of the box.

---

## 2. Auth Layout — Theme-Aware Logo

**File:** `src/app/(auth)/layout.tsx`

The brand mark added in the previous session (`<Image src="/icon.png" width={32} height={32} />`) needs to behave differently per theme.

**Replace the current `<Image>` tag with a wrapper div:**

```tsx
<div className="flex size-8 items-center justify-center rounded-lg dark:bg-primary">
  <Image
    src="/icon.png"
    width={28}
    height={28}
    alt="Project Tracker"
    className="rounded-md"
  />
</div>
```

**Visual result:**
- **Light mode:** Transparent 32×32 container — icon.png (purple "1" in "A") sits directly on the cream background. Purple pops naturally.
- **Dark mode:** Amber (`bg-primary`) 32×32 rounded box — icon.png at 28×28 inset, 2px of amber visible as a frame on all sides. Matches the amber primary system and makes the icon legible on dark charcoal background.

No other changes to the brand mark (text labels "Project Tracker" / "PMBOK 8" stay unchanged).

---

## 3. Sidebar Logo — Main App

**File:** `src/components/app-sidebar.tsx`

**Current state:** A `motion.div` with `className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground"` containing `<GlobeIcon className="size-4" />`.

**Change:** Replace `GlobeIcon` with `<Image>` and make the amber box dark-only:

```tsx
import Image from 'next/image';

// Replace the motion.div and its contents:
<motion.div
  className="flex aspect-square size-8 items-center justify-center rounded-lg dark:bg-primary"
  animate={{
    scale: logoPressed ? 0.88 : logoHovered ? 1.12 : 1,
    rotate: logoPressed ? 0 : logoHovered ? 10 : 0,
  }}
  transition={{ type: 'spring', stiffness: 500, damping: 20 }}
>
  <Image
    src="/icon.png"
    width={24}
    height={24}
    alt="Project Tracker"
    className="rounded-sm"
  />
</motion.div>
```

**Visual result:**
- **Light mode:** No amber box — icon sits cleanly in the sidebar header. Purple on the sidebar's light cream background.
- **Dark mode:** Amber box (same `bg-primary` as before) — icon at 24×24 inside 32×32, giving a 4px amber frame. Consistent with the auth layout treatment and the existing sidebar design language.

**Preserved:** Framer Motion hover/press animations (`scale`, `rotate`, spring config) are unchanged. The `GlobeIcon` import can be removed if no longer used elsewhere in the file — check first before deleting.

---

## Files Changed

| File | Change |
|---|---|
| `src/app/(auth)/layout.tsx` | Import `ThemeToggle`, add top-right toggle div, wrap `<Image>` in theme-aware container |
| `src/components/app-sidebar.tsx` | Replace `GlobeIcon` + `bg-primary` with `Image` + `dark:bg-primary`, add `Image` import |

**No new files.** `ThemeToggle` and `icon.png` already exist.

---

## Out of Scope

- Restyling the auth page cards or form fields for light mode (CSS vars handle this automatically)
- Creating a new image file for dark mode (amber-box treatment replaces that need)
- Changing the `ThemeToggle` component itself
- Any other sidebar changes
