## Feedback – Group Booking Editing Improvements & Calendar UX

### 1. Edit Group Booking – Room-level Additional Prices

Currently:
- In **Edit Group Booking**, room-level additional prices cannot be edited.
- This is only possible during Create Group Booking.

### Required Changes

- In **Edit Group Booking**:
  - For each room in the group, it must be possible to:
    - Modify selected additional prices
    - Use the same UI and behavior as in Create Group Booking
- The logic must:
  - Respect mandatory additional prices
  - Not allow editing price amounts (only selection), since amounts are rule-based
  - Recalculate room price and group total correctly after changes

---

### 2. Calendar – Group Booking Edit Behavior

Currently:
- Clicking edit on a Group Booking in Calendar opens the **single booking edit modal**

### Required Changes

- In Calendar view:
  - Clicking edit on a Group Booking should open:
    - The **Edit Room Booking** modal (room-level editor) for the clicked room booking
  - Additionally:
    - There must be a clear button (e.g. "Edit Group Booking") to open the full Group Booking editor
- UX Goals:
  - Fast room-level corrections directly from Calendar
  - Still allow full group-level editing from the same context
