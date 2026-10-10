# COMPLETE BACKEND API & DATABASE ANALYSIS — SOURCE-BASED IMPLEMENTATION

**Project**: iBookSports (IBS) — Sports Venue Management Platform  
**Target Market**: Coimbatore, Tamil Nadu, India (Expanding India-wide)  
**Payment Gateway**: Razorpay  
**Sources of Truth**: 
1. `IBS WEBSITE.docx`
2. `IBS ONBOARDING.docx`
3. `Booking.docx`
4. `slot & Availability.docx`
5. `payment.docx`
6. `membership.docx`
7. `coaching.docx`
8. `Tournament.docx`
9. `settings.docx`
10. `Help &support.docx`
11. `turf_final_flow_enhanced 3.drawio` (Pages 1 to 7)

---

# 1. SOURCE ANALYSIS

The iBookSports platform is a dedicated **Sports Venue Management Platform** built for venue owners and managers (turfs, box cricket, badminton courts, multi-sport facilities, sports academies). It is **not** a public customer booking marketplace.

### Source Analysis Findings:
1. **Website Role**: Lead generation and initial registration request (`/request-ibooksports`). Potential venue owners submit their business, contact, location, sports, and court count with mandatory mobile OTP verification.
2. **Onboarding Role**: An 11-step progressive onboarding wizard with save-and-resume support for approved registration requests. Collects Owner KYC, Business Details, Facility/Venue Details, Amenities, Venue Rules, Sports & Courts, Operating Hours, Bank/Settlement Account, and Documents before submitting for Super Admin verification.
3. **Vendor Application Role**: Operational control center for the Venue Owner/Manager covering Dashboard KPIs, Unified Calendar & Slot Availability, Bookings (Normal, Coaching, Tournament, Membership, Party, Long-Term), Payments (Initial link via WhatsApp/Razorpay, Balance via Link/QR/Cash), Settings (Courts, Pricing, Amenities, Hours, Staff, Bank, Rules), and Help & Support.
4. **Super Admin Role**: Platform governance layer reviewing venue registration requests, vetting 11-step onboarding submissions and documents, approving/rejecting physical courts, verifying bank settlement accounts, processing payouts/settlements, and resolving support tickets.
5. **Architectural Principles Verified from Source**:
   - **Unified Slot Engine**: One single calendar and availability engine for all booking types (Normal, Coaching, Tournament, Membership, Party, Long-Term, Maintenance, Private Events).
   - **Slot Reservation Rule**: Creating a booking and sending a payment link creates a `PAYMENT_PENDING` booking and a 30-minute temporary hold; slots are permanently `BLOCKED` only upon verified payment (`Paid >= Required`) + recheck of availability.
   - **Payment Engine**: Two-stage payment flow (Stage 1: Full 100% or Advance 50% online via Razorpay/WhatsApp link; Stage 2: Balance on booking day via WhatsApp Link, Venue QR, or Cash Record).
   - **Multi-Sport Physical Court Mapping**: A single physical court can be shared across multiple sports with distinct pricing, where a confirmed booking on one sport blocks the physical court for all sports.

---

# 2. COMPLETE SYSTEM FLOW

```
[ WEBSITE ]
  │
  ├─► Owner submits "Request iBookSports" Form (Mobile OTP Verified)
  │
  ▼
[ BACKEND & DATABASE ]
  │
  ├─► Record created in `vendor_applications` (Status: PENDING)
  │
  ▼
[ SUPER ADMIN ]
  │
  ├─► Super Admin Reviews Application
  ├─► Action: Approve or Reject
  │
  ▼ (If Approved)
[ ONBOARDING WIZARD ]
  │
  ├─► Status: APPROVED -> Link sent to Vendor
  ├─► Step 01: Mobile Verification (Pre-filled OTP)
  ├─► Step 02: Owner Information (PAN, Aadhaar, Address)
  ├─► Step 03: Business Information (Type, GST, Address)
  ├─► Step 04: Venue Information (Photos 4-10, Location, Geo)
  ├─► Step 05: Amenities Selection
  ├─► Step 06: Venue Rules (Booking, Payment, Cancellation, Usage)
  ├─► Step 07: Sports Selection & Initial Court Creation (4-10 courts)
  ├─► Step 08: Operating Hours (7 Days + Custom/Weekend)
  ├─► Step 09: Bank Details (Passbook/Cheque Proof)
  ├─► Step 10: Documents Upload (PAN, Aadhaar, GST, Business, Bank)
  ├─► Step 11: Review & Submit (Status: UNDER_REVIEW)
  │
  ▼
[ SUPER ADMIN VERIFICATION ]
  │
  ├─► Super Admin reviews Onboarding Data, KYC & Bank Proofs
  ├─► Action: APPROVE / REQUEST CHANGES / REJECT
  │
  ▼ (If Approved)
[ VENDOR ACCOUNT ACTIVATED ]
  │
  ├─► Vendor Owner / Staff Login (JWT Authenticated)
  │
  ▼
[ VENDOR OPERATIONAL APPLICATION ]
  │
  ├──► DASHBOARD (KPIs, Action Required, Revenue, Trends, Schedule)
  ├──► CALENDAR & AVAILABILITY ENGINE (Day/Week/Month, Slot Pricing, Conflict Check)
  ├──► BOOKINGS (Normal, Coaching, Tournament, Membership, Party, Long-Term)
  │      ├─ Check Availability -> Calculate Price -> Full/50% Advance
  │      ├─ Send Razorpay Payment Link via WhatsApp (30-Min Hold)
  │      ├─ Customer Pays -> Verify Razorpay -> Recheck Slot -> CONFIRMED & BLOCKED
  │      └─ Booking Day -> Collect Balance (Link / QR / Cash) -> Complete Booking
  ├──► SETTINGS (Courts & Multi-Sport, Operating Hours, Staff, Bank, Rules)
  │      └─ New Courts submitted for Super Admin Approval
  └──► HELP & SUPPORT (Search FAQs, Contextual Support Tickets, Attachments, Chat)
```

---

# 3. MODULE LIST

1. **Website Module (`WEB`)**: Public landing, lead generation request, and OTP verification.
2. **Onboarding Module (`ONB`)**: Multi-step vendor registration wizard, document uploads, and state management.
3. **Authentication & Profile Module (`AUTH`)**: Owner and Staff OTP login, JWT token refresh, profile and device sessions.
4. **Venue & Court Management Module (`VENUE`)**: Physical courts, multi-sport mapping, pricing rules, amenities, and operating hours.
5. **Slot & Availability Module (`SLOT`)**: Unified availability engine, slot generation, conflict checking, and blocking (Maintenance, Private Event, Owner Block).
6. **Booking Engine Module (`BOOK`)**: Normal bookings, booking attempts, extension, check-in, completion, and cancellation.
7. **Coaching Module (`COACH`)**: Coaching programs, recurring schedules, session reservations, renewals, and payments.
8. **Tournament Module (`TOURN`)**: Multi-day/custom-date tournament scheduling, multi-court allocations, package pricing, and cancellation.
9. **Membership Module (`MEMB`)**: Membership plans, player subscriptions, recurring slot entitlement consumption.
10. **Payment & Settlement Module (`PAY`)**: Razorpay link generation, webhook processing, QR balance collection, cash recording, and settlements.
11. **Staff & Access Control Module (`STAFF`)**: Staff invites, role assignments (Manager, Reception), and granular permissions.
12. **Help & Support Module (`HELP`)**: Help categories, search articles, support tickets, file attachments, and reply threads.
13. **Super Admin Module (`ADMIN`)**: Lead applications review, onboarding vetting, court approvals, bank verifications, settlements, and ticket resolution.

---

# 4. MASTER API INVENTORY

