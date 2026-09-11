# Product Requirements Document (PRD)

## Product Name (working title): **FixFleet**
*"Uber for Technicians" — on-demand repair & maintenance marketplace for factories and everyday service needs.*

---

## 1. Problem Statement

Factory owners frequently face **extended downtime (hours to days)** when critical industrial equipment breaks down, because:

- No centralized way to find **available, qualified** technicians nearby.
- No visibility into technician **skills, certifications, ratings, or pricing** before booking.
- Repair requests today go through phone calls, personal contacts, or slow vendor contracts.
- No **predictive layer** — most breakdowns are reported only after failure, not anticipated.

This downtime directly translates to **production loss, missed deadlines, and revenue loss**.

---

## 2. Goal / Vision

Build a two-sided marketplace app that connects **factory owners / businesses / households** with **verified technicians and service providers**, on-demand — similar to how Uber connects riders with drivers — while adding a **predictive maintenance layer** so failures are flagged *before* they become emergencies.

**Vision statement:** *"Never wait days for a technician again."*

---

## 3. Target Users

| User Type | Description |
|---|---|
| **Factory Owner / Plant Manager** | Needs urgent/scheduled repair support for industrial machinery (motors, compressors, boilers, CNC machines, electrical panels, HVAC, etc.) |
| **Technician / Service Provider** | Independent or agency-affiliated professionals — industrial technicians, electricians, plumbers, HVAC mechanics, welders, IT/OT technicians, etc. |
| **General/Home/Small Business User** (secondary market) | Anyone needing a plumber, electrician, appliance repair — expands TAM beyond factories |
| **Admin/Ops Team (internal)** | Manages verification, disputes, quality control, and platform health |

---

## 4. Core Value Proposition

1. **Speed:** Get matched to the nearest *available* & *qualified* technician in minutes, not days.
2. **Trust:** Every technician is verified with qualifications, certifications, and past ratings.
3. **Transparency:** Upfront pricing/estimated charges before confirming a booking.
4. **Breadth:** One app for industrial technicians AND everyday service providers (plumber, electrician, AC repair, etc.) — higher stickiness & usage frequency.
5. **Prevention (Predictive Maintenance add-on):** Factories can log equipment and get failure-risk alerts, reducing emergency callouts over time.

---

## 5. Key Features

### 5.1 For Technicians / Service Providers (Supply Side)
- **Self-registration & onboarding**
  - Profile: name, photo, service category (e.g., Industrial Electrician, Plumber, HVAC, CNC Technician, Boiler Technician)
  - Qualification uploads: certificates, licenses, ID proof, experience years
  - Skill tags (multi-select): e.g., "Motor Rewinding," "PLC Programming," "Hydraulics," "Welding — TIG/MIG"
  - Verification badge (Admin-approved) — "Verified Technician"
- **Availability management**
  - Toggle: Online/Offline, Busy/Available
  - Set working radius/service area (map-based)
  - Set working hours / emergency (24x7) availability flag
- **Pricing setup**
  - Base visiting/call-out charge
  - Hourly rate or per-job flat rate (category-dependent)
  - Emergency/urgent surcharge (optional, capped by platform policy)
- **Job management**
  - Accept/Reject incoming job requests
  - Navigation to job location
  - Job status updates: En route → Arrived → In Progress → Completed
  - Upload before/after photos, invoice generation
- **Earnings dashboard** — job history, payouts, ratings received

### 5.2 For Factory Owners / Customers (Demand Side)
- **Post a repair request**
  - Select category (Industrial Machinery / Electrical / Plumbing / HVAC / General)
  - Describe issue (text + photo/video upload)
  - Urgency level: Emergency / Same-day / Scheduled
  - Location (auto-detect or manual)
- **Browse & compare technicians**
  - List/map view of nearby available technicians
  - Filters: rating, distance, price range, certification, response time
  - View technician profile: qualifications, reviews, completed jobs, verified badge
- **Transparent pricing before booking**
  - Estimated cost shown upfront (visiting charge + estimated hourly/flat rate)
  - Final invoice shown after job completion (with any additional parts/charges itemized)
- **Live tracking** — similar to Uber's driver tracking (ETA, technician location)
- **In-app chat/call** with technician
- **Ratings & reviews** post-job
- **Repeat booking / "Book again"** for recurring maintenance
- **Equipment log (Predictive Maintenance module)**
  - Register machines with install date, service history
  - Set maintenance reminders (manual or sensor-based, phase 2)
  - Risk alerts: "Compressor X due for maintenance — book now to avoid downtime"

