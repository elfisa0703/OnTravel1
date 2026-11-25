# Security Specification — OnTravel Aceh RBAC

## 1. Data Invariants
1. User roles are strictly `'user'`, `'operator'`, or `'admin'`. Self-registration only creates `'user'` unless the authenticated email matches the verified bootstrap administrator email.
2. Regular users and operators cannot elevate their own `role` field on `/users/{userId}`. Only an existing `admin` may assign or change user roles.
3. Private user PII (`email` in `/users/{userId}`) and personal subcollections (`favorites`, `itineraries`) are readable only by the document owner (`uid == userId`) or an `admin`.
4. Catalog items (`destinations`, `culinary`, `stays`, `packages`) can be created or updated only by verified `operator` or `admin` accounts. Only `admin` may delete catalog items.
5. Verification reports are created in `pending` status by verified signed-in users with `authorUid == request.auth.uid`, updated by `operator`/`admin` during review, locked once reaching terminal status (`verified` or `rejected`) except for `admin` overrides, and deleted only by `admin`.

## 2. Dirty Dozen Attack Payloads (All Must Return PERMISSION_DENIED)
1. **Self-Privilege Escalation on Signup**: `POST /users/u1` with `{ role: "admin" }` by a non-bootstrap user.
2. **Role Tampering on Update**: `PATCH /users/u1` updating `{ role: "operator" }` by owner `u1`.
3. **Ghost Field Injection (Shadow Update)**: `POST /destinations/d99` containing `{ isApprovedForever: true }`.
4. **Unverified Email Spoofing**: Request with `token.email == "fiansa2002@gmail.com"` and `token.email_verified == false`.
5. **Cross-User PII Read**: Authenticated `userA` executing `get(/users/userB)`.
6. **Cross-User Subcollection Write**: `userA` writing to `/users/userB/favorites/f1`.
7. **ID Poisoning**: Document creation with oversized/invalid ID (`"../admin"` or 200-char string).
8. **Operator Destructive Delete Attempt**: User with `role == "operator"` attempting `delete(/destinations/d01)`.
9. **Regular User Catalog Tampering**: User with `role == "user"` attempting `update(/culinary/c01)`.
10. **Client Timestamp Spoofing**: Creating a document with backdated `createdAt` (`createdAt != request.time`).
11. **Terminal State Bypass**: Operator attempting to modify a `verificationReports` document already in `'verified'` or `'rejected'` state.
12. **Report Author Spoofing**: `userA` creating `/verificationReports/r1` with `authorUid: "userB"`.
