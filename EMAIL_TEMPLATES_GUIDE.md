# 📧 iBookSports — Partner Request & Onboarding Email Templates Guide

This document contains the complete technical specification for the **6 core email templates** implemented in the iBookSports backend (`src/modules/email/email.service.ts`).

---

## 📋 Overview of the 6 Implemented Templates

| # | Template Name | System Type | Trigger Event | Backend Method |
| :- | :--- | :--- | :--- | :--- |
| **1** | **Partner Request Submitted** | `SUBMITTED` | Partner submits preliminary form on website | `sendSubmissionEmail()` |
| **2** | **Partner Request Approved** | `APPROVED` | Super Admin approves preliminary partner request | `sendApprovalEmail()` |
| **3** | **Partner Request Rejected** | `REJECTED` | Super Admin rejects preliminary partner request | `sendRejectionEmail()` |
| **4** | **Onboarding Submitted** | `ONBOARDING_SUBMITTED` | Partner submits 6-step KYC & facility form | `sendOnboardingSubmittedEmail()` |
| **5** | **Venue Activated (Go-Live)** | `VENUE_ACTIVATED` | Super Admin approves onboarding & activates courts | `sendVenueActivatedEmail()` |
| **6** | **Onboarding Corrections Needed** | `ONBOARDING_REJECTED` | Super Admin requests document re-upload | `sendOnboardingRejectedEmail()` |

---

## 🟢 PHASE 1: Partner Lead & Request Flow

### 1️⃣ Template 1: Partner Request Submitted (`SUBMITTED`)
* **Trigger:** Partner submits the website lead form (`POST /api/v1/website/request-ibooksports`).
* **Subject:** `We Have Received Your Request — {request_id}`
* **Recipient:** `requester_email`
* **Dynamic Variables:**
  - `request_id`: e.g. `APP37833` / `REQ-10291`
  - `requester_name`: e.g. `Rahul Sharma`
* **Email Purpose:** Confirms receipt of the initial inquiry and states the 24–48 hour review window.
* **Code Reference:** `email.service.ts` -> `generateSubmissionHtml()` (Line 122)

---

### 2️⃣ Template 2: Partner Request Approved (`APPROVED`)
* **Trigger:** Super Admin reviews and approves the partner lead in the Admin Console.
* **Subject:** `Good News — Your Request Has Been Approved — {request_id}`
* **Recipient:** `requester_email`
* **Dynamic Variables:**
  - `request_id`: e.g. `APP37833`
  - `requester_name`: e.g. `Rahul Sharma`
  - `approval_access_link`: e.g. `https://ibooksports.com/onboarding?token=...` *(7-day valid token)*
* **Key Content Included in Email:**
  - Congratulations banner
  - 1-Click Secure Onboarding Magic Link
  - Checklist of required documents (Aadhaar & photo, GST, 4 court photos, operating schedule & pricing, bank account / cancelled cheque for payouts)
* **Code Reference:** `email.service.ts` -> `generateApprovalHtml()` (Line 146)

---

### 3️⃣ Template 3: Partner Request Rejected (`REJECTED`)
* **Trigger:** Super Admin rejects or requests changes on initial lead.
* **Subject:** `Partnership Request Update — {request_id}`
* **Recipient:** `requester_email`
* **Dynamic Variables:**
  - `request_id`: e.g. `APP37833`
  - `requester_name`: e.g. `Rahul Sharma`
  - `correction_link`: Link to re-submit corrected details
  - `correction_items`: Array of rejected points with specific feedback reasons
* **Code Reference:** `email.service.ts` -> `generateRejectionHtml()` (Line 173)

---

## 🔵 PHASE 2: Full Onboarding & Facility Go-Live Flow

### 4️⃣ Template 4: Full Onboarding Submitted (`ONBOARDING_SUBMITTED`)
* **Trigger:** Partner completes all 6 onboarding wizard steps and clicks **"Submit Application"**.
* **Subject:** `Application Submitted for Verification — {application_id}`
* **Recipient:** `requester_email`
* **Dynamic Variables:**
  - `application_id`: e.g. `APP37833`
  - `requester_name`: e.g. `Rahul Sharma`
  - `venue_name`: e.g. `Sky Sports Arena`
* **Email Purpose:** Acknowledges submission of banking details, Aadhaar KYC, and court photos into the Super Admin audit queue.
* **Code Reference:** `email.service.ts` -> `generateOnboardingSubmittedHtml()` (Line 205)

