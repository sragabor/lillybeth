## 17. Full SEO implementation (Multilingual – EN / HU / DE)

Goal:
Achieve strong SEO performance across all pages and all languages.

---

### 17.1 Dynamic Meta Tags (All Pages)

Every page must include:

- <title> (dynamic, localized)
- <meta name="description">
- <meta name="keywords">
- <link rel="canonical">
- <meta name="robots" content="index,follow">

Must be localized per language (EN / HU / DE).

Dynamic pages:
- Homepage
- Accommodation list
- Accommodation detail
- Room types
- Search results
- Booking page
- About page
- Thank you page (noindex)
- Static pages

Rules:
- No duplicate titles.
- No duplicate descriptions.
- Titles 50–60 chars ideal.
- Descriptions 140–160 chars ideal.

---

### 17.2 hreflang implementation

Add proper hreflang tags:

- rel="alternate" hreflang="en"
- rel="alternate" hreflang="hu"
- rel="alternate" hreflang="de"
- rel="alternate" hreflang="x-default"

Must point to correct language versions of the same page.

---

### 17.3 OpenGraph + Social Preview

Add:

- og:title
- og:description
- og:image
- og:url
- og:type

Add Twitter Card:

- twitter:card
- twitter:title
- twitter:description
- twitter:image

Use:
- Accommodation main image
- Default fallback image

Localized per language.

---

### 17.4 Structured Data (JSON-LD)

Implement structured data:

Homepage:
- Organization
- LodgingBusiness

Accommodation detail:
- LodgingBusiness
- Hotel
- PostalAddress
- GeoCoordinates
- ImageObject
- AggregateRating (if exists)

Room type pages:
- Offer
- PriceSpecification

About page:
- Organization

Booking confirmation:
- Reservation structured data

Use JSON-LD format.

---

### 17.5 Sitemap.xml

Generate dynamic sitemap including:
- All language versions
- All accommodation pages
- About page
- Static pages

Auto-update when new accommodation is added.

---

### 17.6 Robots.txt

Add:
- Sitemap reference
- Disallow:
  - /admin
  - booking thank you page
  - internal search results (if needed)

---

### 17.7 Performance SEO

Ensure:
- Lazy loading images
- Proper image sizes
- Use next-gen formats if possible
- Avoid blocking scripts
- Optimize font loading

---

### 17.8 URL structure

Ensure clean URLs:

/en/
/hu/
/de/

/en/accommodation/lillybeth-house
/hu/szallas/lillybeth-haz
/de/unterkunft/lillybeth-haus

Avoid query-based SEO URLs.

---

### 17.9 Booking Thank You page

Must include:
<meta name="robots" content="noindex, nofollow">

---

### 17.10 Search result page

Must include:
<meta name="robots" content="noindex, follow">