### 5.3 Marketplace / Platform-Wide Features
- **Multi-category listings:** Industrial Technicians, Electricians, Plumbers, HVAC, Appliance Repair, Welders, IT/OT support, etc. — all visible with charges/rate cards
- **Dynamic matching engine:** auto-suggests nearest 3–5 qualified & available technicians for urgent requests
- **Ratings & trust score** for both sides
- **In-app payments** (card/UPI/wallet) + invoice/GST receipt generation
- **SOS / Emergency Mode:** For critical factory breakdowns — highest priority matching, broadcast to all available nearby verified technicians until one accepts
- **Admin panel:** technician verification queue, dispute resolution, pricing policy control, analytics dashboard

---

## 6. User Flow (Primary — Factory Owner, Emergency Case)

1. Open app → Tap "Report Breakdown"
2. Select equipment category → Describe issue + upload photo/video
3. Choose urgency: "Emergency"
4. App shows list of nearby verified technicians with rating, ETA, and estimated charge
5. Owner selects technician (or taps "Auto-match fastest")
6. Technician accepts → live tracking begins
7. Technician arrives → updates status → completes job → uploads invoice
8. Owner pays in-app → rates technician
9. (Optional) Equipment logged for future predictive reminders

---

## 7. Design Guidelines

- **Visual style:** Minimal, clean, light theme only — **no dark mode, no gradients**
- **Color palette:** Neutral base (white/off-white background), one or two accent colors max (e.g., a single blue or green for CTAs/status), high-contrast text for readability
- **Typography:** Simple, legible sans-serif; clear hierarchy (headings vs. body)
- **Layout:** Card-based listings (technician cards, service category cards), generous white space, minimal icons, flat design (no drop shadows/glassmorphism)
- **Navigation:** Bottom tab bar — Home, My Requests, Bookings, Profile (for customers); Home, Jobs, Availability, Earnings, Profile (for technicians)
- **Consistency:** Same design system across customer and technician apps for brand familiarity

---

## 8. Monetization Strategy

| Model | Description |
|---|---|
| **Commission per job** | Platform takes a % cut (e.g., 10–15%) from each completed booking |
| **Subscription for technicians** | Premium tier for higher visibility / lower commission / priority in emergency broadcasts |
| **Lead/priority fee** | Factories can pay extra for "Emergency Broadcast" to guarantee fastest response |
| **B2B Enterprise plan** | Factories get dashboards, multi-site management, SLA-backed contracts, and predictive maintenance analytics as a paid add-on |

---

## 9. Success Metrics (KPIs)

- **Avg. time-to-match** a technician (target: < 15 mins for emergency requests)
- **Avg. time-to-arrival** at site
- Technician **acceptance rate** and **completion rate**
- **Repeat booking rate** (factories using the app again)
- **Verified technician supply growth** (month-over-month)
- **Customer satisfaction (CSAT)** / average rating
- **Downtime reduction** reported by factory customers (via post-job survey)

---

## 10. Phased Roadmap

**Phase 1 (MVP)**
- Technician registration + qualification upload + admin verification
- Availability toggle + service area
- Customer request posting + browse/filter technicians
- Upfront pricing display + in-app booking
- Basic ratings/reviews
- Light, minimal UI (core screens only)

**Phase 2**
- Live GPS tracking, in-app chat/call
- In-app payments + invoicing
- Emergency Broadcast / SOS mode
- Equipment logging (manual reminders)

**Phase 3 (Predictive Maintenance layer)**
- IoT/sensor integration (vibration, temperature, runtime hours) for real-time equipment health
- AI-based failure prediction & auto-alerts
- Enterprise dashboard for multi-factory/multi-site management
- SLA contracts & analytics for B2B customers

---

## 11. Risks & Open Questions

- **Technician quality control:** How rigorous should verification be for industrial vs. general categories?
- **Liability:** Who's responsible for damage during a repair — platform, technician, or insurance partner?
- **Supply-side cold start:** Need enough verified technicians per region before demand-side value kicks in.
- **Pricing standardization:** Should the platform enforce rate caps per category, or leave it fully technician-driven?
- **Emergency SLA:** What happens if no technician accepts an emergency request within X minutes?

---

## 12. Out of Scope (for MVP)

- Full IoT sensor integration (Phase 3)
- Multi-language support (add post-MVP based on region)
- Technician-side loans/financing tools
- Insurance product integration
