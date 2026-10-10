# iBookSports — Vendor Mobile App Full API Specification

**Developer:** Hemanth (Vendor Mobile App Lead — Flutter / React Native / Android)  
**Target Application:** iBookSports Partner Mobile App (On-Ground Groundskeeper & Counter Staff)  
**Base API URL (Render Production):** `https://ibooksports-backend.onrender.com/api/v1`  
**Base API URL (Local Dev):** `http://localhost:4000/api/v1`  
**Protocol:** REST JSON with Bearer JWT Authorization  

---

## 1. Mobile App Overview & Mission

The **Vendor Mobile App** is tailored for fast on-ground daily counter operations:
- **Mobile OTP Login**: Fast 2-step SMS OTP authentication (no passwords needed).
- **Today's Live Match Dashboard**: Today's matches, live collected revenue, occupancy %.
- **Rapid Player Check-In**: 1-click QR code scanner or OTP verify for arriving teams.
- **Instant Rain / Maintenance Court Toggle**: Turn court offline immediately when flooded.
- **Counter Walk-In Booking Block**: Quickly lock slots for walk-in cash players.

---

## 2. Standard Headers & Error Format

All protected endpoints require:
```http
Authorization: Bearer <TOKEN>
Content-Type: application/json
```

### Standard Error Response Structure (Across All APIs)
Whenever an error occurs, the backend returns this standardized JSON structure:
```json
{
  "success": false,
  "statusCode": 400,
  "error": "BAD_REQUEST",
  "message": "Human readable error explanation here",
  "timestamp": "2026-09-14T13:20:15.120Z"
}
```

---

## 3. Mobile Authentication (SMS OTP Flow)

### Step 1: Send 6-Digit SMS OTP
Sends an OTP via SMS to the partner's 10-digit mobile number.
- **Method:** `POST`
- **Endpoint:** `/onboarding/send-otp`
- **Request Body:**
```json
{
  "mobile_number": "6369591821"
}
```

