# Accommodation Booking Admin System – Project Brief

## 1. Project Overview

This project is an **admin web application for managing accommodation bookings**,
built **inside an existing Next.js project**.

The system handles:
- accommodation structure (buildings, room types, rooms)
- complex pricing logic
- booking visualization and management
- admin authentication and user management

The application is designed for **clarity, scalability, and long-term maintainability**.

---

## 2. Claude AI Role Definition

You are acting as a **senior full-stack product engineer and architect**.

Your responsibilities:
- design a clean data model
- define business logic and constraints
- choose appropriate technologies where explicitly allowed
- propose scalable UI/UX patterns
- implement features step-by-step
- respect all constraints described below

Do NOT invent business rules.
Do NOT ignore existing project constraints.

---

## 3. Technical Constraints & Stack

### 3.1 Framework & Styling
- The project is an **existing Next.js application**
- Styling must use **Tailwind CSS**
- Design style:
    - minimalist
    - clean
    - light theme
    - subtle shadows
    - calm, modern color palette
- Avoid heavy UI libraries unless clearly justified

---

### 3.2 Database Requirements

- The database must:
    - run locally during development
    - be deployable on **Vercel** later
- Claude must **evaluate and select the most suitable solution**
  (e.g. SQLite-based, serverless-compatible, or edge-friendly)
- The choice must be justified briefly:
    - why it fits local + Vercel environments
    - how migrations and scaling are handled

---

### 3.3 Authentication & Authorization

- Admin authentication is required
- Use a **users table** with:
    - name
    - email
    - password (securely hashed)
- Authentication scope:
    - admin area only
- Claude should:
    - propose a secure and simple auth solution
    - avoid overengineering

---

### 3.4 Admin User Management

- An admin UI must exist to manage users
- Admins can:
    - create users
    - edit users
    - delete users
- User management fields:
    - name
    - email
    - password

---

### 3.5 Routing & Access

- The entire admin interface must live under:
    - `/admin` path
- All admin routes must be protected by authentication
- Public booking pages are outside the scope of this brief

---

## 4. Core Hierarchy & Terminology

The accommodation structure follows this strict hierarchy:

Building
└─ Room Type
└─ Room


Key rules:
- Bookings are displayed **on Room level**
- Website bookings are made on **Room Type level**
- Admin bookings are made on **Room level**
- All pricing is defined on **Room Type level**
- Availability is resolved down to **Room level**

---

## 5. Module 1 – Accommodation Administration

### 5.1 Buildings

Each Building supports the following editable fields:

- Name
- Address
  - Either a textual address (for Google Maps geocoding)
  - Or manual latitude & longitude
- Description (rich text)
- Images
  - Order matters
  - Automatically converted to WebP
- House Rules
  - N items
  - key–value pairs (e.g. "Check-out" → "10:00")
- Amenities
  - Admin-defined categories
  - Each category can contain N items
- Booking Conditions
  - Rich text field
  - Logically separated sections:
    - Cancellation Policy
    - Payment Methods
    - Deposit
- Additional Prices
  - N items
  - Title
  - Price (EUR)
  - Mandatory or Optional (checkbox)
  - Applied Per Night or Per Booking (radio)

---

### 5.2 Room Types

Each Room Type belongs to a Building and contains:

- Name
- Capacity (number of adults)
- Amenities (admin-defined categories)
- Images (ordered, WebP)
- Additional Prices
  - Same structure as Building-level additional prices

---

### 5.3 Rooms

Each Room belongs to a Room Type and contains:

- Name
- Active / Inactive flag
  - Inactive rooms:
    - visible in admin
    - NOT bookable on the booking website

---

### 5.4 Admin UX Rules

- "Add New" buttons exist for:
  - Buildings
  - Room Types
- Creation and editing via forms or modals
- Delete rules:
  - Always require confirmation
  - Double confirmation if child entities exist
- Duplication:
  - Room Types and Rooms can be duplicated
  - All data copied EXCEPT images

---

## 6. Module 2 – Pricing Management

### 6.1 Pricing Scope

- Prices are defined **per Room Type**
- Prices exist on a **per-day level**
- Priority:
  - single-day override
  - date-range price
  - no price

---

### 6.2 Date Range Pricing

Inputs:
- Start date
- End date
- Weekday price (Sun–Thu)
- Weekend price (Fri–Sat)
- Minimum nights

Applies to all days unless overridden.

---

### 6.3 Calendar Overrides

- Single-day editing:
  - price override
  - minimum nights override (including 0)
  - deactivate day
- Inactive day:
  - not bookable for any room of that room type

---

### 6.4 Bulk Editing

- Multi-day selection
- Works on mobile
- Modal-based editing

---

### 6.5 Calendar UI States

- No price → grey
- Inactive day → red
- Shows:
  - day number
  - price per night
  - minimum nights icon
- Month navigation supported

---

## 7. Module 3 – Booking Management

### 7.1 Booking Sources & Badges

- Website booking → yellow
- Manual admin bookings:
  - Booking.com → blue
  - Szállás.hu → orange
  - Airbnb → red

---

### 7.2 Timeline View

- Horizontally scrollable infinite timeline
- Fixed:
  - top date row
  - left room column
- Bookings rendered on Room rows

---

### 7.3 Date Navigation

- Date picker
- Auto-scroll to selected date

---

### 7.4 Booking Blocks

Block contents:
- Guest name
- Guest count
- Icons:
  - notes
  - additional prices

Time logic:
- Check-in: 14:00
- Check-out: 10:00
- Half-day rendering on first and last day

---

### 7.5 Status Colors

- Incoming (not confirmed) → grey
- Confirmed → green

---

### 7.6 Hover Popup

Displays:
- Guest info
- Room name
- Guest count
- Notes
- Additional prices
- Total amount
- Booking status
- Payment status

CTA:
- View booking details

---

## 8. Execution Order for Claude AI

You must proceed in this exact order:

1. Analyze existing Next.js project structure
2. Select and justify database solution
3. Define core entities and relations
4. Implement authentication & user management
5. Build Module 1 – Accommodation Admin
6. Build Module 2 – Pricing
7. Build Module 3 – Booking Timeline
8. Validate edge cases and constraints

Do not skip steps.
Do not merge modules prematurely.

---
