# Security Specification for Faith Ekuase Portfolio

## 1. Data Invariants

1. `inquiries`:
   - Anonymous or authenticated users may submit collaboration inquiries with initial status `'new'`.
   - Inquiries contain PII (email, name, message). Only verified administrators can read, update status, or delete inquiries.
   - Status updates are constrained to allowed enum states (`new`, `in_review`, `contacted`, `closed`).
   - String sizes and keys are strictly bounded to prevent injection and denial of wallet attacks.
2. `vlogs`:
   - Publicly readable to power Faith's portfolio video showcase.
   - Only verified administrators can create, update, or delete vlog items.
   - Fields must adhere strictly to schema (title, category, description, media_url, sort_order, timestamps).
3. `media_kit_requests`:
   - Public visitors can submit a media kit request with initial status `'pending'`.
   - Only verified administrators can read and manage media kit leads.
4. `admins`:
   - Only existing administrators or the bootstrapped verified admin (`tegaokoloba2@gmail.com`) can read and manage admin privileges.

## 2. The Dirty Dozen Payloads (Designed to Fail)

1. **Unauthenticated Read on Inquiries**: Attempting to read `/inquiries/{id}` as an anonymous visitor.
2. **Ghost Field in Inquiry**: Submitting an inquiry with unauthorized field `isAdmin: true` or `discount: 100`.
3. **Inquiry with Invalid Initial Status**: Creating an inquiry with `status: 'contacted'` directly to bypass triage.
4. **Oversized Inquiry Message**: Message exceeding 2,000 characters payload attack.
5. **Malicious Document ID**: Path traversal or oversized characters in inquiry document ID (e.g. `../../etc`).
6. **Public Write on Vlogs**: Non-admin attempting to create a vlog.
7. **Admin Spoofing via Unverified Email**: Attempting to act as admin with `email: 'tegaokoloba2@gmail.com'` but `email_verified: false`.
8. **Vlog Missing Required Fields**: Adding a vlog without `media_url` or `category`.
9. **Media Kit Request State Skip**: Creating a media kit request with `status: 'sent'`.
10. **Non-Admin Reading Media Kit Requests**: Non-admin attempting to list or get media kit requests.
11. **Self-Escalation to Admin Role**: Regular user writing their own UID into `/admins/{uid}`.
12. **Malicious Protocol in Media URL**: Non-URI garbage or string overflow in vlog media_url.
