# Admin Modules Roadmap

Tai lieu nay dung de chot scope, trang thai hien tai va goal implement cho 4 module admin chinh cua Sac Co Do.

## Muc Dich

File nay dung cho 3 viec:

1. Nhin nhanh module nao da co, module nao con thieu.
2. Tach ro `MVP da xong`, `phan can hardening`, `phan chua implement`.
3. Lay nguyen van goal markdown de set cho tung phase.

## Tong Quan He Thong

4 module admin can co:

1. Quan ly nguoi dung
2. Quan ly don hang
3. Quan ly nhan vat AR
4. Quan ly ma kich hoat

## Snapshot Hien Tai

| Module | Route chinh | Trang thai | Nhan xet ngan |
| --- | --- | --- | --- |
| Module 1 - Users | `/admin/users` | MVP+ | Da list, xem chi tiet, moderation, note, xem nested data, link qua code va order |
| Module 2 - Orders | `/admin/orders` | MVP dang mo rong | Da tao order tu checkout, da co admin list/detail, timeline co ban, COD flow; con thieu SePay that |
| Module 3 - AR Characters | `/admin/ar-characters`, `/admin/stations` | MVP+ | Da CRUD AR, map station -> character, fallback default, preview co ban |
| Module 4 - Activation Codes | `/admin/activation-codes` | MVP+ | Da list, tao le/batch, reset, disable, bulk action, export, trace user |

## Thu Tu Uu Tien De Lam Tiep

Theo gia tri van hanh, thu tu nen la:

1. Module 2 - Hoan thien payment va order ops
2. Module 1 - Hardening moderation va support tooling
3. Module 3 - AR asset validation va mobile QA
4. Module 4 - Audit log va permission hardening

Ly do:

- Module 2 la phan lien quan truc tiep toi doanh thu va quy trinh ban hang.
- Module 1 dang dung du lieu that nhieu nhat, nen can polish de support van hanh.
- Module 3 va 4 da dung duoc roi, nhung can chot validation va guardrail.

---

## Module 1 - Quan Ly Nguoi Dung

### Muc Tieu Nghiep Vu

Admin can:

- xem toan bo user,
- biet user dang active hay bi khoa,
- xem user da di duoc bao nhieu tram,
- xem anh checkin, photobooth, AR session,
- biet ho dang gan ma kich hoat nao,
- can thiep nhanh khi can support.

### Admin Screens

- `/admin/users`
- deep link hien tai qua query string: `?uid=<firebase-uid>`

### Firebase Data Lien Quan

- `users/{uid}`
- `users/{uid}/journeyProgress/{stationId}`
- `users/{uid}/photoboothPhotos/{photoId}`
- `users/{uid}/arExperiences/{sessionId}`
- `users/{uid}/cart/{itemId}`
- `activationCodes/{code}`
- `orders/{orderId}` query theo `userId`

### Da Co O Hien Tai

- User list tu Firestore.
- Search theo ten, email, uid, phone.
- Filter theo status.
- Detail panel.
- Stats tong quan.
- Load nested subcollections: journey, photobooth, AR, cart.
- Hien passport code va activation code lien quan.
- Hien lich su order cua user.
- Link qua admin order detail.
- Edit profile co ban.
- Ban, mo khoa, active lai user.
- Internal fields: `supportStatus`, `adminNotes`, `adminNotesUpdatedAt`.
- Auto-select user bang query param `?uid=...`.

### Con Thieu / Nen Lam Tiep

- Route rieng `/admin/users/[uid]` neu muon deep link sach hon.
- Export CSV user list.
- Timeline tong hop hoat dong user theo 1 tab duy nhat.
- Confirm dialog cho hanh dong moderation nhay cam.
- Validation ro hon cho cac field profile.
- Audit log moderation.
- Filter nang cao theo so checkin, co order hay khong, da kich hoat hay chua.

### Acceptance Criteria

- Admin xem duoc user that tu Firestore.
- Mo 1 user ra xem duoc journey, media, AR, cart, activation va orders.
- Sua profile va doi status cap nhat dung Firestore.
- Build pass.

### Goal De Set

Goal tong module:

`Harden the admin user module so operators can search, inspect, and moderate user accounts with journey, media, activation, and order visibility.`

Goal phase nho:

1. `Add deeper admin support tooling to the user module, including validation, moderation safeguards, and consolidated activity history.`
2. `Add export and advanced filtering to admin users so operations can segment and support accounts faster.`
3. `Add a dedicated admin user detail route and moderation audit trail.`

---

## Module 2 - Quan Ly Don Hang

### Muc Tieu Nghiep Vu

Admin can:

- xem tat ca don hang phat sinh tu mua san pham,
- theo doi trang thai tu dat hang toi hoan thanh,
- phan biet COD va SePay,
- cap nhat thanh toan, giao hang, hoan tat, huy,
- tra cuu lich su su kien cua moi don.