| # | Module | API Name | Method | Endpoint | Consumer | Database Entity | Source |
|---|---|---|---|---|---|---|---|
| 01 | WEB | Send Website OTP | POST | `/api/v1/website/request/send-otp` | Website | `otp_verifications` | `IBS WEBSITE.docx` |
| 02 | WEB | Verify Website OTP | POST | `/api/v1/website/request/verify-otp` | Website | `otp_verifications` | `IBS WEBSITE.docx` |
| 03 | WEB | Submit Lead Request | POST | `/api/v1/website/request-ibooksports` | Website | `vendor_applications` | `IBS WEBSITE.docx` |
| 04 | ONB | Send Onboarding OTP | POST | `/api/v1/onboarding/send-otp` | Onboarding | `otp_verifications` | `IBS ONBOARDING.docx` |
| 05 | ONB | Verify Onboarding OTP | POST | `/api/v1/onboarding/verify-otp` | Onboarding | `otp_verifications`, `onboarding_applications` | `IBS ONBOARDING.docx` |
| 06 | ONB | Get Onboarding State | GET | `/api/v1/onboarding/progress` | Onboarding | `onboarding_applications` | `IBS ONBOARDING.docx` |
| 07 | ONB | Save Owner Information | PUT | `/api/v1/onboarding/owner-info` | Onboarding | `onboarding_applications`, `owners` | `IBS ONBOARDING.docx` |
| 08 | ONB | Save Business Information | PUT | `/api/v1/onboarding/business-info` | Onboarding | `onboarding_applications`, `businesses` | `IBS ONBOARDING.docx` |
| 09 | ONB | Save Venue Information | PUT | `/api/v1/onboarding/venue-info` | Onboarding | `onboarding_applications`, `venues` | `IBS ONBOARDING.docx` |
| 10 | ONB | Save Amenities | PUT | `/api/v1/onboarding/amenities` | Onboarding | `onboarding_applications`, `amenities` | `IBS ONBOARDING.docx` |
| 11 | ONB | Save Venue Rules | PUT | `/api/v1/onboarding/rules` | Onboarding | `onboarding_applications`, `venue_rules` | `IBS ONBOARDING.docx` |
| 12 | ONB | Save Sports and Courts | PUT | `/api/v1/onboarding/courts` | Onboarding | `onboarding_applications`, `courts` | `IBS ONBOARDING.docx` |
| 13 | ONB | Save Operating Hours | PUT | `/api/v1/onboarding/operating-hours` | Onboarding | `onboarding_applications`, `operating_hours` | `IBS ONBOARDING.docx` |
| 14 | ONB | Save Bank Details | PUT | `/api/v1/onboarding/bank-details` | Onboarding | `onboarding_applications`, `bank_accounts` | `IBS ONBOARDING.docx` |
| 15 | ONB | Upload Onboarding Document | POST | `/api/v1/onboarding/documents/upload` | Onboarding | `documents` | `IBS ONBOARDING.docx` |
| 16 | ONB | Submit Onboarding Application | POST | `/api/v1/onboarding/submit` | Onboarding | `onboarding_applications` | `IBS ONBOARDING.docx` |
| 17 | AUTH | Send Vendor Login OTP | POST | `/api/v1/auth/vendor/send-otp` | Shared | `otp_verifications` | `IBS ONBOARDING.docx`, `settings.docx` |
| 18 | AUTH | Verify Vendor Login OTP | POST | `/api/v1/auth/vendor/verify-otp` | Shared | `users`, `owners`, `staff` | `IBS ONBOARDING.docx`, `settings.docx` |
| 19 | AUTH | Refresh Token | POST | `/api/v1/auth/refresh-token` | Shared | `users` | `settings.docx` |
| 20 | AUTH | Get Current User Profile | GET | `/api/v1/auth/me` | Shared | `users`, `owners`, `staff` | `settings.docx` |
| 21 | AUTH | Logout | POST | `/api/v1/auth/logout` | Shared | `users` | `settings.docx` |
| 22 | VEND | Get Dashboard Overview | GET | `/api/v1/vendor/dashboard` | Vendor | `bookings`, `payments`, `slots` | `turf_final_flow_enhanced 3.drawio` |
| 23 | VEND | Get Unified Calendar View | GET | `/api/v1/vendor/slots/calendar` | Vendor | `slots`, `courts`, `bookings` | `slot & Availability.docx` |
| 24 | VEND | Check Slot Availability | POST | `/api/v1/vendor/slots/check-availability` | Vendor | `slots`, `courts` | `slot & Availability.docx` |
| 25 | VEND | Create Slot Block (Maintenance/Private/Owner) | POST | `/api/v1/vendor/slots/block` | Vendor | `slot_blocks`, `slots` | `slot & Availability.docx` |
| 26 | VEND | Release Slot Block | DELETE | `/api/v1/vendor/slots/block/:blockId` | Vendor | `slot_blocks`, `slots` | `slot & Availability.docx` |
| 27 | VEND | Get Slot Configuration | GET | `/api/v1/vendor/slots/configuration` | Vendor | `slot_configurations` | `slot & Availability.docx` |
| 28 | VEND | Update Slot Configuration | PUT | `/api/v1/vendor/slots/configuration` | Vendor | `slot_configurations` | `slot & Availability.docx` |
| 29 | VEND | List Bookings | GET | `/api/v1/vendor/bookings` | Vendor | `bookings`, `customers` | `Booking.docx` |
| 30 | VEND | Get Booking Detail | GET | `/api/v1/vendor/bookings/:bookingId` | Vendor | `bookings`, `payments`, `payment_attempts` | `Booking.docx` |
| 31 | VEND | Create Normal Booking | POST | `/api/v1/vendor/bookings` | Vendor | `bookings`, `payment_attempts`, `slots` | `Booking.docx`, `payment.docx` |
| 32 | VEND | Resend Booking Payment Link | POST | `/api/v1/vendor/bookings/:bookingId/send-again` | Vendor | `payment_attempts`, `bookings` | `Booking.docx` |
| 33 | VEND | Check-in Customer | POST | `/api/v1/vendor/bookings/:bookingId/check-in` | Vendor | `bookings` | `Booking.docx` |
| 34 | VEND | Extend Booking Slot | POST | `/api/v1/vendor/bookings/:bookingId/extend` | Vendor | `bookings`, `booking_charges`, `payment_attempts` | `Booking.docx` |
| 35 | VEND | Complete Booking | POST | `/api/v1/vendor/bookings/:bookingId/complete` | Vendor | `bookings` | `payment.docx` |
| 36 | VEND | Cancel Booking | POST | `/api/v1/vendor/bookings/:bookingId/cancel` | Vendor | `bookings`, `slots` | `Booking.docx` |
| 37 | VEND | List Coaching Programs | GET | `/api/v1/vendor/coaching` | Vendor | `coaching_programs` | `coaching.docx` |
| 38 | VEND | Get Coaching Detail | GET | `/api/v1/vendor/coaching/:coachingId` | Vendor | `coaching_programs`, `coaching_reservations` | `coaching.docx` |
| 39 | VEND | Create Coaching Program | POST | `/api/v1/vendor/coaching` | Vendor | `coaching_programs`, `coaching_reservations`, `payment_attempts` | `coaching.docx` |
| 40 | VEND | Resend Coaching Payment Link | POST | `/api/v1/vendor/coaching/:coachingId/send-again` | Vendor | `payment_attempts`, `coaching_programs` | `coaching.docx` |
| 41 | VEND | Renew Coaching Program | POST | `/api/v1/vendor/coaching/:coachingId/renew` | Vendor | `coaching_programs`, `coaching_reservations`, `payment_attempts` | `coaching.docx` |
| 42 | VEND | Cancel Coaching Program | POST | `/api/v1/vendor/coaching/:coachingId/cancel` | Vendor | `coaching_programs`, `coaching_reservations` | `coaching.docx` |
| 43 | VEND | List Tournaments | GET | `/api/v1/vendor/tournaments` | Vendor | `tournaments` | `Tournament.docx` |
| 44 | VEND | Get Tournament Detail | GET | `/api/v1/vendor/tournaments/:tournamentId` | Vendor | `tournaments`, `tournament_allocations` | `Tournament.docx` |
| 45 | VEND | Create Tournament | POST | `/api/v1/vendor/tournaments` | Vendor | `tournaments`, `tournament_allocations`, `payment_attempts` | `Tournament.docx` |
| 46 | VEND | Resend Tournament Payment Link | POST | `/api/v1/vendor/tournaments/:tournamentId/send-again` | Vendor | `payment_attempts`, `tournaments` | `Tournament.docx` |
| 47 | VEND | Edit Tournament Court Allocation | PUT | `/api/v1/vendor/tournaments/:tournamentId/allocations` | Vendor | `tournament_allocations`, `tournaments` | `Tournament.docx` |
| 48 | VEND | Extend Tournament | POST | `/api/v1/vendor/tournaments/:tournamentId/extend` | Vendor | `tournaments`, `tournament_allocations`, `payment_attempts` | `Tournament.docx` |
| 49 | VEND | Cancel Tournament | POST | `/api/v1/vendor/tournaments/:tournamentId/cancel` | Vendor | `tournaments`, `tournament_allocations` | `Tournament.docx` |
| 50 | VEND | List Membership Plans | GET | `/api/v1/vendor/memberships/plans` | Vendor | `membership_plans` | `membership.docx` |
| 51 | VEND | Create Membership Plan | POST | `/api/v1/vendor/memberships/plans` | Vendor | `membership_plans` | `membership.docx` |
| 52 | VEND | Create Member Subscription | POST | `/api/v1/vendor/memberships/subscriptions` | Vendor | `member_subscriptions`, `payment_attempts` | `membership.docx` |
| 53 | VEND | Resend Membership Payment Link | POST | `/api/v1/vendor/memberships/subscriptions/:id/send-again` | Vendor | `payment_attempts`, `member_subscriptions` | `membership.docx` |
| 54 | VEND | Send Balance Payment Link | POST | `/api/v1/vendor/payments/send-balance-link` | Vendor | `payment_attempts`, `payments` | `payment.docx` |
| 55 | VEND | Generate Venue Balance QR | POST | `/api/v1/vendor/payments/generate-qr` | Vendor | `payment_attempts`, `payments` | `payment.docx` |
| 56 | VEND | Record Cash Payment | POST | `/api/v1/vendor/payments/record-cash` | Vendor | `payment_transactions`, `payments`, `bookings` | `payment.docx` |
| 57 | VEND | List Payments | GET | `/api/v1/vendor/payments` | Vendor | `payments` | `payment.docx` |
| 58 | VEND | List Physical Courts | GET | `/api/v1/vendor/settings/courts` | Vendor | `courts`, `court_sports`, `pricing_rules` | `settings.docx` |
| 59 | VEND | Add Physical Court | POST | `/api/v1/vendor/settings/courts` | Vendor | `courts`, `court_sports`, `pricing_rules` | `settings.docx` |
| 60 | VEND | Update Physical Court | PUT | `/api/v1/vendor/settings/courts/:courtId` | Vendor | `courts`, `court_sports`, `pricing_rules` | `settings.docx` |
| 61 | VEND | Get Operating Hours | GET | `/api/v1/vendor/settings/operating-hours` | Vendor | `operating_hours`, `closures` | `settings.docx` |
| 62 | VEND | Update Operating Hours | PUT | `/api/v1/vendor/settings/operating-hours` | Vendor | `operating_hours` | `settings.docx` |
| 63 | VEND | Add Closure / Break | POST | `/api/v1/vendor/settings/closures` | Vendor | `closures` | `settings.docx` |
| 64 | VEND | Get Booking & Payment Settings | GET | `/api/v1/vendor/settings/booking-payment` | Vendor | `venue_settings` | `settings.docx` |
| 65 | VEND | Update Booking & Payment Settings | PUT | `/api/v1/vendor/settings/booking-payment` | Vendor | `venue_settings` | `settings.docx` |
| 66 | VEND | Get Settlement Bank Account | GET | `/api/v1/vendor/settings/bank-account` | Vendor | `bank_accounts` | `settings.docx` |
| 67 | VEND | Submit New Bank Account | POST | `/api/v1/vendor/settings/bank-account` | Vendor | `bank_accounts` | `settings.docx` |
| 68 | VEND | List Staff | GET | `/api/v1/vendor/settings/staff` | Vendor | `staff` | `settings.docx` |
| 69 | VEND | Invite Staff | POST | `/api/v1/vendor/settings/staff` | Vendor | `staff` | `settings.docx` |
| 70 | VEND | Update Staff Permissions / Status | PUT | `/api/v1/vendor/settings/staff/:staffId` | Vendor | `staff` | `settings.docx` |
| 71 | VEND | Get Notification Settings | GET | `/api/v1/vendor/settings/notifications` | Vendor | `notification_settings` | `settings.docx` |
| 72 | VEND | Update Notification Settings | PUT | `/api/v1/vendor/settings/notifications` | Vendor | `notification_settings` | `settings.docx` |
| 73 | VEND | Get Help Categories & Popular FAQs | GET | `/api/v1/vendor/help/categories` | Vendor | `help_categories`, `help_articles` | `Help &support.docx` |
| 74 | VEND | Search Help Articles | GET | `/api/v1/vendor/help/search` | Vendor | `help_articles` | `Help &support.docx` |
| 75 | VEND | Create Support Ticket | POST | `/api/v1/vendor/help/tickets` | Vendor | `support_tickets`, `ticket_attachments` | `Help &support.docx` |
| 76 | VEND | List My Support Tickets | GET | `/api/v1/vendor/help/tickets` | Vendor | `support_tickets` | `Help &support.docx` |
| 77 | VEND | Get Support Ticket Detail & Chat | GET | `/api/v1/vendor/help/tickets/:ticketId` | Vendor | `support_tickets`, `ticket_messages`, `ticket_attachments` | `Help &support.docx` |
| 78 | VEND | Reply to Support Ticket | POST | `/api/v1/vendor/help/tickets/:ticketId/reply` | Vendor | `ticket_messages`, `support_tickets` | `Help &support.docx` |
| 79 | SHARED | Handle Razorpay Webhook | POST | `/api/v1/webhooks/razorpay` | Shared | `payment_transactions`, `payments`, `bookings`, `slots` | `payment.docx`, User Prompt |
| 80 | ADMIN | List Lead Applications | GET | `/api/v1/admin/applications` | Super Admin | `vendor_applications` | `IBS WEBSITE.docx` |
| 81 | ADMIN | Review Lead Application | POST | `/api/v1/admin/applications/:id/review` | Super Admin | `vendor_applications` | `IBS WEBSITE.docx` |
| 82 | ADMIN | List Onboarding Submissions | GET | `/api/v1/admin/onboarding` | Super Admin | `onboarding_applications`, `venues` | `IBS ONBOARDING.docx` |
| 83 | ADMIN | Review Onboarding Submission | POST | `/api/v1/admin/onboarding/:id/review` | Super Admin | `onboarding_applications`, `venues`, `owners` | `IBS ONBOARDING.docx` |
| 84 | ADMIN | List Pending Court Approvals | GET | `/api/v1/admin/courts/pending` | Super Admin | `courts`, `venues` | `settings.docx` |
| 85 | ADMIN | Review Court Approval | POST | `/api/v1/admin/courts/:courtId/review` | Super Admin | `courts` | `settings.docx` |
| 86 | ADMIN | List Pending Bank Verifications | GET | `/api/v1/admin/bank-accounts/pending` | Super Admin | `bank_accounts`, `venues` | `settings.docx` |
| 87 | ADMIN | Review Bank Account Verification | POST | `/api/v1/admin/bank-accounts/:id/review` | Super Admin | `bank_accounts` | `settings.docx` |
| 88 | ADMIN | List Support Tickets | GET | `/api/v1/admin/support/tickets` | Super Admin | `support_tickets` | `Help &support.docx` |
| 89 | ADMIN | Super Admin Reply / Update Ticket | POST | `/api/v1/admin/support/tickets/:id/reply` | Super Admin | `ticket_messages`, `support_tickets` | `Help &support.docx` |
| 90 | ADMIN | List & Process Settlements | POST | `/api/v1/admin/settlements/process` | Super Admin | `settlements`, `payments` | `settings.docx`, `turf_final_flow_enhanced 3.drawio` |