---

### 5️⃣ Template 5: Venue Activated & Go-Live (`VENUE_ACTIVATED`)
* **Trigger:** Super Admin finishes document verification and clicks **"Approve & Go Live"**.
* **Subject:** `🎉 Congratulations! Your Venue is Live on iBookSports — {venue_name}`
* **Recipient:** `requester_email`
* **Dynamic Variables:**
  - `application_id`: e.g. `APP37833`
  - `requester_name`: e.g. `Rahul Sharma`
  - `venue_name`: e.g. `Sky Sports Arena`
  - `login_url`: `https://manager.ibooksports.com/login` (or `/onboarding/login`)
* **Key Content Included in Email:**
  - "Your turf is officially LIVE!" announcement
  - Direct link to launch the **Vendor Manager Console**
  - Mobile app login instructions
* **Code Reference:** `email.service.ts` -> `generateVenueActivatedHtml()` (Line 235)

---

### 6️⃣ Template 6: Onboarding Documents Correction Needed (`ONBOARDING_REJECTED`)
* **Trigger:** Super Admin flags specific uploaded documents (e.g. blurry Aadhaar, invalid bank passbook, missing court photos) during review.
* **Subject:** `Action Required: Onboarding Corrections Needed — {application_id}`
* **Recipient:** `requester_email`
* **Dynamic Variables:**
  - `application_id`: e.g. `APP37833`
  - `requester_name`: e.g. `Rahul Sharma`
  - `rejection_items`: Array of `{ step: number, section: string, reason: string }`
  - `correction_link`: Direct link to resume and edit the application (`/onboarding?token=...`)
* **Code Reference:** `email.service.ts` -> `generateOnboardingRejectedHtml()` (Line 263)

---

## 🏦 FINANCIAL SETTLEMENT TEMPLATES

### 7️⃣ Template 15: Settlement Payout Processed (`SETTLEMENT_PAYOUT_PROCESSED`)
* **Trigger:** Daily automated T+2 payout job or on-demand vendor payout request (`POST /api/v1/vendor/settlements/instant-payout` or `POST /api/v1/payments/payout/:settlementId`).
* **Subject:** `🏦 Settlement Credited: ₹{net_amount} via IMPS ({settlement_id}) — iBookSports Finance`
* **Recipient:** Vendor Registered Gmail (`vendor_email`)
* **Dynamic Variables:**
  - `settlement_id`: e.g. `SET-2026-8831`
  - `batch_number`: e.g. `BATCH-202610`
  - `vendor_id`: e.g. `APP10238`
  - `vendor_name`: e.g. `Antony Rex`
  - `vendor_email`: e.g. `yutekahema003@gmail.com`
  - `venue_name`: e.g. `Rex Battle Arena`
  - `net_amount`: e.g. `₹1,800.00`
  - `gross_amount`: e.g. `₹2,045.00`
  - `platform_fee`: `10%` platform commission
  - `gst_deductions`: `18%` GST on platform fee
  - `tds_deductions`: `1%` TDS u/s 194O
  - `bank_name`: e.g. `HDFC Bank`
  - `account_last4`: e.g. `4063`
  - `utr_number`: Official Bank UTR (e.g. `CMS370756716IN`)
  - `settlement_period`: e.g. `Oct 2026`
  - `settlement_date`: Formatted timestamp
* **Key Content Included in Email:**
  - 💳 Emerald Badge with Disbursed Net Amount
  - 🏦 Bank Account Card with Masked Account (`•••• 4063`) and Official Bank UTR Pill
  - 📊 Itemized Financial Deductions Table (Gross Online Revenue, 10% Commission, 18% GST, 1% TDS, Net Disbursed)
  - 🔗 Quick Action Buttons: *View Financial Ledger & Download Tax Invoice (PDF)*
* **Code Reference:** [`email.service.ts`](file:///d:/Ibooksports/backend/src/modules/email/email.service.ts) -> `sendSettlementPayoutEmail()` & `generateSettlementPayoutHtml()`

---

## 🛠️ How to Test or View Sent Emails

### 1. View Live Sent Email Audit Logs (JSON):
```http
GET http://192.168.1.28:4000/api/v1/requests/emails/logs
```

### 2. View Interactive Swagger API Docs:
```http
http://192.168.1.28:4000/api/v1/docs
```

---
*Created for iBookSports Engineering Team*