### Admin Screens

- `/admin/orders`
- deep link hien tai qua query string: `?order=<orderId>`

### Firebase Data Lien Quan

- `orders/{orderId}`
- `orders/{orderId}/events/{eventId}`
- `users/{uid}/cart/{itemId}` la nguon tao order

### Schema Van Hanh Hien Tai

Order dang theo huong:

```json
{
  "orderCode": "SCD-2026-0001",
  "userId": "",
  "customer": {
    "name": "",
    "email": "",
    "phone": ""
  },
  "shippingAddress": {
    "province": "",
    "district": "",
    "ward": "",
    "addressLine": ""
  },
  "items": [],
  "subtotal": 0,
  "shippingFee": 0,
  "discount": 0,
  "total": 0,
  "paymentMethod": "cod",
  "paymentStatus": "pending",
  "orderStatus": "pending",
  "trackingCode": "",
  "shippingProvider": "",
  "notes": "",
  "createdAt": "",
  "updatedAt": ""
}
```

### Da Co O Hien Tai

- Public checkout moi da tao order tu cart.
- Sau khi dat hang, cart duoc clear.
- Don hang luu vao `orders`.
- Co subcollection events cho timeline co ban.
- Admin list orders.
- Search/filter co ban.
- Admin detail panel.
- Admin update status: paid, shipping, completed, failed, cancelled.
- Admin update metadata nhu tracking code, notes, shipping provider.
- User dashboard `/cua-toi` da xem duoc lich su order va timeline.
- Firestore rules cho `orders` va `orders/events` da co.

### Con Thieu / Nen Lam Tiep

- SePay that:
  - env vars,
  - callback/webhook route,
  - reconciliation,
  - idempotency,
  - mapping transaction -> order.
- Trang thai payment chi tiet hon cho bank transfer.
- Ghi nhan reference transfer, bank info, paid amount.
- Confirmation UX ro hon sau checkout.
- Export order list.
- Dashboard summary cho orders.
- Shipping timeline / giao van that neu ve sau co provider.

### Acceptance Criteria

- Dat hang tao duoc document order hop le trong Firestore.
- Admin xem duoc list/detail order.
- Admin doi duoc trang thai theo flow.
- User xem duoc order history.
- COD va SePay duoc phan biet ro rang.
- Build pass.

### Goal De Set

Goal tong module:

`Complete the admin order module with checkout-backed Firestore orders, operator status management, and COD plus SePay payment handling.`

Goal phase nho:

1. `Finish the order MVP so checkout, admin order management, and customer order history share one Firestore-backed lifecycle.`
2. `Implement SePay integration with callback handling, payment reconciliation, and idempotent order updates.`
3. `Add operational shipping tools, exports, and reporting to the admin orders module.`

### Ghi Chu Trang Thai

Module nay khong con o muc phase 0 nua. Hien tai no da co MVP van hanh cho COD va admin ops, nhung van chua du "production-complete" vi thieu SePay that.

---

## Module 3 - Quan Ly Nhan Vat AR

### Muc Tieu Nghiep Vu

Moi dia danh se gan voi 1 nhan vat AR cu the, de:

- public AR mo dung nhan vat cho dung station,
- admin quan ly duoc GLB, USDZ, poster, animation,
- he thong co fallback an toan neu station chua gan model rieng.

### Admin Screens

- `/admin/ar-characters`
- `/admin/stations`

### Firebase Data Lien Quan

- `arCharacters/{characterId}`
- `stations/{stationId}` voi `arGuide.modelId`

### Da Co O Hien Tai

- CRUD AR characters.
- Upload/chinh sua asset URLs.
- Poster preview co ban.
- Default character.
- Mapping station -> `modelId`.
- Hien reverse mapping: character dang duoc station nao dung.
- Public AR/checkin da resolve theo character id.
- Fallback ve default character neu station chua co model rieng.
- Asset warnings cho field thieu GLB/USDZ/poster/default animation.

### Con Thieu / Nen Lam Tiep

- Validation URL/file chat hon.
- Preview model tot hon ngay trong admin.
- Device QA tren mobile HTTPS that.
- Rule/guard tranh xoa nham default character dang duoc dung.
- Voice/subtitle authoring UX ro hon neu muon mo rong.

### Acceptance Criteria

- Moi station co the gan mot AR character ro rang.
- Public AR mo dung nhan vat cua station.
- Station chua gan model van fallback dung.
- Build pass.

### Goal De Set

Goal tong module:

`Harden AR character management so every station resolves a valid GLB/USDZ character with safe defaults, asset validation, and clear admin mapping.`

Goal phase nho:

