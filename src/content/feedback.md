# Feedback – Booking & Pricing Issues

This feedback focuses on **pricing availability propagation**, **date range pricing creation**, and **booking timeline structure**.

---

## 1. Pricing Inactive Dates Must Disable Booking Timeline Days

### Current issue
When a date is marked as **inactive** in the Pricing module (Date Range Pricing for a Room Type), this is not consistently reflected in the Booking Timeline.

### Expected behavior
- If a date is set to **inactive** in Pricing for a Room Type:
  - That date must be **inactive for ALL rooms** belonging to that Room Type
  - In the Booking Timeline:
    - The corresponding day cell must be highlighted in **light red**
    - Cursor must be **deny / not-allowed**
    - The cell must be **non-clickable**
    - Clicking must NOT open the “New Booking” modal
- This rule must apply regardless of:
  - Room active/inactive status
  - Existing bookings on other dates

Pricing availability is the **single source of truth** for whether a date is bookable.

---

## 2. Cannot Create New Date Range Price (Pricing Bug)

### Current issue
In the Pricing module:
- Opening the “Add Date Range Price” modal
- Filling out all required fields
- Choosing a date range with **no overlap** with existing ranges

Still results in the error:

> “Failed to create date range price”

### Expected behavior
- Date range prices with:
  - Valid date range
  - No overlap
  - Valid pricing values
- Must be saved successfully
- If saving fails:
  - A meaningful validation or backend error must be shown
  - Not a generic failure message

This appears to be a backend or validation logic bug and must be fixed.

---

## 3. Booking Timeline Left Column Must Be Hierarchical (Structural UI Issue)

### Current behavior
In the Booking Timeline:
- All rooms are listed flat
- Each room row displays:
  - Room Name
  - Building Name, Room Type Name (as subtitle)

This is not acceptable.

---

### Expected behavior (MANDATORY)

The left column of the booking timeline must follow the **full accommodation hierarchy** visually and structurally:

Building Name
└─ Room Type Name
├─ Room Name ← clickable booking row
├─ Room Name ← clickable booking row
└─ Room Type Name
├─ Room Name ← clickable booking row

Example with multiple buildings:

Building A
└─ Double Rooms
├─ Room 101
├─ Room 102
└─ Family Rooms
├─ Room 201

Building B
└─ Apartments
├─ Apt 1


### Interaction rules
- Only **room rows** are:
  - Clickable
  - Bookable
  - Can open the “New Booking” modal
- Building and Room Type rows:
  - Are headers only
  - Non-clickable
  - Used for visual grouping and clarity

This hierarchy must match:
- Data model
- Pricing logic
- Booking logic
- Timeline rendering

Flat listing of rooms is not acceptable and must be refactored.

---

## Summary

This feedback requires:
- Correct propagation of pricing inactivity to booking availability
- Fixing date range price creation logic
- Refactoring booking timeline rendering to hierarchical structure

No new features are requested.
Only correctness, consistency, and structural clarity.
