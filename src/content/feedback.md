# Feedback – Special Days, Pricing & Dashboard Adjustments

## 1. Special Days – Date Range Support

Currently, Special Days can only be created for a single day.

Change request:
- Allow defining a **date range** for Special Days
- A Special Day can span multiple consecutive days (start date – end date)
- All days in the range must:
    - Be highlighted in the Calendar view
    - Be highlighted in the Pricing calendar
    - Use the existing visual style:
        - Light blue background
        - Badge with star icon and event name

---

## 2. Pricing Management – Room Identification

In the Pricing management view, room information is currently missing.

Issues:
- Room names are not visible in:
    - The Room Type / Room dropdown
    - The header or context information below

Required behavior:
- Everywhere pricing is managed, the following hierarchy must be clearly visible:
    - **Building → Room Type → Room**
- Dropdowns and labels must show full context, for example:
    - `Lake House → Double Room → Room 2`

This is required to avoid ambiguity when multiple buildings and room types exist.

---

## 3. Dashboard – Simplification & Actions

Current issue:
- The Dashboard displays statistics such as number of Rooms and Buildings, which are not needed.

Change request:
- Remove Room / Building counters from the Dashboard
- Instead, add two primary action buttons:
    1. **Create Booking**
        - Opens the existing “Create Booking” modal
    2. **Create Special Day**
        - Opens the “Create Special Day” modal

Notes:
- Dashboard remains a **read-only Calendar view**
- No editing, drag & drop, or booking modification allowed from the Dashboard
