# Feedback – Booking Completion Rules, UX Improvements & Bug Fixes

This feedback applies to the current stable version of the system.
No new features are introduced, only fixes and UX improvements.

---

## 1. Cancel Booking Must Be Disabled for Completed Bookings

### Current behavior
When a booking reaches the final state (Checked out / Completed),
the **Cancel Booking** action is still available in the Edit Booking modal.

### Required behavior
- If a booking status is **Checked out (Completed)**:
  - The Cancel Booking button must be:
    - Hidden OR
    - Visually disabled and non-interactive
- Completed bookings must NOT be cancelable

This is a business rule enforcement.

---

## 2. Edit Booking Action Buttons Must Be Bottom Sticky

### Current behavior
The action buttons (Save, Cancel, etc.) at the bottom of the Edit Booking modal
can scroll out of view.

### Required behavior
- Bottom action buttons must be **sticky**
- Buttons must always remain visible
- Applies to all viewport sizes

---

## 3. Replace All Alerts with Modals

### Current behavior
Some actions use native browser alerts.

### Required change
- Replace ALL alerts with modal dialogs
- Modals must:
  - Contain the same logic and messaging
  - Optionally improve wording for clarity
  - Include an **X (close) button**
  - Be dismissible without confirming the action

This applies to:
- Confirmations
- Warnings
- Errors

---

## 4. Additional Prices Are Not Persisted on Edit Booking (Critical Bug)

### Current issue
- Optional additional prices can be selected
- Total price recalculates correctly
- Booking is saved
- When reopening Edit Booking:
  - Previously selected additional prices are NOT checked
  - Price calculation becomes incorrect

### Required behavior
- Selected additional prices must:
  - Be persisted in the database
  - Be reloaded correctly when editing a booking
  - Appear checked in the Edit Booking modal
- Final price must reflect persisted selections

This is a critical data persistence bug.

---

## 5. Cannot Create New Payment ("Failed to create payment")

### Current issue
When attempting to add a new payment entry,
the system returns:

Failed to create payment


### Required behavior
- Payment creation must succeed
- Payment entry must:
  - Be saved
  - Appear immediately in the payment log
  - Update Payment Status correctly

This is a blocking bug.

---

## Summary

This feedback requires:
- Enforcing booking completion rules
- Improving Edit Booking UX
- Replacing alerts with modals
- Fixing additional price persistence
- Fixing payment creation

No new features.
No refactors outside the affected areas.