1. `Polish the AR asset manager with stronger validation and safer default-character rules.`
2. `Improve admin AR preview and station-to-character QA tooling.`
3. `Run and document real-device HTTPS AR validation for Android and iPhone.`

---

## Module 4 - Quan Ly Ma Kich Hoat

### Muc Tieu Nghiep Vu

Admin can:

- xem danh sach ma kich hoat,
- tao ma le hoac hang loat,
- reset ma da dung,
- disable/active lai ma,
- tra cuu ma do thuoc user nao.

### Admin Screens

- `/admin/activation-codes`
- deep link ho tro query string: `?code=<activation-code>`

### Firebase Data Lien Quan

- `activationCodes/{code}`
- lien ket toi `users/{uid}` thong qua `usedBy`, `usedEmail`, `passportCode`

### Da Co O Hien Tai

- List/search/filter.
- Tao ma thu cong.
- Tao batch.
- Reset code da dung ve active.
- Disable/active lai code.
- Bulk select.
- Bulk reset/disable/active.
- CSV export.
- Hien traceability code -> user.
- Auto-select code bang query param `?code=...`.

### Con Thieu / Nen Lam Tiep

- Audit log cho cac hanh dong reset/disable.
- Validation duplicate/prefix nghiem hon.
- Guard ro hon khi reset code dang gan user that.
- Permission level neu sau nay co operator role.
- Link hai chieu nguoc lai tu code -> user detail va user -> code detail co the mo rong them.

### Acceptance Criteria

- Admin thay duoc toan bo ma kich hoat that.
- Tao le, tao batch, reset, disable, active lai cap nhat dung Firestore.
- Trace duoc ma nao dang gan voi user nao.
- Build pass.

### Goal De Set

Goal tong module:

`Harden activation code operations with bulk actions, traceability, validation, and safer recovery workflows.`

Goal phase nho:

1. `Add stronger safeguards and auditability to activation code reset and disable flows.`
2. `Add stricter code validation, duplicate prevention, and role-aware permissions.`

---

## Phase De Chia Goal Toan Du An

## Phase A - Hardening 3 Module Da O Muc MVP+

Scope:

- Module 1: moderation safeguards, validation, export.
- Module 3: AR asset validation, preview polish, device QA.
- Module 4: audit log, validation, guardrails.

Goal:

`Harden the existing admin users, AR, and activation-code modules for safer real operations.`

## Phase B - Hoan Thien Orders MVP End-to-End

Scope:

- checkout -> order,
- admin order list/detail,
- user order history,
- status timeline,
- COD flow.

Goal:

`Finish the end-to-end Firestore order MVP across checkout, admin operations, and customer account history.`

## Phase C - SePay Va Payment Completion

Scope:

- env vars,
- server callback/webhook,
- reconciliation logic,
- payment status update,
- idempotency and audit events.

Goal:

`Implement SePay payment integration and complete order payment reconciliation.`

## Phase D - Ops Polish

Scope:

- exports,
- reporting,
- dashboards,
- audit logs,
- shipping polish.

Goal:

`Add reporting, export, and operational polish across users, orders, AR, and activation workflows.`

---

## Goal Copy-Paste De Dung Ngay

Neu muon set goal theo module:

1. `Harden the admin user module so operators can search, inspect, and moderate user accounts with journey, media, activation, and order visibility.`
2. `Complete the admin order module with checkout-backed Firestore orders, operator status management, and COD plus SePay payment handling.`
3. `Harden AR character management so every station resolves a valid GLB/USDZ character with safe defaults, asset validation, and clear admin mapping.`
4. `Harden activation code operations with bulk actions, traceability, validation, and safer recovery workflows.`

Neu muon set goal theo phase:

1. `Harden the existing admin users, AR, and activation-code modules for safer real operations.`
2. `Finish the end-to-end Firestore order MVP across checkout, admin operations, and customer account history.`
3. `Implement SePay payment integration and complete order payment reconciliation.`
4. `Add reporting, export, and operational polish across users, orders, AR, and activation workflows.`

Neu muon set goal rat cu the, nen dung 3 goal sau:

1. `Implement SePay integration with callback handling, payment reconciliation, and idempotent Firestore order updates.`
2. `Add export, validation, and moderation safeguards to the admin user and activation-code modules.`
3. `Improve AR asset validation and real-device QA so each station reliably opens the correct character on mobile AR.`

---

## Quy Uoc Khi Tiep Tuc Implement

1. Firebase-first, khong quay lai hardcode neu khong that su can.
2. Moi write action admin phai di kem Firestore rules va loading/error state.
3. Khong pha public flow dang chay o `/san-pham`, `/gio-hang`, `/cua-toi`, `/hanh-trinh`, `/checkin`.
4. Sau moi phase phai chay lai `npm run build`.
5. Cac route admin uu tien thao tac nhanh, ro trang thai, it click.
