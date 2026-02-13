# Frontend Features – Accommodation Detail Pages

## Terminology (IMPORTANT)

On the frontend:
- Use **Accommodation** instead of Building
- Translations:
    - EN: Accommodation
    - HU: Szállás
    - DE: Unterkunft

This terminology applies everywhere on the public frontend UI.

---

## 1. Accommodation Detail Page

Each accommodation (building) must have its own detail page.

URL structure example:
- `/frontend/accommodation/[slug]`

---

## 2. Page Structure (Top → Bottom)

### 2.1 Hero Image Slider

- Full-width image slider at the top
- Same visual style and animation as the homepage hero
- Images come from admin (Accommodation images)
- Smooth transitions and autoplay
- Responsive for mobile

---

### 2.2 Booking Search (Accommodation-scoped)

- Booking search directly below the hero slider
- Search is **restricted to this accommodation only**
- Inputs:
    - Check-in / Check-out (range picker)
    - Number of guests
- Same modern datepicker used on the homepage
- CTA button: “Check availability”

---

### 2.3 Accommodation Description

- Rich text description
- Comes from admin (multilingual)
- Styled for readability (max-width, spacing, typography)

---

### 2.4 Accommodation Gallery

- Image gallery of the accommodation
- Thumbnails in grid layout
- Click → opens fullscreen lightbox gallery
- Images come from admin
- Optimized and responsive

---

### 2.5 Amenities Section

- List of amenities (from admin)
- Display with icons if available
- If amenities exceed a reasonable limit:
    - Show limited list
    - Add **“Show more” / “Show less” toggle**
- Fully multilingual

---

### 2.6 House Rules & Booking Conditions

- Two separate sections:
    - House Rules
    - Booking Conditions
- Content comes from admin
- Multilingual
- Clear visual separation (cards or sections)

---

### 2.7 Location & Map

- Google Maps embed
- Location based on accommodation address or coordinates
- Display formatted address above or below the map
- Responsive map container

---

## 3. Room Types Section

After accommodation-level content, display available **Room Types**.

### Room Type Card Content

Each room type should show:
- Room type name (multilingual)
- Short description
- Image slider (room type images)
- Capacity (number of guests)
- Key amenities (icons or short list)
- Starting price:
    - Displayed as: “From €X / night”
    - Calculated from pricing rules
- CTA:
    - “View details”
    - Or “Book this room”

Cards must be:
- Responsive
- Visually consistent
- Optimized for comparison

---

## 4. Floating Booking Button

- Fixed button in bottom-right corner
- Visible on all accommodation detail pages
- CTA text:
    - EN: Book now
    - HU: Foglalás
    - DE: Jetzt buchen
- Clicking scrolls or navigates to the booking section
- On mobile: larger touch-friendly button

---

## 5. Data & Integration Rules

- All dynamic data comes from admin APIs:
    - Accommodation details
    - Images
    - Amenities
    - House rules
    - Booking conditions
    - Room types
- Multilingual fields must respect selected language
- Graceful loading states (skeletons / spinners)

---

## 6. UX & Design Requirements

- Modern, high-end hotel website look
- Smooth animations (fade, slide, blur)
- Tailwind CSS only
- Fully responsive (mobile-first)
- Performance optimized (lazy loading images)

---

## 7. Non-goals

- No admin editing here
- No payment flow yet
- No modification of existing landing page

