# Feedback – Booking Price Calculation & Drag & Drop Pricing Fixes

## 1. Booking List View – Incorrect Price Breakdown

Issue:
- In the **Bookings list view**, when expanding (opening) a booking row to see its detailed information, the **price breakdown is incorrect**.
- The final total does not match the expected calculation based on:
    - Base room price
    - Number of nights
    - Mandatory additional prices
    - Previously selected optional additional prices

Expected behavior:
- The price breakdown must be recalculated using the same logic as:
    - Create Booking
    - Edit Booking
- The breakdown must clearly reflect:
    - Base price per night × nights
    - Mandatory additional prices (per night / per booking)
    - Optional additional prices that were selected for the booking
- The displayed total must always match the stored booking total.

Action:
- Review and fix the price calculation logic used in the Booking list expanded view.
- Ensure a single, shared pricing calculation source is used across the application.

---

## 2. Calendar Drag & Drop – Additional Prices Not Respected

Issue:
- In the **Calendar (timeline) view**, when a booking is moved via **drag & drop** to:
    - A different room, or
    - A different date range
- The pricing validation and recalculation **ignores previously selected optional additional prices**.

Current incorrect behavior:
- If the booking had optional additional prices selected,
- And the target Room / Room Type also has the same additional prices available,
- The recalculated price does NOT include them.

Expected behavior:
- During drag & drop:
    - The system must consider:
        - Previously selected optional additional prices
        - Mandatory additional prices of the target Room Type / Building
    - If an optional additional price exists in both the source and target context, and was previously selected, it must remain selected.
- The recalculated price must include:
    - All applicable additional prices
    - Correct per-night / per-booking logic

Post-drop behavior:
- When opening the Edit Booking modal after drag & drop:
    - Previously selected optional additional prices must be **checked**
    - Price breakdown and final price must be correct

Action:
- Fix drag & drop pricing logic to reuse the same pricing calculation used in Edit Booking.
- Ensure selected additional prices persist across room/date changes.
