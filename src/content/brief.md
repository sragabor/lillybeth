# Accommodation Booking Admin System – Project Brief (FINAL)

This brief includes **all feature definitions and all feedback rounds up to this point**.
Any further changes must be added as **new feedback or new feature extensions**.

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
- Are visible in admin UI (clearly marked)
- Are NOT bookable
- Appear disabled in the booking timeline
- Cannot receive new bookings

Rooms can be:
- Created
- Edited
- Duplicated
- Deleted

---

## 7. Pricing Module (`/admin/prices`)

Prices are defined **per Room Type**.

### 7.1 Date Range Pricing

Admins can define pricing rules by selecting a date range:

- Start date – End date
- Weekday price (Sun–Thu)
- Weekend price (Fri–Sat)
- Minimum nights
- **Active / Inactive toggle**

Rules:
- **Date ranges must NOT overlap**
- A date range can be marked as inactive
- Date range creation must fail ONLY if:
  - The date range overlaps
  - Required fields are missing
- Generic backend failures without validation feedback are not acceptable

Inactive ranges:
- Make all days unbookable
- Override any price values

---

### 7.2 Calendar Pricing View

- Calendar view per Room Type
- Always display:
  - Selected Building
  - Selected Room Type
- Example label:
  - *Building A → Lake View Double Room*

Calendar cells display:
- Day number
- Price per night
- Minimum nights (icon)

Visual rules:
- No price → grey
- Inactive day → light red

Actions:
- Click a single day → edit price / min nights / inactive
- Select multiple days (mobile-friendly selection) → bulk edit

Pricing availability is the **single source of truth**.

If a date is inactive:
- It must be disabled for **ALL rooms** of the Room Type
- Booking timeline cells:
  - Light red background
  - `cursor: not-allowed`
  - Non-clickable
  - Must NOT open the “New Booking” modal

---

## 8. Booking Management Module (CORE)

### 8.1 Booking Sources

Each booking has a **Source**, shown with badge + color:

- Website → yellow
- Manual → grey (default for admin-created bookings)
- Booking.com → blue
- Szállás.hu → orange
- Airbnb → red

---

### 8.2 Booking Timeline UI (CRITICAL)

The booking timeline is a **structural overview** and must always render the **full accommodation hierarchy**.

#### Mandatory Rules

- Buildings must ALWAYS be loaded
- Room Types must ALWAYS be loaded
- Rooms must ALWAYS be loaded

This applies even if:
- The room is inactive
- There are no bookings
- Pricing marks all days as inactive

#### Forbidden Behavior

- Filtering inactive rooms at query level
- Filtering by pricing availability at query level
- Using INNER JOINs that hide rooms without bookings
- Hiding buildings or room types because they contain no bookings

#### Correct Behavior

- Timeline data loading is **STRUCTURAL**
- Availability and inactivity are handled **ONLY at UI / interaction level**

#### Regression Rule

The booking timeline must NEVER render empty due to:
- Missing bookings
- Inactive rooms
- Inactive pricing
- Filtering logic

Structure must always render first, data overlays second.

---

### Timeline Layout

- Horizontal infinite scroll
- Top row: dates (sticky)
- Left column: hierarchy (sticky):
  - Building rows (header only)
  - Room Type rows (header only)
  - Room rows (bookable)

Building and Room Type rows:
- Are headers only
- Must NEVER be clickable
- Must NEVER open booking interactions

Date picker:
- Default date = **yesterday**
- Scroll range = ± selected interval (e.g. ±3 months)

Timeline UI rules:
- Inactive rooms appear visually disabled and non-interactive
- Pricing-inactive days are highlighted with light red background
- Disabled cells are non-clickable and non-bookable

Bookings are shown as rectangular blocks:
- Half-day offset:
  - Check-in: 14:00
  - Check-out: 10:00
- Displayed inside block:
  - Guest name
  - Guest count
  - Note icon
  - Additional price icon

Block color:
- Grey → unconfirmed website booking
- Green → admin-confirmed booking

Hover popup shows:
- Guest name & contact
- Room name
- Guest count
- Notes
- Selected additional prices
- Total amount
- Booking status
- Payment status
- Link to full booking details

---

### 8.3 Drag & Drop Bookings

Bookings can be dragged:
- To different dates
- To a different room

Rules:
- Must respect availability
- Must respect pricing and booking rules
- Must not overlap other bookings

If total price changes:
- Show warning modal
- Display old vs new price
- Require confirmation

---

## 9. Add / Edit Booking Logic

- Default Source = Manual
- All fields are **required**
- Form cannot be saved with missing data

### Pricing behavior

- Mandatory additional prices:
  - Automatically included
  - Calculated per booking or per night
- Optional additional prices:
  - Selectable via checkbox
  - Grouped by origin:
    - Building-level
    - Room Type–level
  - Selection immediately recalculates total

Total amount recalculates automatically when:
- Dates change
- Room or Room Type changes
- Optional additional prices change

Manual bookings:
- Total amount is editable

Non-manual bookings:
- Total amount is read-only

---

## 10. Image Handling

- File upload only
- No image URLs allowed
- Convert all images to **webp**
- Preserve image order

---

## 11. Authentication & Users

- Admin authentication required
- Users table:
  - Name
  - Email
  - Password
- Admin UI for user management

---

## 12. UI & Interaction Rules

- All clickable elements must use `cursor: pointer`
- Disabled elements must be visually distinct
- For any time-consuming action:
  - Show loading indicator or loading screen
  - Clearly communicate progress to the user

Actions requiring loading feedback:
- Save
- Update
- Pricing changes
- Booking creation or modification
- Drag & drop operations
