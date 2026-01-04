## Booking Timeline – Mandatory Regression Fix

The booking timeline MUST always render the full room hierarchy.

### Critical rules:

- Buildings must ALWAYS be loaded
- Room Types must ALWAYS be loaded
- Rooms must ALWAYS be loaded
- This applies even if:
  - the room is inactive
  - there are no bookings
  - pricing marks all days as inactive

### Forbidden behavior:

- Filtering inactive rooms at query level
- Filtering by pricing availability at query level
- Using INNER JOINs that hide empty rooms
- Hiding buildings or room types because they contain no bookings

### Correct behavior:

- Timeline data loading is STRUCTURAL
- Availability and inactivity are handled ONLY via UI state:
  - disabled rows
  - disabled cells
  - visual indicators

If the timeline shows no data, this is considered a critical bug.