---

# 5. WEBSITE APIs

### API: WEB-01 Send Website OTP
- **Purpose**: Sends an SMS OTP to verify the prospective venue owner's mobile number during website request submission.
- **Method**: `POST`
- **Endpoint**: `/api/v1/website/request/send-otp`
- **Authentication**: Not Required
- **Request Headers**: `Content-Type: application/json`
- **Path / Query Parameters**: `None`
- **Request Body**:
```json
{
  "mobile_number": "9876543210"
}
```
- **Request Attributes**:
  - `mobile_number` (string, Required): 10-digit Indian mobile number.
- **Validation Rules**: `mobile_number` must be exactly 10 numeric digits starting with 6-9.
- **Success Response**: `200 OK`
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "verification_id": "otp_req_987123"
}
```
- **Response Attributes**: `success` (boolean), `message` (string), `verification_id` (string).
- **Possible Errors**: `400 Bad Request` (Invalid mobile format), `429 Too Many Requests` (Rate limit reached).

---

### API: WEB-02 Verify Website OTP
- **Purpose**: Validates the OTP entered by the user on the website form before allowing lead submission.
- **Method**: `POST`
- **Endpoint**: `/api/v1/website/request/verify-otp`
- **Authentication**: Not Required
- **Request Body**:
```json
{
  "verification_id": "otp_req_987123",
  "mobile_number": "9876543210",
  "otp": "123456"
}
```
- **Request Attributes**:
  - `verification_id` (string, Required): ID returned from send-otp.
  - `mobile_number` (string, Required): 10-digit mobile number.
  - `otp` (string, Required): 6-digit numeric OTP code.
- **Validation Rules**: `otp` must be 6 numeric digits.
- **Success Response**: `200 OK`
```json
{
  "verified": true,
  "verification_token": "tok_otp_verified_abc123"
}
```
- **Possible Errors**: `400 Bad Request` (Invalid or expired OTP).

---

### API: WEB-03 Submit Lead Request
- **Purpose**: Submits the primary conversion form on `/request-ibooksports` creating a lead application.
- **Method**: `POST`
- **Endpoint**: `/api/v1/website/request-ibooksports`
- **Authentication**: Not Required (Guarded by `verification_token`)
- **Request Body**:
```json
{
  "verification_token": "tok_otp_verified_abc123",
  "business_name": "Sky Sports Arena",
  "venue_name": "Sky Arena Turf",
  "email": "owner@skysports.com",
  "mobile_number": "9876543210",
  "venue_location": {
    "address": "123 Avinashi Road, Peelamedu, Coimbatore",
    "latitude": 11.0283,
    "longitude": 77.0012,
    "google_maps_url": "https://maps.google.com/..."
  },
  "sports_provided": ["FOOTBALL", "CRICKET"],
  "number_of_courts": 4
}
```
- **Request Attributes**:
  - `verification_token` (string, Required): Token from successful OTP verification.
  - `business_name` (string, Required): Business/Company name.
  - `venue_name` (string, Required): Display name of the venue.
  - `email` (string, Required): Valid email address.
  - `mobile_number` (string, Required): Verified mobile number.
  - `venue_location` (object, Required): Address, latitude, longitude, and optional Google Maps URL.
  - `sports_provided` (array of strings, Required): Selected sports (`FOOTBALL`, `CRICKET`, `BOX_CRICKET`, `BADMINTON`, `TENNIS`, `OTHER`).
  - `number_of_courts` (integer, Required): Integer count of facilities.
- **Success Response**: `201 Created`
```json
{
  "success": true,
  "application_id": "APP10231",
  "message": "Request Submitted Successfully. Our team has received your venue details and will contact you shortly."
}
```
- **Possible Errors**: `400 Bad Request` (Invalid token or missing required fields), `409 Conflict` (Application already exists for this mobile number).

---

# 6. ONBOARDING APIs

### API: ONB-04 Send Onboarding OTP
- **Purpose**: Sends an OTP to the pre-filled approved mobile number to start or resume onboarding.
- **Method**: `POST`
- **Endpoint**: `/api/v1/onboarding/send-otp`
- **Authentication**: Not Required
- **Request Body**:
```json
{
  "application_id": "APP10231",
  "mobile_number": "9876543210"
}
```
- **Success Response**: `200 OK` (`{ "success": true, "verification_id": "otp_onb_456" }`)

---

### API: ONB-05 Verify Onboarding OTP
- **Purpose**: Verifies the vendor and issues a temporary onboarding session token.
- **Method**: `POST`
- **Endpoint**: `/api/v1/onboarding/verify-otp`
- **Authentication**: Not Required
- **Request Body**:
```json
{
  "application_id": "APP10231",
  "verification_id": "otp_onb_456",
  "otp": "654321"
}
```
- **Success Response**: `200 OK`
```json
{
  "onboarding_token": "eyOnboardingJwtToken...",
  "current_step": 2,
  "application_status": "ONBOARDING_IN_PROGRESS"
}
```

---

### API: ONB-06 Get Onboarding State
- **Purpose**: Fetches the current progress, completed steps, and saved draft data for the 11-step wizard.
- **Method**: `GET`
- **Endpoint**: `/api/v1/onboarding/progress`
- **Authentication**: Required (`Bearer <onboarding_token>`)
- **Success Response**: `200 OK`
```json
{
  "application_id": "APP10231",
  "status": "ONBOARDING_IN_PROGRESS",
  "completed_steps": [1, 2, 3],
  "current_step": 4,
  "data": {
    "owner": { ... },
    "business": { ... },
    "venue": { ... }
  }
}
```

---

### API: ONB-07 Save Owner Information (Step 2)
- **Method**: `PUT`
- **Endpoint**: `/api/v1/onboarding/owner-info`
- **Authentication**: Required (`Bearer <onboarding_token>`)
- **Request Body**:
```json
{
  "full_name": "Karthik Rajan",
  "email": "karthik@skysports.com",
  "date_of_birth": "1988-05-14",
  "pan_number": "ABCDE1234F",
  "aadhaar_number": "123456789012",
  "address": "45 Race Course Road",
  "city": "Coimbatore",
  "state": "Tamil Nadu",
  "pincode": "641018"
}
```
- **Success Response**: `200 OK` (`{ "success": true, "step": 2, "next_step": 3 }`)

---

### API: ONB-08 Save Business Information (Step 3)
- **Method**: `PUT`
- **Endpoint**: `/api/v1/onboarding/business-info`
- **Authentication**: Required (`Bearer <onboarding_token>`)
- **Request Body**:
```json
{
  "business_name": "Sky Sports Private Limited",
  "brand_name": "Sky Sports Arena",
  "business_type": "PRIVATE_LIMITED",
  "business_email": "contact@skysports.com",
  "business_mobile": "9876543210",
  "business_address": "45 Race Course Road",
  "city": "Coimbatore",
  "state": "Tamil Nadu",
  "pincode": "641018",
  "gst_registered": true,
  "gst_number": "33ABCDE1234F1Z5",
  "business_pan": "ABCDE1234F"
}
```
- **Validation Rules**: If `gst_registered` is true, `gst_number` is required.

---

### API: ONB-09 Save Venue Information (Step 4)
- **Method**: `PUT`
- **Endpoint**: `/api/v1/onboarding/venue-info`
- **Authentication**: Required (`Bearer <onboarding_token>`)
- **Request Body**:
```json
{
  "venue_name": "Sky Arena Peelamedu",
  "brand_name": "Sky Sports Arena",
  "description": "Premium FIFA standard turf facility",
  "address": "123 Avinashi Road",
  "area": "Peelamedu",
  "city": "Coimbatore",
  "district": "Coimbatore",
  "state": "Tamil Nadu",
  "pincode": "641004",
  "google_maps_location": "https://maps.google.com/?q=11.0283,77.0012",
  "latitude": 11.0283,
  "longitude": 77.0012,
  "contact_number": "9876543210",
  "venue_email": "peelamedu@skysports.com",
  "number_of_courts": 4,
  "photo_document_ids": ["doc_img_1", "doc_img_2", "doc_img_3", "doc_img_4"]
}
```
- **Validation Rules**: `photo_document_ids` must contain between 4 and 10 items (source constraint).

---

### API: ONB-10 Save Amenities (Step 5)
- **Method**: `PUT`
- **Endpoint**: `/api/v1/onboarding/amenities`
- **Authentication**: Required (`Bearer <onboarding_token>`)
- **Request Body**:
```json
{
  "amenities": [
    { "amenity_name": "Parking", "status": true },
    { "amenity_name": "Washroom", "status": true },
    { "amenity_name": "Floodlights", "status": true },
    { "amenity_name": "Drinking Water", "status": true },
    { "amenity_name": "Shower", "status": false }
  ],
  "custom_amenities": ["Cafeteria"]
}
```

---

### API: ONB-11 Save Venue Rules (Step 6)
- **Method**: `PUT`
- **Endpoint**: `/api/v1/onboarding/rules`
- **Authentication**: Required (`Bearer <onboarding_token>`)
- **Request Body**:
```json
{
  "booking_rules": {
    "advance_booking_required": true,
    "same_day_booking_allowed": true,
    "walk_in_allowed": true
  },
  "payment_rules": {
    "advance_payment_mandatory_online": true,
    "balance_payment_online_or_cash": true
  },
  "cancellation_rules": {
    "cancellation_allowed": true,
    "cutoff_hours_before_slot": 4,
    "refund_available": true,
    "refund_type": "PARTIAL"
  },
  "usage_rules": [
    "Proper sports shoes required",
    "No outside food allowed",
    "Arrive 10 minutes prior to slot"
  ],
  "custom_rules": ["Non-marking shoes only on badminton court"]
}
```

---

### API: ONB-12 Save Sports & Courts (Step 7)
- **Method**: `PUT`
- **Endpoint**: `/api/v1/onboarding/courts`
- **Authentication**: Required (`Bearer <onboarding_token>`)
- **Request Body**:
```json
{
  "sports": ["FOOTBALL", "CRICKET"],
  "courts": [
    {
      "court_name": "Turf 1",
      "court_number": 1,
      "sport": "FOOTBALL",
      "court_type": "Football Turf",
      "slot_duration_minutes": 60,
      "hourly_price": 1000
    },
    {
      "court_name": "Turf 2",
      "court_number": 2,
      "sport": "CRICKET",
      "court_type": "Box Cricket",
      "slot_duration_minutes": 60,
      "hourly_price": 1200
    },
    {
      "court_name": "Turf 3",
      "court_number": 3,
      "sport": "FOOTBALL",
      "court_type": "Football Turf",
      "slot_duration_minutes": 60,
      "hourly_price": 1000
    },
    {
      "court_name": "Turf 4",
      "court_number": 4,
      "sport": "FOOTBALL",
      "court_type": "Football Turf",
      "slot_duration_minutes": 60,
      "hourly_price": 1000
    }
  ]
}
```
- **Validation Rules**: Initial court count between 4 and 10.

---

### API: ONB-13 Save Operating Hours (Step 8)
- **Method**: `PUT`
- **Endpoint**: `/api/v1/onboarding/operating-hours`
- **Authentication**: Required (`Bearer <onboarding_token>`)
- **Request Body**:
```json
{
  "operating_hours": [
    { "day_of_week": "MONDAY", "is_open": true, "opening_time": "06:00", "closing_time": "23:00" },
    { "day_of_week": "TUESDAY", "is_open": true, "opening_time": "06:00", "closing_time": "23:00" },
    { "day_of_week": "WEDNESDAY", "is_open": true, "opening_time": "06:00", "closing_time": "23:00" },
    { "day_of_week": "THURSDAY", "is_open": true, "opening_time": "06:00", "closing_time": "23:00" },
    { "day_of_week": "FRIDAY", "is_open": true, "opening_time": "06:00", "closing_time": "23:00" },
    { "day_of_week": "SATURDAY", "is_open": true, "opening_time": "06:00", "closing_time": "00:00" },
    { "day_of_week": "SUNDAY", "is_open": true, "opening_time": "06:00", "closing_time": "00:00" }
  ]
}
```

---

### API: ONB-14 Save Bank Details (Step 9)
- **Method**: `PUT`
- **Endpoint**: `/api/v1/onboarding/bank-details`
- **Authentication**: Required (`Bearer <onboarding_token>`)
- **Request Body**:
```json
{
  "account_holder_name": "Sky Sports Private Limited",
  "bank_name": "HDFC Bank",
  "account_number": "50200012345678",
  "confirm_account_number": "50200012345678",
  "ifsc_code": "HDFC0001234",
  "account_type": "CURRENT",
  "branch_name": "Peelamedu",
  "bank_proof_document_id": "doc_bank_passbook_99"
}
```
- **Validation Rules**: `account_number` must match `confirm_account_number`.

---

### API: ONB-15 Upload Onboarding Document (Step 10)
- **Method**: `POST`
- **Endpoint**: `/api/v1/onboarding/documents/upload`
- **Authentication**: Required (`Bearer <onboarding_token>`)
- **Request Headers**: `Content-Type: multipart/form-data`
- **Request Body (FormData)**:
  - `file`: binary file (JPG, PNG, PDF)
  - `document_type`: enum (`PAN`, `AADHAAR`, `GST_CERTIFICATE`, `BUSINESS_REGISTRATION`, `BANK_PROOF`, `VENUE_LEASE_DOCUMENT`, `VENUE_PHOTO`)
- **Success Response**: `201 Created`
```json
{
  "document_id": "doc_789123",
  "document_type": "PAN",
  "file_url": "https://storage.ibooksports.com/docs/pan_123.pdf",
  "uploaded_at": "2026-08-28T10:00:00Z"
}
```

---

### API: ONB-16 Submit Onboarding Application (Step 11)
- **Method**: `POST`
- **Endpoint**: `/api/v1/onboarding/submit`
- **Authentication**: Required (`Bearer <onboarding_token>`)
- **Request Body**:
```json
{
  "declaration_accepted": true
}
```
- **Success Response**: `200 OK`
```json
{
  "success": true,
  "status": "UNDER_REVIEW",
  "message": "Your venue onboarding details have been submitted successfully. Our team will review your information and documents."
}
```

---

# 7. VENDOR MOBILE / WEB APPLICATION APIs

### API: AUTH-17 Send Vendor Login OTP
- **Endpoint**: `/api/v1/auth/vendor/send-otp` | `POST` | Auth: Not Required
- **Request Body**: `{ "mobile_number": "9876543210" }`
- **Response**: `{ "success": true, "verification_id": "otp_auth_789" }`

---

### API: AUTH-18 Verify Vendor Login OTP
- **Endpoint**: `/api/v1/auth/vendor/verify-otp` | `POST` | Auth: Not Required
- **Request Body**: `{ "verification_id": "otp_auth_789", "mobile_number": "9876543210", "otp": "123456" }`
- **Response**:
```json
{
  "access_token": "eyJwtAccessToken...",
  "refresh_token": "eyJwtRefreshToken...",
  "user": {
    "user_id": "usr_1001",
    "role": "OWNER",
    "name": "Karthik Rajan",
    "mobile": "9876543210",
    "venue_id": "ven_501"
  }
}
```

---

### API: VEND-22 Get Dashboard Overview
- **Endpoint**: `/api/v1/vendor/dashboard` | `GET` | Auth: Required (Owner/Staff)
- **Query Parameters**:
  - `period`: enum (`TODAY`, `THIS_WEEK`, `THIS_MONTH`, `THIS_YEAR`, `CUSTOM`)
  - `start_date`: string (`YYYY-MM-DD`, conditional if `CUSTOM`)
  - `end_date`: string (`YYYY-MM-DD`, conditional if `CUSTOM`)
  - `court_id`: string (Optional, default `ALL`)
- **Success Response**: `200 OK`
```json
{
  "kpis": {
    "total_bookings": { "count": 28, "change_percentage": 12.5 },
    "revenue": { "total_value": 35000, "collected": 27500, "pending": 7500 },
    "payment_pending": { "count": 3, "amount": 7500 },
    "slot_utilization": { "percentage": 76.0, "booked_hours": 38, "available_hours": 10, "blocked_hours": 2 }
  },
  "action_required": [
    {
      "type": "PAYMENT_PENDING",
      "booking_id": "BK10231",
      "customer_name": "Rahul Kumar",
      "court_name": "Turf 1",
      "time_slot": "07:00 PM - 08:00 PM",
      "pending_amount": 2500,
      "action": "SEND_PAYMENT_LINK"
    }
  ],
  "booking_type_breakdown": {
    "NORMAL": 18,
    "COACHING": 4,
    "TOURNAMENT": 2,
    "MEMBERSHIP": 3,
    "PRIVATE_EVENT": 1
  },
  "today_schedule": [
    { "time": "06:00 - 07:00 AM", "court": "Turf 1", "type": "COACHING", "status": "CONFIRMED" },
    { "time": "07:00 - 08:00 AM", "court": "Turf 1", "type": "NORMAL", "status": "CONFIRMED" },
    { "time": "08:00 - 09:00 AM", "court": "Turf 1", "type": "AVAILABLE", "status": "AVAILABLE" }
  ]
}
```

---

### API: VEND-23 Get Unified Calendar View
- **Endpoint**: `/api/v1/vendor/slots/calendar` | `GET` | Auth: Required
- **Query Parameters**:
  - `view`: enum (`DAY`, `WEEK`, `MONTH`)
  - `date`: string (`YYYY-MM-DD`)
  - `court_id`: string (Optional)
  - `sport_id`: string (Optional)
- **Response**: Array of hour/slot items with color markers and details:
  - 🟢 `AVAILABLE`
  - 🟡 `PAYMENT_PENDING` / `HELD`
  - 🔵 `CONFIRMED`
  - 🟣 `COACHING`
  - 🟠 `TOURNAMENT`
  - 🔴 `MAINTENANCE`
  - ⚫ `PRIVATE_EVENT`

---

### API: VEND-24 Check Slot Availability
- **Endpoint**: `/api/v1/vendor/slots/check-availability` | `POST` | Auth: Required
- **Request Body**:
```json
{
  "court_id": "crt_1",
  "sport_id": "spt_football",
  "date": "2026-08-28",
  "start_time": "19:00",
  "end_time": "20:00"
}
```
- **Response**:
```json
{
  "is_available": true,
  "base_price": 1000,
  "peak_price": 200,
  "total_price": 1200,
  "conflicts": []
}
```

---

### API: VEND-25 Create Slot Block (Maintenance / Private / Owner Block)
- **Endpoint**: `/api/v1/vendor/slots/block` | `POST` | Auth: Required
- **Request Body**:
```json
{
  "court_id": "crt_1",
  "block_type": "MAINTENANCE",
  "date": "2026-08-28",
  "start_time": "10:00",
  "end_time": "14:00",
  "reason": "Turf surface maintenance",
  "notes": "Contractor repairing grass"
}
```
- **Validation Rules**: Cannot overwrite confirmed bookings (`409 Conflict`).

---

### API: VEND-31 Create Normal Booking
- **Endpoint**: `/api/v1/vendor/bookings` | `POST` | Auth: Required
- **Request Body**:
```json
{
  "customer_name": "Rahul Kumar",
  "customer_phone": "9876543210",
  "sport_id": "spt_football",
  "court_id": "crt_1",
  "booking_date": "2026-08-28",
  "start_time": "19:00",
  "end_time": "20:00",
  "payment_option": "ADVANCE_50"
}
```
- **Business Rule Triggered**:
  - Calculates Total: ₹5,000, Required: ₹2,500, Balance: ₹2,500.
  - Creates Booking record in `PAYMENT_PENDING` status.
  - Starts 30-minute hold on slot (`HELD`).
  - Creates `Payment Attempt #1` with Razorpay Payment Link.
  - Triggers WhatsApp notification to customer with Razorpay link.