#### ✅ Positive Response (`200 OK`):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "OTP sent successfully to +91 6369591821",
  "verification_id": "ver_9876543210_1789201"
}
```

#### ❌ Negative Response 1 (`400 Bad Request` — Invalid Phone):
```json
{
  "success": false,
  "statusCode": 400,
  "error": "INVALID_PHONE_NUMBER",
  "message": "Mobile number must be a valid 10-digit Indian phone number starting with 6, 7, 8, or 9."
}
```

#### ❌ Negative Response 2 (`429 Too Many Requests` — Rate Limit):
```json
{
  "success": false,
  "statusCode": 429,
  "error": "TOO_MANY_REQUESTS",
  "message": "OTP request limit exceeded. Please wait 60 seconds before requesting a new OTP."
}
```

---

### Step 2: Verify OTP & Issue Bearer Session Token
Validates the 6-digit code. In development, OTP is always `123456`.
- **Method:** `POST`
- **Endpoint:** `/onboarding/verify-otp`
- **Request Body:**
```json
{
  "mobile_number": "6369591821",
  "otp": "123456"
}
```

#### ✅ Positive Response (`200 OK`):
```json
{
  "success": true,
  "statusCode": 200,
  "token": "onb_tok_6369591821_live",
  "application_id": "APP10235",
  "status": "APPROVED",
  "is_registered": true,
  "venue_name": "Fast and Furious academy",
  "owner_name": "YUTEKA S J",
  "expires_in": 2592000
}
```
> **Action**: Store `token` in secure mobile storage (`FlutterSecureStorage` or `EncryptedSharedPreferences`).

#### ❌ Negative Response 1 (`400 Bad Request` — Invalid/Expired OTP):
```json
{
  "success": false,
  "statusCode": 400,
  "error": "INVALID_OTP",
  "message": "The OTP entered is incorrect or has expired. Please try again."
}
```

#### ❌ Negative Response 2 (`404 Not Found` — Mobile Not Found):
```json
{
  "success": false,
  "statusCode": 404,
  "error": "USER_NOT_FOUND",
  "message": "No active partner account registered with +91 6369591821."
}
```

---

## 4. Today's Ground Operations Dashboard

Fetches today's live KPI counters and active courts for the front desk.
- **Method:** `GET`
- **Endpoint:** `/venues/APP10235`
- **Headers:** `Authorization: Bearer <TOKEN>`

#### ✅ Positive Response (`200 OK`):
```json
{
  "success": true,
  "statusCode": 200,
  "id": "APP10235",
  "venue_name": "Fast and Furious academy",
  "status": "ACTIVE",
  "today_bookings_count": 18,
  "today_booking_revenue": 23400,
  "today_slot_occupancy_percent": 89,
  "opening_time": "06:00 AM",
  "closing_time": "10:00 PM",
  "courts": 2,
  "court_list": [
    {
      "id": "crt_APP10235_1",
      "name": "Turf 1",
      "display_name": "Main Arena Pitch",
      "sport": "FOOTBALL",
      "regular_price": 1200,
      "peak_price": 1600,
      "status": "ACTIVE"
    },
    {
      "id": "crt_APP10235_2",
      "name": "Turf 2",
      "display_name": "Premium Court 2",
      "sport": "FOOTBALL",
      "regular_price": 1000,
      "peak_price": 1500,
      "status": "ACTIVE"
    }
  ]
}
```

#### ❌ Negative Response 1 (`401 Unauthorized` — Token Expired):
```json
{
  "success": false,
  "statusCode": 401,
  "error": "UNAUTHORIZED",
  "message": "Session expired or invalid token. Please log in again with OTP."
}
```

#### ❌ Negative Response 2 (`404 Not Found` — Unknown Venue ID):
```json
{
  "success": false,
  "statusCode": 404,
  "error": "VENUE_NOT_FOUND",
  "message": "Venue with ID APP10235 was not found or is not approved."
}
```

---

## 5. Player Check-In (QR Scanner & Booking Code Entry)

Used by front-desk staff to verify player tickets upon arrival at the turf gate.
- **Method:** `POST`
- **Endpoint:** `/bookings/verify-checkin`
- **Headers:** `Authorization: Bearer <TOKEN>`
- **Request Body:**
```json
{
  "venue_id": "APP10235",
  "booking_code": "IBS-2609-9001"
}
```

#### ✅ Positive Response (`200 OK` — Check-in Successful):
```json
{
  "success": true,
  "statusCode": 200,
  "status": "CHECKED_IN",
  "booking_code": "IBS-2609-9001",
  "customer_name": "Rahul Verma",
  "customer_phone": "9876543210",
  "court_name": "Turf 1",
  "sport": "FOOTBALL",
  "slot_time": "06:00 PM - 07:00 PM",
  "payment_status": "PAID",
  "balance_due": 0,
  "checked_in_at": "2026-09-14T17:55:20Z"
}
```

#### ❌ Negative Response 1 (`400 Bad Request` — Wrong Match Date):
```json
{
  "success": false,
  "statusCode": 400,
  "error": "WRONG_DATE",
  "message": "Booking IBS-2609-9001 is scheduled for 2026-09-15. Cannot check in today."
}
```

#### ❌ Negative Response 2 (`402 Payment Required` — Pending Balance Due):
```json
{
  "success": false,
  "statusCode": 402,
  "error": "BALANCE_PAYMENT_PENDING",
  "message": "Customer has a balance due of ₹800 before checking in.",
  "advance_paid": 800,
  "balance_due": 800,
  "payment_status": "PARTIAL_PAID"
}
```

#### ❌ Negative Response 3 (`404 Not Found` — Invalid Booking Code):
```json
{
  "success": false,
  "statusCode": 404,
  "error": "BOOKING_NOT_FOUND",
  "message": "No reservation found matching booking reference IBS-2609-9001."
}
```

#### ❌ Negative Response 4 (`409 Conflict` — Already Checked In):
```json
{
  "success": false,
  "statusCode": 409,
  "error": "ALREADY_CHECKED_IN",
  "message": "Player Rahul Verma has already checked in for this slot at 05:55 PM."
}
```

---

## 6. Instant Emergency Court Toggle (Rain / Maintenance)

Used when heavy rain floods an outdoor turf or lighting fails, disabling online customer bookings immediately.
- **Method:** `PATCH`
- **Endpoint:** `/venues/APP10235/status`
- **Headers:** `Authorization: Bearer <TOKEN>`
- **Request Body:**
```json
{
  "court_id": "crt_APP10235_1",
  "status": "MAINTENANCE",
  "reason": "Waterlogged pitch due to sudden monsoon storm."
}
```
*(Permitted status values: `"ACTIVE"`, `"INACTIVE"`, `"MAINTENANCE"`)*.

#### ✅ Positive Response (`200 OK`):
```json
{
  "success": true,
  "statusCode": 200,
  "court_id": "crt_APP10235_1",
  "status": "MAINTENANCE",
  "message": "Court Turf 1 marked as MAINTENANCE. Slot reservations temporarily paused.",
  "updated_at": "2026-09-14T18:10:00Z"
}
```

#### ❌ Negative Response 1 (`400 Bad Request` — Invalid Status Value):
```json
{
  "success": false,
  "statusCode": 400,
  "error": "INVALID_STATUS",
  "message": "Status must be one of: ACTIVE, INACTIVE, MAINTENANCE."
}
```

#### ❌ Negative Response 2 (`404 Not Found` — Court Not Found):
```json
{
  "success": false,
  "statusCode": 404,
  "error": "COURT_NOT_FOUND",
  "message": "Court ID crt_APP10235_1 does not exist in venue APP10235."
}
```

---

## 7. Fast Walk-In Cash Booking & Slot Lock

Locks a slot immediately when a player walks up to the counter or calls desk phone, preventing double-booking with online users.
- **Method:** `POST`
- **Endpoint:** `/bookings`
- **Headers:** `Authorization: Bearer <TOKEN>`
- **Request Body:**
```json
{
  "venue_id": "APP10235",
  "court_id": "crt_APP10235_1",
  "booking_date": "2026-09-14",
  "slot_time": "08:00 PM - 09:00 PM",
  "customer_name": "Gokul S",
  "customer_phone": "9840123456",
  "sport": "FOOTBALL",
  "payment_mode": "CASH_AT_VENUE",
  "total_amount": 1600,
  "cash_collected_at_venue": 1600,
  "payment_status": "PAID"
}
```

#### ✅ Positive Response (`201 Created`):
```json
{
  "success": true,
  "statusCode": 201,
  "booking_code": "IBS-2609-9042",
  "booking_status": "CONFIRMED",
  "payment_status": "PAID",
  "court_name": "Turf 1",
  "slot_time": "08:00 PM - 09:00 PM",
  "amount_paid": 1600,
  "message": "Slot locked successfully. Cash receipt recorded."
}
```

#### ❌ Negative Response 1 (`409 Conflict` — Double Booking Collision):
```json
{
  "success": false,
  "statusCode": 409,
  "error": "SLOT_ALREADY_BOOKED",
  "message": "Slot 08:00 PM - 09:00 PM on Turf 1 is already reserved by another player."
}
```

#### ❌ Negative Response 2 (`409 Conflict` — Slot Held in 15-Minute Online Checkout):
```json
{
  "success": false,
  "statusCode": 409,
  "error": "SLOT_HELD",
  "message": "Slot is currently held in an online payment checkout. Remaining hold time: 08:14. Please wait or pick another slot."
}
```

#### ❌ Negative Response 3 (`400 Bad Request` — Missing Required Fields):
```json
{
  "success": false,
  "statusCode": 400,
  "error": "VALIDATION_FAILED",
  "message": "customer_name and valid 10-digit customer_phone are mandatory for counter reservations."
}
```

---

## 8. Mobile Support / SOS Ticket

Allows staff to notify Super Admin of hardware failures, gateway double-debits, or cash reconciliation errors.
- **Method:** `POST`
- **Endpoint:** `/support`
- **Headers:** `Authorization: Bearer <TOKEN>`
- **Request Body:**
```json
{
  "venue_id": "APP10235",
  "category": "TECHNICAL",
  "priority": "URGENT",
  "subject": "Front-desk tablet unable to sync cash receipts",
  "description": "Network reconnected, but cash booking for slot 8 PM is not showing on Super Admin ledger."
}
```

#### ✅ Positive Response (`201 Created`):
```json
{
  "success": true,
  "statusCode": 201,
  "ticket_number": "SUP-2026-902",
  "status": "OPEN",
  "category": "TECHNICAL",
  "priority": "URGENT",
  "created_at": "2026-09-14T18:25:00Z",
  "message": "Support ticket created. Super Admin notified."
}
```

#### ❌ Negative Response 1 (`400 Bad Request` — Missing Subject or Category):
```json
{
  "success": false,
  "statusCode": 400,
  "error": "VALIDATION_FAILED",
  "message": "category, priority, subject, and description are required fields."
}
```
