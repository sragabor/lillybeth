## Feedback – Calendar Drag & Drop UX Improvement

### Issue: No Visual Feedback During Drag & Drop Update

- In **Calendar view**, when a booking (or group booking) is modified via **drag & drop**:
  - The update takes a noticeable amount of time
  - During this time, there is **no visual feedback**
  - It feels like the system is frozen or unresponsive

### Expected Behavior

- While the system is processing the drag & drop update:
  - A **loader / loading indicator** should be displayed
- The user should clearly see that:
  - The system is working
  - The update is in progress

### UX Notes

- Loader can be:
  - Global calendar overlay
  - Or row-level / booking-level loader
- Drag & drop interaction should:
  - Be temporarily disabled during processing
  - Prevent further interactions until the update finishes