- **Success Response**: `201 Created`
```json
{
  "booking_id": "BK10231",
  "total_amount": 5000,
  "required_amount": 2500,
  "balance_amount": 2500,
  "booking_status": "PAYMENT_PENDING",
  "payment_status": "UNPAID",
  "hold_expires_at": "2026-08-28T19:30:00Z",
  "payment_link": "https://rzp.io/i/ibooksports_bk10231"
}
```

---

### API: VEND-32 Resend Booking Payment Link ("Send Again")
- **Endpoint**: `/api/v1/vendor/bookings/:bookingId/send-again` | `POST` | Auth: Required
- **Business Rule Triggered**:
  - Checks if original slot is still available.
  - If available: Creates `Payment Attempt #2`, generates fresh Razorpay link, starts new 30-min hold, sends WhatsApp.
  - If taken: Returns `409 Conflict` with available alternative slots.
- **Success Response**: `200 OK`
```json
{
  "success": true,
  "attempt_number": 2,
  "hold_expires_at": "2026-08-28T20:15:00Z",
  "payment_link": "https://rzp.io/i/ibooksports_bk10231_2"
}
```

---

### API: VEND-34 Extend Booking Slot
- **Endpoint**: `/api/v1/vendor/bookings/:bookingId/extend` | `POST` | Auth: Required
- **Request Body**:
```json
{
  "extension_start_time": "20:00",
  "extension_end_time": "21:00"
}
```
- **Business Rule**: Checks next hour availability -> creates extension charge -> generates payment link -> 30-min hold on extension slot -> once paid, merges into single continuous booking.

---

### API: VEND-35 Complete Booking
- **Endpoint**: `/api/v1/vendor/bookings/:bookingId/complete` | `POST` | Auth: Required
- **Validation Rule**: Enabled **only** when `balance_amount == 0`.
- **Response**: Updates booking status to `COMPLETED`.

---

### API: VEND-39 Create Coaching Program
- **Endpoint**: `/api/v1/vendor/coaching` | `POST` | Auth: Required
- **Request Body**:
```json
{
  "coaching_name": "Arun Football Academy",
  "coach_name": "Arun Kumar",
  "mobile_number": "9876543210",
  "sport_id": "spt_football",
  "court_id": "crt_1",
  "schedule_type": "RECURRING",
  "days_of_week": ["MONDAY", "WEDNESDAY", "FRIDAY"],
  "start_time": "06:00",
  "end_time": "08:00",
  "start_date": "2026-09-01",
  "end_date": "2026-09-30",
  "coaching_price": 5000,
  "payment_option": "ADVANCE_50",
  "auto_renewal": true,
  "renewal_period": "1_MONTH"
}
```
- **Business Rule**: Checks all 13 future occurrences for conflicts -> calculates price -> 30-min hold on initial confirmation -> sends WhatsApp Razorpay link.

