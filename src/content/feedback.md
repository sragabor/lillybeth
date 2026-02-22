## Guest count per room booking (Frontend + Admin)

Problem:
Currently, the system only knows the room type capacity (max guests),
but not how many guests will actually stay in each booked room.
This causes incorrect pricing for additional prices configured as /guest,
and missing data about real occupancy.

New requirement:
For every booked room (single booking and grouped booking),
we must store and display the actual guest count per room.

Functional requirements:

### 1. Guest count input per room
- On both Frontend (booking flow) and Admin (create/edit booking, group booking):
  - Each room booking must have a guest count selector (stepper / counter input).
  - Default value must be the room type’s max guest capacity.
  - Min value: 1
  - Max value: roomType.maxGuests

### 2. Pricing logic change for /guest additional prices
- Additional prices configured as:
  - `/guest` must be calculated based on the selected guest count for that room.
- This applies to:
  - Frontend booking summary
  - Final amount calculation
  - Admin booking price calculation
  - Group booking calculation

### 3. Data model changes
- Store guestCount per room booking:
  - Single booking → guestCount on booking room entry
  - Group booking → guestCount per room inside the group
- Backend payload must include guestCount for each booked room.
- Backend must persist this value.

### 4. UI display
- Everywhere a room booking is shown (Frontend + Admin):
  - Display: "Guests in room: X"
- In Admin:
  - Calendar view
  - Booking list
  - Booking detail
  - Group booking detail
- In Frontend:
  - Booking summary
  - Thank you page
  - (Later: booking confirmation email)

### 5. Editing behavior
- Guest count must be editable:
  - On Frontend before final booking
  - In Admin when editing booking / group booking
- Changing guest count must immediately recalculate:
  - /guest additional prices
  - Final total amount

### 6. Validation
- guestCount cannot exceed roomType.maxGuests
- guestCount must be >= 1
- If backend receives invalid guestCount → return validation error