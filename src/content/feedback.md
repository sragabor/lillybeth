# Feedback – Dashboard statistics extension

## 1. Dashboard summary statistics

Extend the Dashboard view with additional summary information next to the existing action buttons
(Create Booking, Create Special Day).

The Dashboard should display the following real-time statistics:

### Booking statistics
- Total number of bookings
- Number of open / not completed bookings
- Number of unpaid bookings
  - Payment status is NOT Fully Paid

### Guest statistics
- Number of guests currently staying today
  - Bookings where:
    - Today is between start date and end date (inclusive)
    - Booking status is Checked in

### UI / UX requirements
- Statistics should be clearly visible next to the two action buttons
- Use clean, minimal cards or inline badges
- Each statistic should have:
  - A label
  - A numeric value
- Visual hierarchy should not overpower the Calendar view
- Dashboard remains **read-only**
  - No editing
  - No drag & drop