---

### API: VEND-45 Create Tournament
- **Endpoint**: `/api/v1/vendor/tournaments` | `POST` | Auth: Required
- **Request Body**:
```json
{
  "tournament_name": "Madurai Football Cup",
  "club_academy_name": "Madurai Football Association",
  "organizer_name": "Arun Kumar",
  "mobile_number": "9876543210",
  "sport_id": "spt_football",
  "tournament_type": "CUP",
  "schedule_type": "CONTINUOUS_DAYS",
  "start_date": "2026-09-25",
  "end_date": "2026-09-27",
  "courts": ["crt_1", "crt_2"],
  "start_time": "08:00",
  "end_time": "20:00",
  "pricing_type": "PER_COURT_HOUR",
  "hourly_rate_per_court": 1500,
  "payment_option": "ADVANCE_50"
}
```

---

### API: VEND-49 Cancel Tournament
- **Endpoint**: `/api/v1/vendor/tournaments/:tournamentId/cancel` | `POST` | Auth: Required
- **Request Body**:
```json
{
  "cancellation_reason": "ORGANIZER_REQUEST",
  "additional_notes": "Organizer requested cancellation due to weather"
}
```
- **Business Rule**: Status becomes `CANCELLED`. Releases **future** reserved slots only; past completed allocations remain untouched.

---

### API: VEND-54 Send Balance Payment Link (Stage 2 Payment)
- **Endpoint**: `/api/v1/vendor/payments/send-balance-link` | `POST` | Auth: Required
- **Request Body**: `{ "booking_id": "BK10231" }`
- **Response**: Generates Razorpay balance link and dispatches WhatsApp balance request to customer.

---

### API: VEND-55 Generate Venue Balance QR (Stage 2 Payment)
- **Endpoint**: `/api/v1/vendor/payments/generate-qr` | `POST` | Auth: Required
- **Request Body**: `{ "booking_id": "BK10231" }`
- **Response**: Returns Razorpay Dynamic UPI QR code payload and URL for display on the owner's mobile screen.

---

### API: VEND-56 Record Cash Payment (Stage 2 Payment)
- **Endpoint**: `/api/v1/vendor/payments/record-cash` | `POST` | Auth: Required
- **Request Body**:
```json
{
  "booking_id": "BK10231",
  "amount_received": 2500,
  "notes": "Collected cash at reception"
}
```
- **Business Rule**: Creates a `CASH` payment transaction, sets `paid_amount = total_amount`, `balance_amount = 0`, `payment_status = PAID`.

---

### API: VEND-59 Add Physical Court
- **Endpoint**: `/api/v1/vendor/settings/courts` | `POST` | Auth: Required
- **Request Body**:
```json
{
  "court_name": "Turf 1",
  "display_name": "Turf 1 - Multi-Sport",
  "minimum_booking_duration": 60,
  "multi_sport_enabled": true,
  "sports": [
    {
      "sport_id": "spt_football",
      "display_name": "Football Turf",
      "regular_hourly_price": 1000,
      "peak_pricing": [
        { "days": ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"], "start_time": "17:00", "end_time": "22:00", "hourly_price": 1500 }
      ],
      "weekend_pricing": { "days": ["SATURDAY", "SUNDAY"], "hourly_price": 1300 }
    },
    {
      "sport_id": "spt_cricket",
      "display_name": "Box Cricket",
      "regular_hourly_price": 1200
    }
  ]
}
```
- **Business Rule**: Court status becomes `PENDING_APPROVAL`. It is not bookable until approved by Super Admin.

---

### API: VEND-75 Create Support Ticket
- **Endpoint**: `/api/v1/vendor/help/tickets` | `POST` | Auth: Required
- **Request Body**:
```json
{
  "category": "PAYMENT",
  "issue_type": "Payment not received",
  "subject": "Customer payment issue for BK10231",
  "description": "Customer paid online via Razorpay link but booking did not confirm.",
  "booking_id": "BK10231",
  "attachment_ids": ["doc_screen_123"]
}
```
- **Response**: `201 Created` (`{ "ticket_id": "SUP10231", "status": "OPEN" }`)

---

# 8. SUPER ADMIN APIs

### API: ADMIN-80 List Lead Applications
- **Endpoint**: `/api/v1/admin/applications` | `GET` | Auth: Required (Admin)
- **Query Parameters**: `status` (`PENDING`, `APPROVED`, `REJECTED`), `page`, `limit`

---

### API: ADMIN-81 Review Lead Application
- **Endpoint**: `/api/v1/admin/applications/:id/review` | `POST` | Auth: Required (Admin)
- **Request Body**:
```json
{
  "action": "APPROVE", // or "REJECT"
  "admin_remarks": "Verified business in Coimbatore. Approved for onboarding."
}
```
- **Business Rule**: On `APPROVE`, generates Onboarding record and triggers WhatsApp/SMS onboarding link to vendor.

---

### API: ADMIN-83 Review Onboarding Submission
- **Endpoint**: `/api/v1/admin/onboarding/:id/review` | `POST` | Auth: Required (Admin)
- **Request Body**:
```json
{
  "action": "APPROVE", // or "CHANGES_REQUIRED" or "REJECT"
  "correction_sections": ["BANK_DETAILS", "OWNER_DOCUMENTS"],
  "admin_remarks": "Passbook image is blurry, please re-upload."
}
```
- **Business Rule**:
  - `APPROVE`: Activates Venue, creates Owner credentials, activates Vendor Mobile App access.
  - `CHANGES_REQUIRED`: Sets status to `CHANGES_REQUIRED`, unlocks specific sections for vendor edit without resetting full application.

---

### API: ADMIN-85 Review Court Approval
- **Endpoint**: `/api/v1/admin/courts/:courtId/review` | `POST` | Auth: Required (Admin)
- **Request Body**:
```json
{
  "action": "APPROVE", // or "REJECT"
  "admin_remarks": "Court inspection verified."
}
```

---

### API: ADMIN-87 Review Bank Account Verification
- **Endpoint**: `/api/v1/admin/bank-accounts/:id/review` | `POST` | Auth: Required (Admin)
- **Request Body**:
```json
{
  "action": "VERIFY", // or "REJECT"
  "verification_reference": "BNK_VER_2026_99"
}
```
- **Business Rule**: Marks new bank account as `VERIFIED` and sets `is_primary = true`, archiving the previous verified account.

---

### API: ADMIN-90 List & Process Settlements
- **Endpoint**: `/api/v1/admin/settlements/process` | `POST` | Auth: Required (Admin)
- **Request Body**:
```json
{
  "venue_id": "ven_501",
  "period_start": "2026-08-20",
  "period_end": "2026-08-27",
  "settlement_amount": 142500,
  "platform_fee_deducted": 7500,
  "net_payout": 135000,
  "payout_reference": "RZP_PAYOUT_99210"
}
```

---

# 9. SHARED APIs

### API: SHARED-79 Handle Razorpay Webhook
- **Purpose**: Asynchronously receives payment events from Razorpay (`payment.captured`, `payment.failed`, `refund.processed`).
- **Method**: `POST`
- **Endpoint**: `/api/v1/webhooks/razorpay`
- **Authentication**: Razorpay Webhook Signature Verification (`X-Razorpay-Signature`)
- **Request Body**: Razorpay Standard Webhook Payload.
- **Business Logic Triggered on `payment.captured`**:
  1. Identifies `booking_id` / `attempt_id` from payment notes/metadata.
  2. Creates `Payment Transaction` record.
  3. Rechecks slot availability:
     - **If Slots Available**: Marks Booking as `CONFIRMED`, blocks slots in Calendar (`BLOCKED`), updates Payment to `PARTIALLY_PAID` (if 50% advance) or `PAID` (if 100% full), sends WhatsApp confirmation.
     - **If Slots Taken (Race Condition)**: Does NOT block slot, flags Booking as `EXCEPTION_SLOT_TAKEN`, alerts venue owner to resolve (choose alternative slot, change court, or refund).
- **Success Response**: `200 OK` (`{ "received": true }`)

---

# 10. DATABASE ENTITY INVENTORY

| # | Entity Name | Table Name | Purpose | Primary Key | Source |
|---|---|---|---|---|---|
| 01 | VendorApplication | `vendor_applications` | Initial lead request submitted on website | `application_id` | `IBS WEBSITE.docx` |
| 02 | OtpVerification | `otp_verifications` | Temporary OTP generation and verification tokens | `verification_id` | `IBS WEBSITE.docx`, `IBS ONBOARDING.docx` |
| 03 | OnboardingApplication | `onboarding_applications` | 11-step vendor onboarding progressive state | `onboarding_id` | `IBS ONBOARDING.docx` |
| 04 | Owner | `owners` | KYC and profile details of the venue owner | `owner_id` | `IBS ONBOARDING.docx` |
| 05 | Business | `businesses` | Legal business entity, GST, and business type | `business_id` | `IBS ONBOARDING.docx` |
| 06 | Venue | `venues` | Physical venue facility, location, GPS, and rules | `venue_id` | `IBS ONBOARDING.docx`, `settings.docx` |
| 07 | Court | `courts` | Physical court or ground record | `court_id` | `settings.docx`, `IBS ONBOARDING.docx` |
| 08 | CourtSport | `court_sports` | Mapping sports to physical courts | `court_sport_id` | `settings.docx` |
| 09 | PricingRule | `pricing_rules` | Regular, Peak, and Weekend hourly pricing rules | `pricing_rule_id` | `settings.docx`, `slot & Availability.docx` |
| 10 | Amenity | `amenities` | Venue and court amenities | `amenity_id` | `IBS ONBOARDING.docx`, `settings.docx` |
| 11 | OperatingHour | `operating_hours` | 7-day venue operating schedules | `operating_hour_id` | `IBS ONBOARDING.docx`, `settings.docx` |
| 12 | Closure | `closures` | Special closures, holidays, and maintenance breaks | `closure_id` | `settings.docx` |
| 13 | BankAccount | `bank_accounts` | Settlement bank account details and verification | `bank_account_id` | `IBS ONBOARDING.docx`, `settings.docx` |
| 14 | Document | `documents` | Uploaded KYC, legal, and passbook documents | `document_id` | `IBS ONBOARDING.docx` |
| 15 | User | `users` | System authentication and credentials record | `user_id` | `settings.docx` |
| 16 | Staff | `staff` | Venue staff members and granular permissions | `staff_id` | `settings.docx` |
| 17 | Slot | `slots` | Hourly court availability and calendar slots | `slot_id` | `slot & Availability.docx` |
| 18 | SlotBlock | `slot_blocks` | Non-customer blocks (Maintenance/Private/Owner) | `block_id` | `slot & Availability.docx` |
| 19 | SlotConfiguration | `slot_configurations` | Venue slot generation parameters | `config_id` | `slot & Availability.docx` |
| 20 | Booking | `bookings` | Master booking engine records | `booking_id` | `Booking.docx`, `payment.docx` |
| 21 | BookingCharge | `booking_charges` | Line item charges (base, equipment, extension) | `charge_id` | `Booking.docx` |
| 22 | PaymentAttempt | `payment_attempts` | 30-minute payment hold attempts with links | `attempt_id` | `Booking.docx`, `coaching.docx` |
| 23 | Payment | `payments` | Overall financial tracking for a booking | `payment_id` | `payment.docx` |
| 24 | PaymentTransaction | `payment_transactions` | Individual financial transactions (Online/Cash) | `transaction_id` | `payment.docx` |
| 25 | CoachingProgram | `coaching_programs` | Coaching/Academy long-term arrangements | `coaching_id` | `coaching.docx` |
| 26 | CoachingReservation | `coaching_reservations` | Recurring session slot reservations for coaching | `reservation_id` | `coaching.docx` |
| 27 | Tournament | `tournaments` | Multi-day or single-day tournament events | `tournament_id` | `Tournament.docx` |
| 28 | TournamentAllocation | `tournament_allocations` | Court and day-wise allocation slots for tournaments | `allocation_id` | `Tournament.docx` |
| 29 | MembershipPlan | `membership_plans` | Membership packages and entitlement rules | `plan_id` | `membership.docx` |
| 30 | MemberSubscription | `member_subscriptions` | Customer membership purchases and entitlements | `subscription_id` | `membership.docx` |
| 31 | SupportTicket | `support_tickets` | Help and support ticket records | `ticket_id` | `Help &support.docx` |
| 32 | TicketMessage | `ticket_messages` | Chat and response messages inside support tickets | `message_id` | `Help &support.docx` |
| 33 | TicketAttachment | `ticket_attachments` | Screenshots and file attachments for support | `attachment_id` | `Help &support.docx` |
| 34 | Settlement | `settlements` | Platform-to-vendor financial payouts | `settlement_id` | `settings.docx` |
| 35 | NotificationSetting | `notification_settings` | Vendor notification preference toggles | `setting_id` | `settings.docx` |

