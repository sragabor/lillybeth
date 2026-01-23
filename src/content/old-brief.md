# Accommodation Booking Admin System – Project Brief (UPDATED)

## 0. General Context

This project is an **admin system for managing accommodations**, connected to a **public-facing booking website**.

The public website:
- Displays accommodation, room types, and rooms
- Supports **3 languages**:
    - English (EN)
    - Hungarian (HU)
    - German (DE)
- Allows booking by **room type**

The admin interface:
- Manages all content, pricing, availability, and bookings
- Allows **booking by individual rooms**
- Is available under `/admin`
- Requires authentication

Tech stack:
- Existing **Next.js** project (App Router)
- **TypeScript**
- **Tailwind CSS**
- Minimal, clean, light UI with soft shadows
- **Prisma ORM** (already configured, compatible with Vercel)
- Database must run locally and on **Vercel**
- Image uploads must use **Vercel Blob or Cloudinary**
    - Claude must choose the better option
    - If registration is required, Claude must explicitly notify
- All images stored as **webp**

---

## 1. Multilingual Content (CRITICAL)

All **language-dependent content must be editable in EN / HU / DE**.

- No global language switcher is required in admin
- All multilingual fields are edited **inline per language**

Language-dependent fields include (but are not limited to):

- Building name and description
- Room Type name and description
- Room Type names are fully multilingual
- Additional Price titles
- House Rules labels and values
- Amenities names and categories
- Booking Conditions:
    - Cancellation Policy
    - Payment Methods
    - Deposit
- Special Day names

The data model must support structured multilingual storage.

---

## 2. Admin Navigation

### Sidebar Menu (FINAL)

- Dashboard
- Calendar
- Bookings
- Rooms
- Pricing
- Users

Definitions:
- **Calendar** = booking timeline view
- **Bookings** = list / table view
- **Rooms** = Buildings + Room Types + Rooms management

---

## 3. Accommodation Structure (GLOBAL)

Building  
└─ Room Type  
└─ Room

This hierarchy must be:
- Preserved in data loading
- Visible in UI labels, dropdowns, and headers
- Never filtered out structurally (even if inactive or empty)

---

## 4. Building Management

(unchanged – see previous version)

---

## 5. Room Type Management

(unchanged – see previous version)

---

## 6. Room Management

(unchanged – see previous version)

---

## 7. Pricing Module (`/admin/pricing`)

Pricing is defined primarily **per Room Type**, but **pricing visibility and context must always show full hierarchy**:

**Building → Room Type → Room**

### 7.1 Date Range Pricing

Admins can define pricing rules by date range:

- Start date – End date
- Weekday price (Sun–Thu)
- Weekend price (Fri–Sat)
- Minimum nights
- Active / Inactive toggle

Rules:
- Date ranges **must NOT overlap**
- Inactive ranges:
    - Make all days unbookable
    - Override any price values

---

### 7.2 Calendar Pricing View

Calendar must:
- Display full hierarchy context:
    - `Building → Room Type → Room`
- Never hide room names

Calendar cells:
- Day number
- Price per night
- Minimum nights indicator

Visual rules:
- No price → grey
- Inactive day → light red
- Special Day → light blue + badge

---

## 8. Special Days

Special Days represent holidays or special events.

Features:
- Name (multilingual)
- Date range (start – end)
- Visual style:
    - Light blue background
    - Badge with star icon and event name

Displayed in:
- Calendar view
- Pricing calendar

---

## 9. Booking Management

### 9.1 Booking Sources

Sources are represented **by icons**, not colors:

- Website
- Direct
- Booking.com
- Szállás.hu
- Airbnb

Icons are loaded from `/public/icons`.

---

### 9.2 Booking Timeline (Calendar View)

- Horizontal infinite scroll
- Sticky date header
- Sticky left column
- Default date = yesterday
- Scroll range = ± selected interval

Layout hierarchy:
- Building
    - Room Type
        - Room (only rooms are interactive)

UI rules:
- Inactive rooms → disabled rows
- Pricing-inactive days → light red, non-clickable
- Weekends → darker grey background
- Monthly & Weekly view modes
- Drag & drop enabled (except Dashboard)

---

### 9.3 Dashboard

- Read-only Calendar view
- No drag & drop
- No booking editing
- Two actions only:
    - Create Booking
    - Create Special Day

---

## 10. Booking List View

Tabs:
- Upcoming
- Past
- All (includes cancelled)

Features:
- Pagination
- Sorting
- Filtering by:
    - Building
    - Room Type
    - Room
    - Guest name
    - Source
    - Date range

Expanded row:
- Shows full booking details
- Shows **price breakdown**
- Must use the **same pricing logic** as Edit Booking

---

## 11. Pricing Calculation (CRITICAL – SINGLE SOURCE OF TRUTH)

All pricing-related calculations **must use a single, shared pricing engine**.

This applies to:
- Create Booking
- Edit Booking
- Booking list expanded view
- Calendar drag & drop recalculation
- Price warnings on drag & drop

### Pricing must always consider:

1. Base room price per night × number of nights
2. Mandatory additional prices:
    - Per booking
    - Per night
3. Optional additional prices:
    - Only if selected
    - Persist across edits and drag & drop
4. Target context:
    - Building-level additional prices
    - Room Type–level additional prices

### Drag & Drop Pricing Rules

When a booking is moved:
- Previously selected optional additional prices must:
    - Remain selected if they exist in the target context
- Mandatory additional prices of the target context must be applied
- Total price must be recalculated using the unified pricing logic

After drag & drop:
- Edit Booking modal must:
    - Show selected optional additional prices as checked
    - Display correct price breakdown and final total

---

## 12. Booking Creation & Editing

(unchanged logic, but pricing rules above apply everywhere)

---

## 13. Payments

(unchanged)

---

## 14. UI & UX Rules

- All alerts must be **modals**
- All async actions show loading state
- Disabled actions clearly styled
- Cursor pointer on all clickable elements
