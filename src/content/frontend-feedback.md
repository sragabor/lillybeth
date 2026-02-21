## 13. Multiple optional additional prices per room – checkbox bug

Current behavior:
- If a room has more than one optional additional price:
  - Selecting one option blocks interaction with the others.
  - The already selected checkbox cannot be unchecked.
  - Other additional prices for the same room cannot be selected at all.

Required behavior:
- Each optional additional price must behave as an independent checkbox.
- The user must be able to:
  - Select multiple optional additional prices for the same room
  - Deselect any previously selected additional price
- State handling must be per room AND per additional price.
- Price calculation must correctly reflect:
  - Multiple selected additional prices for the same room
  - Deselection as well