---

# 11. COMPLETE ENTITY DOCUMENTATION

### ENTITY: `vendor_applications`
| Attribute | Data Type | Nullable | Default | Key | Description |
|---|---|---|---|---|---|
| `application_id` | VARCHAR(64) | NO | - | PK | Primary Key (e.g. `APP10231`) |
| `business_name` | VARCHAR(255) | NO | - | - | Business Name from request |
| `venue_name` | VARCHAR(255) | NO | - | - | Venue / Application Name |
| `email` | VARCHAR(255) | NO | - | - | Contact email |
| `mobile_number` | VARCHAR(15) | NO | - | - | Verified 10-digit mobile |
| `address` | TEXT | NO | - | - | Venue physical address |
| `latitude` | DECIMAL(10,8) | YES | NULL | - | Google Maps Latitude |
| `longitude` | DECIMAL(11,8) | YES | NULL | - | Google Maps Longitude |
| `sports_provided` | JSONB | NO | '[]' | - | Array of sport enum strings |
| `number_of_courts` | INT | NO | 1 | - | Requested court count |
| `status` | VARCHAR(32) | NO | 'PENDING' | - | `PENDING`, `APPROVED`, `REJECTED` |
| `reviewed_by` | VARCHAR(64) | YES | NULL | FK | Admin User ID |
| `admin_remarks` | TEXT | YES | NULL | - | Admin review notes |
| `created_at` | TIMESTAMP WITH TIME ZONE | NO | NOW() | - | Created timestamp |
| `updated_at` | TIMESTAMP WITH TIME ZONE | NO | NOW() | - | Updated timestamp |

---

### ENTITY: `venues`
| Attribute | Data Type | Nullable | Default | Key | Description |
|---|---|---|---|---|---|
| `venue_id` | VARCHAR(64) | NO | - | PK | Primary Key (e.g. `VEN501`) |
| `owner_id` | VARCHAR(64) | NO | - | FK | References `owners.owner_id` |
| `business_id` | VARCHAR(64) | NO | - | FK | References `businesses.business_id` |
| `venue_name` | VARCHAR(255) | NO | - | - | Display Name of the venue |
| `brand_name` | VARCHAR(255) | YES | NULL | - | Brand / Chain Name |
| `description` | TEXT | YES | NULL | - | Description of the venue |
| `address` | TEXT | NO | - | - | Street address |
| `area` | VARCHAR(255) | NO | - | - | Locality / Area |
| `city` | VARCHAR(100) | NO | 'Coimbatore' | - | City |
| `district` | VARCHAR(100) | NO | 'Coimbatore' | - | District |
| `state` | VARCHAR(100) | NO | 'Tamil Nadu' | - | State |
| `pincode` | VARCHAR(10) | NO | - | - | Postal Pincode |
| `latitude` | DECIMAL(10,8) | NO | - | - | Venue Latitude |
| `longitude` | DECIMAL(11,8) | NO | - | - | Venue Longitude |
| `google_maps_url` | TEXT | YES | NULL | - | Google Maps URL |
| `contact_number` | VARCHAR(15) | NO | - | - | Primary venue phone |
| `venue_email` | VARCHAR(255) | YES | NULL | - | Venue email |
| `number_of_courts` | INT | NO | 4 | - | Total court count |
| `status` | VARCHAR(32) | NO | 'ACTIVE' | - | `PENDING`, `ACTIVE`, `SUSPENDED` |
| `created_at` | TIMESTAMP WITH TIME ZONE | NO | NOW() | - | Created timestamp |
| `updated_at` | TIMESTAMP WITH TIME ZONE | NO | NOW() | - | Updated timestamp |

---

### ENTITY: `courts`
| Attribute | Data Type | Nullable | Default | Key | Description |
|---|---|---|---|---|---|
| `court_id` | VARCHAR(64) | NO | - | PK | Primary Key (e.g. `CRT101`) |
| `venue_id` | VARCHAR(64) | NO | - | FK | References `venues.venue_id` |
| `court_name` | VARCHAR(255) | NO | - | - | Physical court name (e.g. `Turf 1`) |
| `court_number` | INT | NO | 1 | - | Sequential number |
| `display_name` | VARCHAR(255) | NO | - | - | Display title in UI |
| `minimum_booking_duration` | INT | NO | 60 | - | Minimum duration in minutes |
| `multi_sport_enabled` | BOOLEAN | NO | FALSE | - | Whether shared for multiple sports |
| `approval_status` | VARCHAR(32) | NO | 'PENDING_APPROVAL' | - | `PENDING_APPROVAL`, `APPROVED`, `REJECTED` |
| `operating_status` | VARCHAR(32) | NO | 'ACTIVE' | - | `ACTIVE`, `INACTIVE`, `MAINTENANCE` |
| `created_at` | TIMESTAMP WITH TIME ZONE | NO | NOW() | - | Created timestamp |
| `updated_at` | TIMESTAMP WITH TIME ZONE | NO | NOW() | - | Updated timestamp |

---

### ENTITY: `slots`
| Attribute | Data Type | Nullable | Default | Key | Description |
|---|---|---|---|---|---|
| `slot_id` | VARCHAR(64) | NO | - | PK | Primary Key (e.g. `SLT_20260828_0700_CRT1`) |
| `venue_id` | VARCHAR(64) | NO | - | FK | References `venues.venue_id` |
| `court_id` | VARCHAR(64) | NO | - | FK | References `courts.court_id` |
| `sport_id` | VARCHAR(64) | YES | NULL | - | Associated sport |
| `slot_date` | DATE | NO | - | - | Date of the slot |
| `start_time` | TIME | NO | - | - | Slot Start Time (e.g. `07:00`) |
| `end_time` | TIME | NO | - | - | Slot End Time (e.g. `08:00`) |
| `duration_minutes` | INT | NO | 60 | - | Duration |
| `base_price` | DECIMAL(10,2) | NO | 0.00 | - | Calculated Base Price |
| `final_price` | DECIMAL(10,2) | NO | 0.00 | - | Final Price including Peak/Weekend |
| `slot_status` | VARCHAR(32) | NO | 'AVAILABLE' | - | `AVAILABLE`, `HELD`, `BOOKED`, `BLOCKED`, `RESERVED` |
| `booking_id` | VARCHAR(64) | YES | NULL | FK | References `bookings.booking_id` |
| `booking_type` | VARCHAR(32) | YES | NULL | - | `NORMAL`, `COACHING`, `TOURNAMENT`, `MEMBERSHIP`, `MAINTENANCE`, `PRIVATE_EVENT` |
| `hold_started_at` | TIMESTAMP WITH TIME ZONE | YES | NULL | - | Timestamp when 30-min hold began |
| `hold_expires_at` | TIMESTAMP WITH TIME ZONE | YES | NULL | - | Timestamp when 30-min hold expires |
| `block_id` | VARCHAR(64) | YES | NULL | FK | References `slot_blocks.block_id` |
| `created_at` | TIMESTAMP WITH TIME ZONE | NO | NOW() | - | Created timestamp |
| `updated_at` | TIMESTAMP WITH TIME ZONE | NO | NOW() | - | Updated timestamp |

---

### ENTITY: `bookings`
| Attribute | Data Type | Nullable | Default | Key | Description |
|---|---|---|---|---|---|
| `booking_id` | VARCHAR(64) | NO | - | PK | Primary Key (e.g. `BK10231`) |
| `venue_id` | VARCHAR(64) | NO | - | FK | References `venues.venue_id` |
| `court_id` | VARCHAR(64) | NO | - | FK | References `courts.court_id` |
| `sport_id` | VARCHAR(64) | NO | - | - | Sport identifier |
| `customer_name` | VARCHAR(255) | NO | - | - | Customer full name |
| `customer_phone` | VARCHAR(15) | NO | - | - | Customer WhatsApp mobile |
| `booking_type` | VARCHAR(32) | NO | 'NORMAL' | - | `NORMAL`, `COACHING`, `TOURNAMENT`, `MEMBERSHIP`, `PARTY_BOOKING`, `LONG_TERM` |
| `booking_source` | VARCHAR(32) | NO | 'OWNER' | - | `OWNER`, `STAFF`, `CUSTOMER_APP` |
| `booking_date` | DATE | NO | - | - | Date of booking |
| `start_time` | TIME | NO | - | - | Start time |
| `end_time` | TIME | NO | - | - | End time |
| `duration_minutes` | INT | NO | 60 | - | Duration |
| `total_amount` | DECIMAL(10,2) | NO | 0.00 | - | Total price payable |
| `payment_mode` | VARCHAR(32) | NO | 'FULL' | - | `FULL`, `ADVANCE_50`, `MEMBERSHIP_ENTITLEMENT` |
| `required_payment` | DECIMAL(10,2) | NO | 0.00 | - | Required amount to confirm |
| `paid_amount` | DECIMAL(10,2) | NO | 0.00 | - | Amount collected so far |
| `balance_amount` | DECIMAL(10,2) | NO | 0.00 | - | Remaining balance |
| `booking_status` | VARCHAR(32) | NO | 'PAYMENT_PENDING' | - | `PAYMENT_PENDING`, `CONFIRMED`, `CHECKED_IN`, `ONGOING`, `COMPLETED`, `CANCELLED`, `EXPIRED` |
| `payment_status` | VARCHAR(32) | NO | 'UNPAID' | - | `UNPAID`, `PARTIALLY_PAID`, `PAID`, `FAILED`, `EXPIRED`, `REFUNDED` |
| `created_by` | VARCHAR(64) | NO | - | FK | User ID who created booking |
| `created_at` | TIMESTAMP WITH TIME ZONE | NO | NOW() | - | Created timestamp |
| `updated_at` | TIMESTAMP WITH TIME ZONE | NO | NOW() | - | Updated timestamp |

---

