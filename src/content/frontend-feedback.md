# feedback.md

## Frontend – Accommodation Listing & Detail Pages

### 1. Accommodation Listing Page (Buildings list)

- The Accommodation menu page must display all buildings with:
  - Cover image
  - Building name
  - Short basic info (capacity / short description)
- Each building card must contain a horizontal image slider:
  - Maximum 10 images
  - Swipeable / draggable on mobile
  - After the last image, there must be a dedicated slide:
    - CTA: "Learn more"
    - Clicking navigates to the building detail page
- The card design must feel:
  - Premium
  - Image-first
  - Touch-friendly
- Fully responsive layout:
  - Mobile: 1 column
  - Tablet: 2 columns
  - Desktop: 2–3 columns depending on width

---

### 2. Accommodation Detail Page (Building detail)

#### 2.1 Hero Section
- Full-width image slider (building gallery)
- Overlay:
  - Building name
  - Key info (location, capacity, short highlight text)
- Touch & swipe supported
- Subtle animations allowed (fade / parallax)

#### 2.2 Booking Search (Filtered to building)
- Same booking search UI as homepage:
  - Start date
  - End date
  - Guest number
- Search must be pre-filtered to this building only
- UI and UX must be identical to homepage booking search
- Visually overlaps the hero section slightly (premium hotel-style layout)

#### 2.3 Description & Amenities
- Accommodation description from admin
- Amenities list from admin
- If long:
  - Collapsed by default
  - Expandable via "Show more"

#### 2.4 Rooms List
- Rooms displayed vertically
- Each room card:
  - Image slider
  - Room name
  - Capacity
  - Short description
  - "From" price (lowest available price)
  - CTA: Book / View availability
- Layout:
  - Mobile-first stacked
  - Desktop: image left, content right

#### 2.5 Map Section
- Embedded Google Map
- Exact building location
- Address displayed near map
- Premium map styling (minimal / grayscale if possible)

---

## Global Frontend Notes

- SEO-friendly structure
- Lazy-loaded images
- Optimized sliders (avoid heavy libraries)
- "Learn more", "From", "Guests" labels must come from i18n files
