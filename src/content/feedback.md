## Grouped Booking – Creation, Editing & Calendar Interaction Improvements

This feedback further refines the grouped (multi-room) booking functionality and its UX across Booking list and Calendar views.

---

### 1. Add Booking & Add Group Booking actions (Bookings + Calendar)

Both **Bookings** and **Calendar** menu points must provide:

- **Add Booking** button
- **Add Group Booking** button

Rules:
- Buttons must be clearly separated and labeled
- Both actions must open the appropriate creation flow
- Behavior must be consistent across:
    - Bookings (list view)
    - Calendar (timeline view)

---

### 2. Editing room-level bookings from Group Booking (List View)

In the **Bookings list view**, for grouped bookings:
- The UI already displays which rooms belong to the group (good)

Required improvement:
- Add an **Edit** action next to the listed rooms
- This Edit action must allow editing **room-level booking data**, specifically:
    - Additional prices per room
    - Any room-specific pricing modifiers

Purpose:
- Example: assigning or adjusting optional additional prices for individual rooms inside the group

Rules:
- Editing must respect grouped booking constraints:
    - Shared dates
    - Shared guest identity
- Changes must not silently desynchronize the grouped booking

---

### 3. Edit Group Booking modal – Room-level additional prices

In the **Edit Group Booking modal**, within the **“Rooms in Group”** section:

Enhancements required:
- Each room entry must be editable
- It must be possible to:
    - Select / deselect optional additional prices per room
    - View mandatory additional prices applied to that room

Pricing behavior:
- Room-level changes must:
    - Immediately affect the grouped booking price calculation
    - Be reflected in the total grouped booking price
- UI must clearly indicate:
    - Which additional prices are applied to which room

---

### 4. Calendar view – Y-axis movement for grouped bookings

Current issue:
- In Calendar view, room-level bookings inside a grouped booking cannot be moved on the **Y-axis** (room reassignment)

Required behavior:
- For a grouped booking consisting of multiple rooms:
    - Each room-level booking must be movable vertically (Y-axis)
    - Only within the **same date range**
- X-axis movement (date change):
    - Still applies to the whole group together
    - Individual room bookings must not desync dates

Rules:
- Y-axis movement must:
    - Respect availability rules
    - Prevent overlaps
    - Preserve grouped booking integrity

Visual clarity:
- Clearly indicate that the moved booking is part of a group
- Other grouped rooms should remain visually linked

---

### Implementation note (IMPORTANT)

This feedback:
- Extends existing grouped booking logic
- Does NOT introduce a new booking model

Claude must:
- Reuse existing grouped booking structures
- Avoid duplicating pricing or validation logic
- Ensure consistency across:
    - Bookings list view
    - Edit Group Booking modal
    - Calendar (timeline) view
