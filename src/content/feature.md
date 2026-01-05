# New Feature – Booking List View, Status Extensions & Filtering

This document defines NEW FEATURES to be added on top of the finalized brief.md.
Existing behavior must NOT be modified unless explicitly stated here.

---

## 1. Alternative Booking View – List View

In addition to the existing **Timeline View**, the Bookings module must provide a **List View**.

Both views must coexist and be switchable (e.g. tabs or toggle).

---

### 1.1 Booking List View – Structure

The Booking List View displays bookings in a **table-based list layout**.

Bookings are grouped into tabs:
- All Bookings
- Upcoming Bookings
- Past Bookings

---

### 1.2 Table Columns

Each row must display:

- Booking ID
    - 6-digit incremental numeric identifier
- Guest Name
- Guest Phone Number
- Booking Dates (check-in → check-out)
- Number of Nights
- Number of Guests
- Total Amount
- Booking Status
- Payment Status
- Note indicator (icon if exists)
- Additional Price indicator (icon if exists)

Under the **Guest Name**, show assignment badges:
- Building badge (grey)
- Room Type badge (orange)
- Room badge (blue)

---

### 1.3 Expandable Row (Booking Details)

Each row is collapsible / expandable:
- An expand icon must appear at the end of the row
- Clicking expands the row inline

Expanded content must show:
- Full booking details
- Guest data
- Selected additional prices
- Mandatory vs optional price breakdown
- Nightly price breakdown
- Total calculation summary

Actions inside expanded view:
- **Edit Booking** button
    - Opens the SAME booking modal used in Timeline View
    - No duplicated edit logic allowed

---

### 1.4 Sorting & Pagination

The table must support:
- Pagination
- Column-based sorting

Default sorting per tab:
- Upcoming Bookings → Start Date ASC
- Past Bookings → Start Date DESC
- All Bookings → Start Date ASC

Sortable columns:
- Guest Name
- Booking Dates
- Number of Nights
- Number of Guests
- Total Amount

---

### 1.5 Cancelled Bookings

- Cancelled bookings must appear in the **All Bookings** tab
- Cancelled rows must be visually marked with **light red background**
- Cancelled bookings must remain non-editable unless explicitly allowed elsewhere

---

## 2. Extended Booking Statuses (Check-in / Check-out)

Booking status must be extended with two additional states:

- Guest Arrived (Checked-in)
- Guest Departed (Checked-out)

Purpose:
- Track room occupancy
- Indicate cleaning readiness

UI rules:
- These statuses must be visually highlighted
- Use green-toned color + icon
- Must appear consistently in:
    - Timeline View
    - Booking List View
    - Expanded booking details

These statuses are independent from payment status.

---

## 3. Global Booking Filters (All Booking Views)

Filtering must be available in:
- Timeline View
- Booking List View

Shared filters:
- Building
- Room Type
- Booking Source (Website, Manual, Booking.com, Airbnb, etc.)

Filters must:
- Update views instantly
- Never break hierarchy rendering rules
- Never remove structural rows (buildings / room types / rooms)

---

## 4. Advanced Filters – Booking List View Only

Additional filters available ONLY in Booking List View:

- Date range filter (start date → end date)
- Room filter (specific rooms)

These filters:
- Apply on top of shared filters
- Affect list content only
- Must not affect Timeline View state

---

## 5. Non-Regression Rules

- Timeline View behavior must remain unchanged
- Pricing logic must remain unchanged
- Booking creation and editing logic must remain unchanged
- List View must reuse existing booking data and models
- No duplicate business logic is allowed

---

## Summary

This feature introduces:
- A secondary Booking List View
- Expandable booking rows
- Advanced filtering and sorting
- Extended booking lifecycle statuses

All changes must be additive and backward-compatible.