### ENTITY: `payment_attempts`
| Attribute | Data Type | Nullable | Default | Key | Description |
|---|---|---|---|---|---|
| `attempt_id` | VARCHAR(64) | NO | - | PK | Primary Key |
| `booking_id` | VARCHAR(64) | YES | NULL | FK | References `bookings.booking_id` |
| `coaching_id` | VARCHAR(64) | YES | NULL | FK | References `coaching_programs.coaching_id` |
| `tournament_id` | VARCHAR(64) | YES | NULL | FK | References `tournaments.tournament_id` |
| `attempt_number` | INT | NO | 1 | - | 1, 2, 3... (for audit history) |
| `payment_request_type` | VARCHAR(32) | NO | 'INITIAL' | - | `INITIAL`, `BALANCE`, `EXTENSION` |
| `amount_required` | DECIMAL(10,2) | NO | - | - | Amount required in this link |
| `payment_gateway` | VARCHAR(32) | NO | 'RAZORPAY' | - | Gateway name |
| `razorpay_order_id` | VARCHAR(100) | YES | NULL | - | Razorpay Order / Link ID |
| `payment_link_url` | TEXT | YES | NULL | - | Public payment link URL |
| `payment_status` | VARCHAR(32) | NO | 'SENT' | - | `CREATED`, `SENT`, `PROCESSING`, `PAID`, `EXPIRED`, `CANCELLED` |
| `sent_at` | TIMESTAMP WITH TIME ZONE | NO | NOW() | - | Link dispatch time |
| `expires_at` | TIMESTAMP WITH TIME ZONE | NO | - | - | 30 minutes expiry timestamp |
| `paid_at` | TIMESTAMP WITH TIME ZONE | YES | NULL | - | Paid timestamp |
| `failure_reason` | TEXT | YES | NULL | - | Failure explanation if expired/failed |

---

### ENTITY: `payment_transactions`
| Attribute | Data Type | Nullable | Default | Key | Description |
|---|---|---|---|---|---|
| `transaction_id` | VARCHAR(64) | NO | - | PK | Primary Key |
| `payment_id` | VARCHAR(64) | NO | - | FK | References `payments.payment_id` |
| `booking_id` | VARCHAR(64) | YES | NULL | FK | References `bookings.booking_id` |
| `attempt_id` | VARCHAR(64) | YES | NULL | FK | References `payment_attempts.attempt_id` |
| `amount` | DECIMAL(10,2) | NO | - | - | Transaction amount |
| `payment_type` | VARCHAR(32) | NO | 'ADVANCE' | - | `ADVANCE`, `BALANCE`, `EXTENSION`, `FULL` |
| `payment_method` | VARCHAR(32) | NO | 'ONLINE' | - | `ONLINE`, `QR`, `CASH` |
| `gateway_name` | VARCHAR(32) | NO | 'RAZORPAY' | - | `RAZORPAY`, `CASH` |
| `gateway_payment_id` | VARCHAR(100) | YES | NULL | - | Razorpay Payment ID |
| `payment_status` | VARCHAR(32) | NO | 'PAID' | - | `PAID`, `REFUNDED`, `FAILED` |
| `paid_at` | TIMESTAMP WITH TIME ZONE | NO | NOW() | - | Payment timestamp |
| `collected_by` | VARCHAR(64) | YES | NULL | FK | User ID who collected/verified |

---

# 12. ENTITY RELATIONSHIPS

```text
VendorApplication (1) ────► OnboardingApplication (1)
                                   │
                                   ├──► Owner (1) ────► User (1)
                                   ├──► Business (1)
                                   └──► Venue (1)
                                          │
                                          ├──► BankAccount (1..N)
                                          ├──► OperatingHour (7)
                                          ├──► Closure (0..N)
                                          ├──► Amenity (0..N)
                                          ├──► Staff (0..N) ────► User (1)
                                          ├──► SlotConfiguration (1)
                                          ├──► NotificationSetting (1..N)
                                          ├──► Court (1..N)
                                          │      │
                                          │      ├──► CourtSport (1..N) ────► PricingRule (1..N)
                                          │      └──► Slot (0..N)
                                          │             │
                                          │             ├──► SlotBlock (0..1)
                                          │             └──► Booking (0..1)
                                          │
                                          ├──► Booking (0..N)
                                          │      │
                                          │      ├──► BookingCharge (1..N)
                                          │      ├──► PaymentAttempt (1..N)
                                          │      └──► Payment (1) ────► PaymentTransaction (1..N)
                                          │
                                          ├──► CoachingProgram (0..N)
                                          │      │
                                          │      ├──► CoachingReservation (1..N) ────► Slot (1)
                                          │      └──► PaymentAttempt (1..N)
                                          │
                                          ├──► Tournament (0..N)
                                          │      │
                                          │      ├──► TournamentAllocation (1..N) ────► Slot (1)
                                          │      └──► PaymentAttempt (1..N)
                                          │
                                          ├──► MembershipPlan (0..N)
                                          │      └──► MemberSubscription (0..N) ────► PaymentAttempt (1..N)
                                          │
                                          ├──► SupportTicket (0..N)
                                          │      ├──► TicketMessage (1..N)
                                          │      └──► TicketAttachment (0..N)
                                          │
                                          └──► Settlement (0..N)
```

---

# 13. END-TO-END WORKFLOWS

## Workflow 1: Website Lead to Super Admin Approval
1. Prospective owner visits `/request-ibooksports`.
2. Enters mobile -> `POST /api/v1/website/request/send-otp` -> Customer receives OTP.
3. Enters OTP -> `POST /api/v1/website/request/verify-otp` -> Receives `verification_token`.
4. Submits form -> `POST /api/v1/website/request-ibooksports` -> Record created in `vendor_applications` (`status = PENDING`).
5. Super Admin checks `GET /api/v1/admin/applications`.
6. Super Admin calls `POST /api/v1/admin/applications/:id/review` with `APPROVE`.
7. Status becomes `APPROVED`. Backend creates `onboarding_applications` record and dispatches onboarding SMS/WhatsApp link.

## Workflow 2: Progressive 11-Step Onboarding & Activation
1. Vendor opens link -> `POST /api/v1/onboarding/verify-otp` -> receives JWT onboarding session.
2. Wizard steps 2 through 10 executed via `PUT` endpoints saving draft states.
3. Documents uploaded via `POST /api/v1/onboarding/documents/upload`.
4. Step 11: Vendor submits `POST /api/v1/onboarding/submit` -> Status becomes `UNDER_REVIEW`.
5. Super Admin vets KYC, bank passbook, and venue details (`POST /api/v1/admin/onboarding/:id/review`).
6. Super Admin approves -> Venue status becomes `ACTIVE`, Owner account created, Vendor mobile app unlocked.

## Workflow 3: Normal Booking with 50% Advance & Balance Collection
1. Customer calls venue -> Owner opens Create Booking in Mobile App.
2. Checks availability (`POST /api/v1/vendor/slots/check-availability`) -> Available.
3. Selects `ADVANCE_50` -> `POST /api/v1/vendor/bookings`.
4. Total ₹5,000, Required ₹2,500, Balance ₹2,500.
5. Booking created (`PAYMENT_PENDING`), Slot marked `HELD` (30 mins), Razorpay link generated (`Attempt #1`) and sent via WhatsApp.
6. Customer pays ₹2,500 -> Razorpay triggers webhook (`POST /api/v1/webhooks/razorpay`).
7. Webhook verifies signature -> rechecks slot availability:
   - Slot available: Booking status -> `CONFIRMED`, Slot status -> `BLOCKED`, Payment status -> `PARTIALLY_PAID`. WhatsApp booking confirmation sent.
8. Booking day: Customer plays -> Balance ₹2,500 is due.
9. Owner selects **Record Cash** -> `POST /api/v1/vendor/payments/record-cash`.
10. Balance becomes ₹0, Payment status -> `PAID`.
11. Owner clicks **Complete Booking** -> `POST /api/v1/vendor/bookings/:id/complete` -> Booking status -> `COMPLETED`.

## Workflow 4: Expired Payment Hold & "Send Again"
1. Booking created at 10:00 AM (`hold_expires_at = 10:30 AM`).
2. Customer does not pay by 10:30 AM.
3. System marks `Payment Attempt #1` as `EXPIRED`, Booking as `EXPIRED`, and releases slot (`AVAILABLE`).
4. At 10:45 AM, customer calls back asking for the link.
5. Owner opens Expired Bookings -> clicks **Send Again** (`POST /api/v1/vendor/bookings/:id/send-again`).
6. System rechecks slot availability:
   - If available: Creates `Payment Attempt #2`, starts fresh 30-min hold, sends new WhatsApp link.
   - If booked by someone else: Returns conflict error with available alternative slots.

---

# 14. API DEPENDENCY FLOW

```text
1. Website Lead (OTP -> Verify -> Submit)
   ↓
2. Super Admin Lead Approval
   ↓
3. Onboarding Steps (Owner -> Business -> Venue -> Amenities -> Rules -> Courts -> Hours -> Bank -> Docs -> Submit)
   ↓
4. Super Admin Onboarding Approval & Activation
   ↓
5. Vendor Authentication (Send OTP -> Verify -> JWT Issued)
   ↓
6. Settings Initialization (Physical Courts Approval -> Operating Hours -> Pricing Rules)
   ↓
7. Slot Generation Engine (Generates Daily Calendar Slots based on Operating Hours & Court Rules)
   ↓
8. Operational Workflows:
   ├─► Check Availability -> Create Booking -> 30-Min Hold -> Payment Link Dispatch
   ├─► Razorpay Webhook -> Confirm Booking & Block Slots
   ├─► Check-in -> Balance Collection (Link / QR / Cash) -> Complete Booking
   ├─► Coaching Program -> Conflict Check -> 50%/Full Advance -> Reserve Future Slots
   ├─► Tournament -> Multi-Court Allocation -> Advance -> Reserve Event Slots
   └─► Support Ticket -> Contextual ID Link -> Chat Thread -> Resolution
```

---

# 15. API TESTING DOCUMENTATION

### Test Case 01: Create Booking & WhatsApp Payment Link
- **Step**: 01
- **API**: Create Normal Booking
- **Method**: `POST`
- **Endpoint**: `/api/v1/vendor/bookings`
- **Headers**:
```text
Authorization: Bearer <vendor_jwt_token>
Content-Type: application/json
```
- **Request**:
```json
{
  "customer_name": "Rahul Kumar",
  "customer_phone": "9876543210",
  "sport_id": "spt_football",
  "court_id": "crt_1",
  "booking_date": "2026-08-28",
  "start_time": "19:00",
  "end_time": "20:00",
  "payment_option": "ADVANCE_50"
}
```
- **Expected Status**: `201 Created`
- **Expected Response**:
```json
{
  "booking_id": "BK10231",
  "total_amount": 5000,
  "required_amount": 2500,
  "balance_amount": 2500,
  "booking_status": "PAYMENT_PENDING",
  "payment_status": "UNPAID",
  "hold_expires_at": "2026-08-28T19:30:00Z"
}
```
- **Database Check**:
  - `bookings`: record created with `booking_status = PAYMENT_PENDING`, `payment_status = UNPAID`.
  - `slots`: status updated from `AVAILABLE` to `HELD` with `hold_expires_at` set 30 minutes in future.
  - `payment_attempts`: record created with `attempt_number = 1`, `payment_status = SENT`.

---

