# Accommodation Booking Admin System – Project Brief (FINAL, UPDATED)

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
- Additional Price titles
- House Rules labels and values
- Amenities names and categories
- Booking Conditions:
  - Cancellation Policy
  - Payment Methods
  - Deposit

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

## 3. Accommodation Structure

### Hierarchy (GLOBAL)

Building  
└─ Room Type  
└─ Room

This hierarchy is used consistently across:
- Admin UI
- Pricing
- Booking timeline
- Availability logic
- Filters
- Dropdowns

---

## 4. Building Management

### Editable fields

- Name (multilingual)
- Address OR latitude & longitude (Google Maps compatible)
- Description (multilingual, rich text)
- Images:
  - File upload only
  - Ordered
  - Converted to webp
  - Stored via Vercel Blob or Cloudinary
- House Rules:
  - N entries
  - Two multilingual text fields (label + value)
- Amenities:
  - Admin-defined
  - Grouped by category
  - Multilingual
- Booking Conditions (rich text, multilingual):
  - Cancellation Policy
  - Payment Methods
  - Deposit
- Additional Prices:
  - N entries
  - Multilingual title
  - Price (EUR)
  - Mandatory / Optional
  - Per night / Per booking

Actions:
- Create
- Edit
- Duplicate (without images)
- Delete (double confirmation if dependencies exist)

---

## 5. Room Type Management

### Editable fields

- Name (multilingual)
- Description (multilingual, rich text)
- Capacity (maximum number of guests)
- Amenities (multilingual)
- Images (upload → webp)
- Additional Prices (same structure as Building-level)

Rules:
- Belongs to exactly one Building
- Can be duplicated (without images)
- Can be deleted (double confirmation if rooms exist)

---

## 6. Room Management

### Fields

- Name
- Belongs to one Room Type
- Active / Inactive toggle

Inactive rooms:
- Visible in admin UI
- Clearly marked
- Disabled in Calendar & Bookings
- Cannot receive new bookings

---

## 7. Pricing Module (`/admin/pricing`)

Pricing is defined primarily **per Room Type**, but visibility must always show full hierarchy.

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
  - Override prices

---

### 7.2 Calendar Pricing View

- Always display:
  - Building → Room Type → Room
- Dropdowns must show full hierarchy
- Example:
  - `Lake House → Double Room → Room 2`

Calendar cells show:
- Day number
- Price per night
- Minimum nights (icon)

Visual rules:
- No price → grey
- Inactive day → light red
- Special Day → light blue + badge

Actions:
- Single day edit
- Multi-day selection (mobile friendly)

Inactive days:
- Not bookable
- Affect all rooms of the Room Type

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

Sources (icon-based, not colored dots):

- Website
- Direct (formerly Manual)
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

Layout:
- Grouped hierarchy:
  - Building
    - Room Type
      - Room (only rooms are bookable)

UI rules:
- Inactive rooms → disabled rows
- Pricing-inactive days → light red, non-clickable
- Weekends → darker grey background
- Month labels clearly visible
- Monthly & Weekly view modes:
  - Monthly = very compact days
  - Weekly = detailed view

Bookings:
- Half-day offset (14:00 – 10:00)
- Show guest name, count, icons
- Drag & drop allowed (except Dashboard)

---

### 9.3 Dashboard

- Read-only Calendar view
- No drag & drop
- No editing
- Two action buttons only:
  - Create Booking
  - Create Special Day

---

### 9.4 Booking List View

Tabs:
- Upcoming
- Past
- All (includes cancelled)

Table features:
- Pagination
- Sorting:
  - Name
  - Dates
  - Nights
  - Guests
  - Price
- Filters:
  - Building
  - Room Type
  - Room
  - Guest name
  - Source
  - Date range

Row details:
- Booking ID (6-digit incremental)
- Guest name
- Phone
- Dates
- Nights
- Guests
- Total amount
- Status
- Payment status
- Notes & additional prices icons
- Badges:
  - Building (grey)
  - Room Type (orange)
  - Room (blue)

Cancelled bookings:
- Visible in All tab
- Light red row background

Expandable row:
- Full booking details
- Edit Booking button

---

## 10. Booking Creation & Editing

### Required Fields

- Email and phone are **optional**
- All other fields required

Rules:
- Guest count ≤ room capacity
- Arrival Time field (HH:MM)
- Arrival Time visible everywhere

Additional fields (checkboxes):
- Invoice
- Vendégem
- Cleaned

Rules:
- If Checked Out AND checkout date passed → fields locked
- Cancel disabled if booking is Completed

---

### Pricing Logic

- Mandatory additional prices auto-applied
- Optional additional prices selectable
- Grouped by:
  - Building-level
  - Room Type–level
- Recalculated on:
  - Date change
  - Room change
  - Additional price change

Edit Booking modal:
- Wide layout
- Left: form fields
- Right: price breakdown
- Bottom sticky action buttons

---

## 11. Booking Status Flow

Status order:
1. Incoming
2. Confirmed
3. Checked In
4. Checked Out

- Status changes via icon buttons
- Confirmation modal required
- Cancel action:
  - Separate button
  - Confirmation modal
  - Shows refund amount
  - Sets status to Cancelled

---

## 12. Payments

Payment Status flow:
1. Pending
2. Partially Paid
3. Fully Paid
4. Refunded

Payments:
- Logged entries:
  - Date
  - Amount
  - Currency (EUR / HUF)
  - Method:
    - Cash
    - Bank transfer
    - Credit card
  - Note

Rules:
- Overpayment highlighted in green
- Outstanding amount shown if partial
- Refund action:
  - Confirmation modal
  - Shows refund amount
  - Sets payment status to Refunded
  - Sets booking status to Cancelled

---

## 13. UI & UX Rules

- All clickable elements → cursor: pointer
- Disabled elements clearly styled
- All alerts must be modals:
  - With X close button
- Loading indicators for all async actions:
  - Save
  - Update
  - Pricing changes
  - Booking changes
  - Drag & drop
