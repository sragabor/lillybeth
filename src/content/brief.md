# Accommodation Booking Admin System – Project Brief (Updated)

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
- Claude should choose the most suitable DB + ORM
- Image uploads must be converted to **webp**

---

## 1. Multilingual Content (CRITICAL)

All **language-dependent content must be editable in EN / HU / DE**.

A **global language selector** is required in the admin UI.

Language-dependent fields include (but are not limited to):

- Building description
- Room Type name and description
- Room description (if added later)
- Additional Price titles
- House Rules labels and values
- Amenities names
- Booking Conditions (Cancellation, Payment, Deposit)

The data model must support structured multilingual storage.

---

## 2. Accommodation Structure

### Hierarchy

Building
└─ Room Type
└─ Room


This hierarchy is used consistently across:
- Admin UI
- Booking timetable
- Pricing
- Availability

---

## 3. Building Management

### Editable fields

- Name (multilingual)
- Address OR latitude & longitude (Google Maps compatible)
- Description (multilingual, rich text)
- Images (ordered, upload → webp)
- House Rules:
  - N entries
  - Two multilingual text fields (e.g. "Check-out" : "10:00")
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
  - Mandatory / Optional (checkbox)
  - Per night / Per booking (radio)

Buildings can be:
- Created
- Edited
- Duplicated (without images)
- Deleted (with double confirmation if dependencies exist)

---

## 4. Room Type Management

### Editable fields

- Name (multilingual)
- Description (multilingual, rich text)
- Capacity (number of adults)
- Amenities (admin-defined, multilingual)
- Images (ordered, upload → webp)
- Additional Prices (same structure as Building-level)

Room Types:
- Belong to one Building
- Can be duplicated (without images)
- Can be deleted (double confirmation if rooms exist)

---

## 5. Room Management

### Fields

- Name
- Belongs to one Room Type
- Active / Inactive toggle

Inactive rooms:
- Are visible in admin UI (clearly marked)
- Are NOT bookable on the public website

Rooms can be:
- Created
- Edited
- Duplicated
- Deleted

---

## 6. Pricing Module (`/admin/prices`)

Prices are defined **per Room Type**.

### 6.1 Date Range Pricing

Admins can define prices by selecting a date range:

- Start date – End date
- Weekday price (Sun–Thu)
- Weekend price (Fri–Sat)
- Minimum nights

Rules:
- **Date ranges must NOT overlap**
- The system must prevent saving overlapping ranges

---

### 6.2 Calendar Pricing View

- Calendar view per Room Type
- Displays:
  - Day number
  - Price per night
  - Minimum nights (icon)
- Days without price → grey
- Inactive days → red

Actions:
- Click a single day → edit price / min nights / inactive
- Select multiple days (mobile-friendly selection) → bulk edit

Inactive day:
- Makes the day unbookable for all rooms of that Room Type

---

## 7. Booking Management Module (CORE)

### Booking Sources

Each booking has a **Source**, shown with badge + color:

- Website → yellow
- Manual → grey (default for admin-created bookings)
- Booking.com → blue
- Szállás.hu → orange
- Airbnb → red

---

### Booking Timeline UI

- Horizontal infinite scroll
- Top row: dates (sticky)
- Left column: rooms in hierarchy (sticky)
- Scrollable content area
- Date picker:
  - Default selected date = **yesterday**
  - Scroll range = ± selected interval (e.g. ±3 months)

Bookings are shown as **rectangular blocks**:

- Half-day offset:
  - Check-in: 14:00
  - Check-out: 10:00
- Block displays:
  - Guest name
  - Number of guests
  - Note icon (if exists)
  - Additional price icon (if selected)

Block color:
- Grey → website booking (unconfirmed)
- Green → admin-confirmed

Hover popup shows:
- Guest name & contact
- Room name
- Guest count
- Notes
- Additional prices
- Total amount
- Booking status
- Payment status
- Link to full booking details

---

### Drag & Drop Bookings

Bookings can be dragged:
- To different dates (same room)
- To a different room

Rules:
- Must fit availability
- Must respect booking rules
- Must not overlap other bookings

If price changes:
- Show warning modal
- Require confirmation before applying changes

---

## 8. New Booking Logic (Admin)

- Default Source = Manual
- When Source = Manual:
  - Total Amount is calculated from pricing rules
  - Recalculated on every relevant change
  - Amount is editable
- For other sources:
  - Total Amount is read-only (disabled)

---

## 9. Image Handling

- All images must be uploaded as files
- URLs are NOT allowed
- Uploaded images are converted to **webp**
- Image order is preserved

---

## 10. Authentication & Users

- Admin authentication required
- Users table:
  - Name
  - Email
  - Password
- Admin UI to manage users

---

## 11. Admin UI Principles

- Tailwind-based
- Light, minimal, modern
- Clear visual hierarchy
- Soft shadows
- Clear inactive / disabled states