### Test Case 02: Razorpay Webhook Payment Confirmation
- **Step**: 02
- **API**: Razorpay Webhook
- **Method**: `POST`
- **Endpoint**: `/api/v1/webhooks/razorpay`
- **Headers**:
```text
X-Razorpay-Signature: <computed_hmac_sha256>
Content-Type: application/json
```
- **Request**:
```json
{
  "event": "payment.captured",
  "payload": {
    "payment": {
      "entity": {
        "id": "pay_O12345678",
        "amount": 250000,
        "currency": "INR",
        "status": "captured",
        "notes": {
          "booking_id": "BK10231",
          "attempt_id": "att_101"
        }
      }
    }
  }
}
```
- **Expected Status**: `200 OK`
- **Database Check**:
  - `bookings`: `booking_status` becomes `CONFIRMED`, `paid_amount` becomes `2500.00`, `balance_amount` becomes `2500.00`, `payment_status` becomes `PARTIALLY_PAID`.
  - `slots`: `slot_status` becomes `BLOCKED`.
  - `payment_transactions`: record created with `amount = 2500.00`, `payment_type = ADVANCE`, `gateway_name = RAZORPAY`.

---

# 16. END-TO-END TESTING SEQUENCE

```text
TEST 01: Website Lead Request (Mobile OTP Verification + Form Submit)
   ↓
TEST 02: Super Admin Applications List (Verify Lead Presence)
   ↓
TEST 03: Super Admin Application Approval (Dispatches Onboarding Token)
   ↓
TEST 04: Progressive Onboarding Wizard (Steps 1 to 10 Draft Saves + Document Uploads)
   ↓
TEST 05: Onboarding Final Submission (Status -> UNDER_REVIEW)
   ↓
TEST 06: Super Admin Onboarding Review (KYC / Bank Verification -> APPROVE)
   ↓
TEST 07: Vendor Owner Login (OTP Login -> JWT Token Issuance)
   ↓
TEST 08: Settings Verification (Physical Courts -> Super Admin Court Approval)
   ↓
TEST 09: Unified Calendar Slot Generation (Verify Slots Generated for Approved Courts)
   ↓
TEST 10: Booking Creation with 50% Advance (Verify 30-Min Hold & Razorpay Link Generation)
   ↓
TEST 11: Webhook Simulation (Simulate Razorpay Payment Captured -> Verify CONFIRMED & BLOCKED)
   ↓
TEST 12: Balance Collection (Record Cash -> Balance Becomes ₹0 -> Complete Booking)
   ↓
TEST 13: Coaching Program Creation (Verify Recurring Slots Reservation & Renewal Flow)
   ↓
TEST 14: Tournament Creation (Verify Multi-Court Allocation & Partial Cancellation)
   ↓
TEST 15: Support Ticket Lifecycle (Vendor Ticket Submit -> Context Auto-Fill -> Admin Reply -> Resolve)
```

---

# 17. NEGATIVE TEST CASES

1. **Website OTP Failure**: Submitting lead form with unverified mobile or invalid OTP token -> `400 Bad Request`.
2. **Duplicate Application**: Submitting lead request for an already registered/pending mobile number -> `409 Conflict`.
3. **Invalid Court Onboarding Constraint**: Submitting fewer than 4 or more than 10 courts during initial onboarding -> `400 Bad Request`.
4. **Onboarding Bank Account Mismatch**: Submitting bank details where `account_number != confirm_account_number` -> `400 Bad Request`.
5. **Slot Booking Conflict**: Creating a booking or block on an already `CONFIRMED` or `BLOCKED` slot -> `409 Conflict`.
6. **Payment Link Expiry**: Attempting to pay after the 30-minute hold has elapsed -> Gateway rejects / webhook marks `EXPIRED` and slot released.
7. **Premature Booking Completion**: Calling `/complete` on a booking where `balance_amount > 0` -> `400 Bad Request` ("Cannot complete booking with pending balance").
8. **Unapproved Court Booking**: Attempting to book or schedule on a court in `PENDING_APPROVAL` or `REJECTED` status -> `403 Forbidden`.
9. **Multi-Sport Overlap Conflict**: Booking Football on `Turf 1` at 7 PM and simultaneously attempting to book Box Cricket on the same physical `Turf 1` at 7 PM -> `409 Conflict` ("Physical court already occupied").
10. **Unauthorized Staff Action**: Staff member with `RECEPTION` role attempting to access settlement bank details or settings -> `403 Forbidden`.

---

# 18. ROLE / ACCESS MATRIX

| API / Feature Area | Website Client | Onboarding Client | Vendor Owner | Vendor Staff (Manager) | Vendor Staff (Reception) | Super Admin |
|---|---|---|---|---|---|---|
| Website Request & OTP (`WEB-01..03`) | ✓ | — | — | — | — | — |
| Onboarding Wizard (`ONB-04..16`) | — | ✓ | — | — | — | — |
| Vendor Auth (`AUTH-17..21`) | — | — | ✓ | ✓ | ✓ | — |
| Dashboard Overview (`VEND-22`) | — | — | ✓ | ✓ | — | — |
| Unified Calendar & Availability (`VEND-23..25`) | — | — | ✓ | ✓ | ✓ | — |
| Booking Management (`VEND-29..36`) | — | — | ✓ | ✓ | ✓ | — |
| Balance Collection (Link/QR/Cash) (`VEND-54..56`) | — | — | ✓ | ✓ | ✓ | — |
| Coaching Management (`VEND-37..42`) | — | — | ✓ | ✓ | — | — |
| Tournament Management (`VEND-43..49`) | — | — | ✓ | ✓ | — | — |
| Membership Management (`VEND-50..53`) | — | — | ✓ | ✓ | — | — |
| Court & Pricing Settings (`VEND-58..60`) | — | — | ✓ | — | — | — |
| Bank Account Settings (`VEND-66..67`) | — | — | ✓ | — | — | — |
| Staff Management (`VEND-68..70`) | — | — | ✓ | — | — | — |
| Help & Support Tickets (`VEND-73..78`) | — | — | ✓ | ✓ | — | — |
| Razorpay Webhook (`SHARED-79`) | — | — | — | — | — | Shared (Gateway) |
| Super Admin Review & Approval (`ADMIN-80..90`) | — | — | — | — | — | ✓ |

---

# 19. EXACT API COUNT

```text
Website APIs       = 3
Onboarding APIs    = 13
Vendor APIs        = 57
Super Admin APIs   = 11
Shared APIs        = 6   (AUTH-17..21 + SHARED-79)

------------------------------------------
TOTAL UNIQUE APIs  = 90
------------------------------------------
```

---

# 20. EXACT DATABASE COUNT

```text
------------------------------------------
Total Entities / Tables = 35
------------------------------------------
```
1. `vendor_applications`
2. `otp_verifications`
3. `onboarding_applications`
4. `owners`
5. `businesses`
6. `venues`
7. `courts`
8. `court_sports`
9. `pricing_rules`
10. `amenities`
11. `operating_hours`
12. `closures`
13. `bank_accounts`
14. `documents`
15. `users`
16. `staff`
17. `slots`
18. `slot_blocks`
19. `slot_configurations`
20. `bookings`
21. `booking_charges`
22. `payment_attempts`
23. `payments`
24. `payment_transactions`
25. `coaching_programs`
26. `coaching_reservations`
27. `tournaments`
28. `tournament_allocations`
29. `membership_plans`
30. `member_subscriptions`
31. `support_tickets`
32. `ticket_messages`
33. `ticket_attachments`
34. `settlements`
35. `notification_settings`

---

# 21. NESTJS IMPLEMENTATION ORDER

Based on strict module dependencies:
1. **Core Database Entities & Migrations**: Define the 35 TypeORM entities and database relationships in PostgreSQL.
2. **Authentication & Authorization (`auth`, `users`)**: JWT strategy, Passport, roles (`SUPER_ADMIN`, `OWNER`, `MANAGER`, `RECEPTION`), guards.
3. **Website Lead Module (`website`)**: OTP service, lead ingestion, validation.
4. **Onboarding Module (`onboarding`, `documents`, `upload`)**: Wizard draft persistence, Multer file upload storage.
5. **Super Admin Review Module (`admin`)**: Applications, onboarding review, bank verification, court approvals.
6. **Venue & Court Setup (`venue`, `courts`, `pricing`)**: Physical court management, multi-sport mapping, pricing rules engine.
7. **Slot & Unified Availability Engine (`slots`)**: Calendar slot generation, conflict checker, maintenance/private blocks.
8. **Razorpay Integration & Payments (`payments`, `webhooks`)**: Link generation, UPI QR generation, cash collection, webhook listener.
9. **Booking Engine (`bookings`)**: Normal bookings, booking attempts, 30-min hold timer, extension, check-in, completion.
10. **Specialized Booking Modules (`coaching`, `tournaments`, `memberships`)**: Recurring reservations, allocations, subscriptions.
11. **Staff & Venue Settings (`staff`, `settings`)**: Invitations, permissions, notification preferences.
12. **Help & Support Module (`help`, `tickets`)**: FAQs, ticket lifecycle, chat thread, attachments.
13. **Dashboard & Analytics (`dashboard`)**: Operations KPI aggregation, schedule views, action-required engine.

---

# 22. SWAGGER / OPENAPI REQUIREMENTS

1. **Global Prefix**: All backend APIs exposed under `/api/v1/`.
2. **Tags Grouping**: Group endpoints by functional modules (`Website`, `Onboarding`, `Auth`, `Vendor - Dashboard`, `Vendor - Bookings`, `Vendor - Slots`, `Vendor - Coaching`, `Vendor - Tournaments`, `Vendor - Memberships`, `Vendor - Payments`, `Vendor - Settings`, `Vendor - Support`, `Super Admin`, `Webhooks`).
3. **Security Schemes**: Bearer JWT (`@ApiBearerAuth()`) for protected vendor/admin routes.
4. **Schemas**: Strict DTO validation schemas using `class-validator` and `class-transformer` decorating every request attribute with `@ApiProperty()` describing data types, example values, and constraints.
5. **HTTP Status Annotations**: `@ApiResponse({ status: 200/201 })`, `@ApiResponse({ status: 400, description: 'Bad Request' })`, `@ApiResponse({ status: 409, description: 'Conflict' })`.

---

# 23. ITEMS NOT DEFINED IN SOURCE / NEED CONFIRMATION

1. **SMS Gateway Provider**: The source mandates mobile OTP verification for Website and Onboarding, but does not specify the third-party SMS vendor (e.g. Twilio, MSG91, Fast2SMS) — `NOT DEFINED IN SOURCE — NEEDS CONFIRMATION`.
2. **File Storage Provider**: The source requires uploading PDF/JPG documents and photos (PAN, Aadhaar, GST, Passbook, Venue Photos), but does not specify the object storage backend (e.g. AWS S3, Supabase Storage, Cloudflare R2, or Local Disk) — `NOT DEFINED IN SOURCE — NEEDS CONFIRMATION`.
3. **Automated WhatsApp BSP / API Provider**: The source defines sending payment links, reminders, and confirmations via WhatsApp, but does not name the WhatsApp Business API provider (e.g. Gupshup, Interakt, Wati, Meta Direct Cloud API) — `NOT DEFINED IN SOURCE — NEEDS CONFIRMATION`.
4. **Settlement Payout Automation**: The source specifies manual/admin-reviewed settlement tracking and bank verification, but whether Razorpay Route / Payouts API or manual bank NEFT/RTGS batch transfers will be used is — `NOT DEFINED IN SOURCE — NEEDS CONFIRMATION`.
5. **Customer Cancellation Refund Percentage**: The source indicates that the cancellation policy is configurable per venue/platform and that non-normal bookings are excluded from initial automated refunds, but exact tiered cutoff hours and deduction percentage formulas are — `NOT DEFINED IN SOURCE — NEEDS CONFIRMATION`.
