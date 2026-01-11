# Accommodation Booking Admin System – Project Brief (FINAL, UPDATED)

This brief includes:
- All core features
- All feedback rounds
- All post-MVP feature extensions
- All bugfix-related clarifications

It is the **single source of truth**.
Any further changes must be introduced as new feedback or new feature documents.

---

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
- Manages all content and bookings
- Allows **booking by individual rooms**
- Is available under `/admin`
- Requires authentication

Tech stack:
- Existing **Next.js** project (App Router)
- **TypeScript**
- **Tailwind CSS**
- Minimal, clean, light UI with soft shadows
- Local-first database, later deployable on **Vercel**
- Claude must choose the most suitable DB + ORM
- Image uploads must be converted to **webp**

---

## 1. Multilingual Content (CRITICAL)

All **language-dependent content must be editable in EN / HU / DE**.

A global language selector inside the admin UI is **NOT required**.
All multilingual fields must be editable **inline per language**.

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

### Sidebar Menu

- The sidebar menu entry must be labeled **"Rooms"**
- This section represents the full hierarchy:
  - Buildings
  - Room Types
  - Rooms

---

## 3. Accommodation Structure

### Hierarchy

Building  
└─ Room Type  
└─ Room

This hierarchy is used consistently across:
- Admin UI
- Pricing
- Booking timeline
- Booking list view
- Availability logic

---

## 4. Building Management

### Editable fields

- Name (multilingual)
- Address OR latitude & longitude (Google Maps compatible)
- Description (multilingual, rich text)
- Images (ordered, file upload → webp)
- House Rules:
  - N entries
  - Two multilingual text fields
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

Buildings can be:
- Created
- Edited
- Duplicated (without images)
- Deleted (double confirmation if dependencies exist)

---

## 5. Room Type Management

### Editable fields

- Name (multilingual)
- Description (multilingual, rich text)
- Capacity (number of adults)
- Amenities (admin-defined, multilingual)
- Images (ordered, file upload → webp)
- Additional Prices (same structure as Building-level)

Room Types:
- Belong to one Building
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
- NOT bookable
- Disabled in all booking views

---

## 7. Pricing Module (`/admin/prices`)

Prices are defined **per Room Type**.

### 7.1 Date Range Pricing

- Start date – End date
- Weekday price
- Weekend price
- Minimum nights
- Active / Inactive toggle

Rules:
- Date ranges must NOT overlap
- Creation must fail only on overlap or missing fields
- Inactive ranges make all days unbookable

---

### 7.2 Calendar Pricing View

- Calendar per Room Type
- Always shows:
  - Building name
  - Room Type name

Calendar cell states:
- No price → grey
- Inactive → light red

Pricing availability is the **single source of truth**.

Inactive days:
- Disable booking in all views
- Are non-clickable
- Show `cursor: not-allowed`

---

## 8. Booking Management (CORE)

### 8.1 Booking Sources

Sources:
- Website
- Manual
- Booking.com
- Szállás.hu
- Airbnb

Source representation:
- **Icons only**
- Icons loaded from `/public/icons`
- No color-dot indicators allowed

---

### 8.2 Booking Statuses

Supported statuses:
- Incoming / Pending
- Confirmed
- Cancelled
- Guest Arrived (Checked-in)
- Guest Departed (Checked-out)

Rules:
- Checked-in / Checked-out are valid, persistable states
- Must save without errors
- Shown with green-toned icons + labels
- Displayed consistently in:
  - Timeline View
  - Booking List View
  - Booking detail views

---

## 9. Booking Timeline View

- Hierarchical rendering:
  - Building (header)
  - Room Type (header)
  - Room (bookable row)
- Always renders structure
- Never filtered at data-query level

UI rules:
- Inactive rooms disabled
- Pricing-inactive days disabled
- Half-day booking blocks (14:00 → 10:00)

Drag & Drop:
- Allowed between rooms and dates
- Must respect availability
- Price change requires confirmation

---

## 10. Booking List View (NEW)

An alternative booking view in addition to Timeline View.

### Tabs
- All Bookings
- Upcoming Bookings
- Past Bookings

### Table columns

- Booking ID (6-digit incremental)
- Guest name + phone
- Dates
- Nights
- Guests
- Total amount
- Booking status
- Payment status
- Note icon
- Additional price icon

Under guest name:
- Building badge (grey)
- Room Type badge (orange)
- Room badge (blue)

### Expandable rows

- Inline expansion
- Full booking details
- Price breakdown
- Edit Booking button
- Uses SAME modal as Timeline View

### Sorting & Pagination

Default sorting:
- Upcoming → Start date ASC
- Past → Start date DESC
- All → Start date ASC

Sortable by:
- Name
- Dates
- Nights
- Guests
- Price

Cancelled bookings:
- Visible in All Bookings
- Light red row background

---

## 11. Booking Filters

### Global (All booking views)

- Building
- Room Type
- Booking Source

### Booking List View only

- Date range
- Room

Filters must:
- Never break hierarchy
- Never hide structure
- Apply instantly

---

## 12. Booking Creation & Editing

- Default source: Manual
- All fields required

Pricing behavior:
- Mandatory additional prices auto-applied
- Optional prices selectable
- Total recalculates automatically on any change

Manual bookings:
- Total editable

Non-manual:
- Total read-only

---

## 13. Image Handling

- File upload only
- Convert to webp
- Preserve order

---

## 14. Authentication & Users

- Admin authentication required
- Users table:
  - Name
  - Email
  - Password
- Admin UI for user management

---

## 15. UI & Interaction Rules

- All clickable elements use `cursor: pointer`
- Disabled elements clearly styled
- All async actions show loading indicator
