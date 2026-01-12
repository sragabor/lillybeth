# Feedback – Vercel Compatibility, Image Upload Refactor & Multilingual Room Types

This feedback introduces necessary architectural changes to ensure
full compatibility with Vercel hosting and to complete multilingual support.

This is a controlled refactor, not a feature request.

---

## 1. Image Upload Must Work on Vercel (Critical)

### Current issue
Image uploads currently attempt to write files into the `/public` folder.
This does NOT work on Vercel, because the filesystem is read-only.

### Required change
Refactor the image upload system to use **external object storage** instead of the local filesystem.

Allowed solutions:
- **Vercel Blob**
- OR **Cloudinary**

Claude must:
- Choose the most suitable solution for this project
- Clearly justify the choice
- Refactor ALL image uploads accordingly:
  - Buildings
  - Room Types
  - Rooms
- Ensure:
  - Upload works in local development
  - Upload works on Vercel
  - Image order is preserved
  - Images are converted to **webp**
  - Stored image URLs are saved in the database

### Important
If the chosen solution requires:
- Account registration
- API keys
- Environment variables

Claude MUST clearly state:
- Where to register
- Which credentials are needed
- Which environment variables must be added

---

## 2. Room Type Names Must Be Multilingual (Missing Requirement)

### Current issue
Room Type names are currently treated as single-language values.

### Required behavior
Room Type names must be:
- Fully multilingual (EN / HU / DE)
- Editable inline per language
- Stored using the same multilingual structure as:
  - Building names
  - Descriptions
  - Other translatable fields

This affects:
- Admin UI
- Booking timeline
- Booking list view
- Public website data model

Claude must:
- Update the data model
- Update forms
- Ensure backward compatibility or migration if needed

---

## Summary

This feedback requires:
- Refactoring image uploads for Vercel compatibility
- Completing multilingual support for Room Type names

This is NOT optional.
These changes are required before production deployment.

No unrelated refactors.
No UI redesigns.
