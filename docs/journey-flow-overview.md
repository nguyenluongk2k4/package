# 🗺️ Sắc Cố Đô — Tổng quan hành trình người dùng

> File này ghi lại luồng người dùng từ đầu đến cuối (end-to-end), giúp track tiến độ phát triển và phát hiện lỗ hổng.
> **Cập nhật:** 2025-07

---

## 1. Tổng quan luồng

```
Mua sách passport
    │
    ▼
Nhận mã QR kích hoạt trong sách
    │
    ▼
Kích hoạt tài khoản tại website
    │
    ▼
Khám phá 6 địa điểm Ninh Bình
    │
    ▼
Mỗi điểm: tìm QR thực tế → quét → AR → photobooth → đóng dấu
    │
    ▼
Hoàn thành 6 trạm → nhận Certificate
```

---

## 2. Các vai trò & trạng thái

| Role | Trạng thái hiện tại | Ghi chú |
|------|-------------------|---------|
| **Guest** (chưa đăng nhập) | ✅ Xem public site | Chưa active thì không thể check-in |
| **User mới** (chưa active) | ✅ Đăng ký, đăng nhập | 🟡 Cần trang active QR |
| **User đã active** | ✅ Check-in + AR + Photobooth | Có thể ghi tiến trình |
| **Admin** | ✅ CMS stations/products/AR/users | Cần thêm validation |
| **User hoàn thành 6/6** | 🟡 Chưa có trang certificate cụ thể | Cần thiết kế thêm |

---

## 3. Chi tiết từng bước

### Bước 1: Mua sách passport — 🟢 Hoàn thành (mua hàng)

- Người dùng mua cuốn sổ pop-up Sắc Cố Đô (gói: Đơn, Combo, Hộp quà)
- Nhận cuốn sổ có: mã ID SCD + bản đồ 6 trạm + pop-up giấy

**Trang liên quan:**
- `/san-pham` — danh sách gói
- `/san-pham/[productId]` — chi tiết + mua

### Bước 2: Kích hoạt tài khoản — 🟢 Giao diện có, cần xác nhận logic QR

- Người dùng vào `/kich-hoat`
- Nhập mã SCD (in trên sổ) → kích hoạt tài khoản
- Tài khoản được gắn mã SCD để bắt đầu hành trình

**Trang liên quan:**
- `/kich-hoat` — kích hoạt (đã có giao diện)
- `components/sac-co-do/ActivatePage.jsx`

**Cần kiểm tra:**
- [ ] Mã QR trong sách cấu tạo thế nào? (plain text mã SCD? URL điều hướng?)
- [ ] Sau kích hoạt, user được redirect tới `/hanh-trinh` hay `/cua-toi`?

### Bước 3: Khám phá trang gợi ý địa điểm — 🟡 CẦN LÀM

- **Trang `/hanh-trinh`** 🟢: danh sách 6 trạm, đã có
- **Trang `/hanh-trinh/[dia-diem]`** 🟡: hiện tại là trang chi tiết văn hoá
- **Cần chuyển thành trang gợi ý vị trí QR** + hướng dẫn tìm

**Công việc cụ thể:**
- [ ] Tạo component `QRGuidePage.jsx` (hoặc sửa `JourneyDetailPage.jsx`)
- [ ] Nội dung mỗi trang: gợi ý nơi đặt QR tại địa điểm đó
- [ ] Ảnh minh hoạ vị trí QR (chờ a/c bổ sung)
- [ ] Button dẫn tới `/checkin/[tram-id]` để quét

### Bước 4: Quét QR tại trạm — 🟡 Cần làm QR validation

Tại mỗi địa điểm, người dùng tìm mã QR thực tế và quét.

**Luồng hiện tại:**
1. User mở `/checkin/[tram-id]` trên thiết bị di động
2. Camera bật lên (AR experience)
3. Model 3D xuất hiện trên camera
4. User tương tác, chụp photobooth
5. Lưu ảnh + đánh dấu đã đi

**Còn thiếu:**
- [ ] **QR validation**: cần endpoint/server xác thực QR đúng
  - QR chứa mã bí mật của từng trạm
  - Server kiểm tra tính hợp lệ, không cho quét lại một QR nhiều lần
  - Sau validate → redirect tới `/checkin/[tram-id]?token=xxx`
- [ ] Trường hợp QR sai hoặc hết hạn → thông báo lỗi
- [ ] Fallback: nhập mã ngày tại quầy (đã có UI mẫu ở sidebar)

### Bước 5: Trải nghiệm AR + Photobooth — 🟢 Đã triển khai

- `/checkin/[tram-id]` — component `CheckinExperiencePage.jsx`
- Bật camera, hiển thị model 3D (model-viewer)
- Chụp ảnh photobooth → upload lên Cloudinary
- Lưu ảnh + AR session vào Firestore

**Component liên quan:**
- `components/sac-co-do/CheckinExperiencePage.jsx` — AR checkin chính
- `components/sac-co-do/WebArViewer.jsx` — xem AR model
- `lib/cloudinary/client.js` — upload ảnh

### Bước 6: Đóng dấu passport — 🟢 Đã triển khai

- Sau AR check-in, gọi `saveJourneyProgress()` trong `lib/firebase/userData.js`
- Ghi vào `users/{uid}/journeyProgress/{stationId}` với `checkedInAt: serverTimestamp()`
- Đánh dấu trạm đã đi

**Cần kiểm tra:**
- [ ] Ngăn user check-in lại trạm đã đi (kiểm tra `journeyProgress` trước khi cho AR)

### Bước 7: Xem tiến trình hộ chiếu — 🟢 Đã có

- `/ho-chieu` — xem hộ chiếu, các dấu đã đóng
- `/cua-toi` — thông tin tài khoản + tiến trình

### Bước 8: Nhận Certificate khi hoàn thành 6/6 — 🟡 Cần làm

- Khi user đã đóng dấu đủ 6 trạm:
  - [ ] Hiển thị certificate trên web
  - [ ] Cho phép tải xuống / in
  - [ ] Có thể gửi email kèm certificate nếu có

**Trang liên quan:**
- `/phan-thuong` — hiện đã có route, cần nội dung phần thưởng

---

## 4. Cấu trúc dữ liệu Firestore

### users/{uid}/journeyProgress/{stationId}

```js
{
  stationId: "trang-an",
  stationName: "Tràng An",
  source: "app",
  checkedInAt: Timestamp,
  updatedAt: Timestamp,
}
```

### users/{uid}/arExperiences/{sessionId}

```js
{
  stationId: "trang-an",
  stationName: "Tràng An",
  modelId: "default-guide",
  status: "completed",
  createdAt: Timestamp,
}
```

### users/{uid}/photoboothPhotos/{photoId}

```js
{
  stationId: "trang-an",
  caption: "...",
  url: "cloudinary-url",
  cloudinaryPublicId: "...",
  createdAt: Timestamp,
}
```

---

## 5. Trạng thái các trang liên quan

| Route | Component | Trạng thái | Ghi chú |
|-------|-----------|-----------|---------|
| `/` | `HomePage` | ✅ | |
| `/san-pham` | `ProductPage` | ✅ | |
| `/san-pham/[productId]` | `ProductDetailPage` | ✅ | |
| `/kich-hoat` | `ActivatePage` | 🟢 Có UI | Cần xác nhận logic QR |
| `/hanh-trinh` | `JourneyPage` | ✅ | Danh sách trạm |
| `/hanh-trinh/[dia-diem]` | `JourneyDetailPage` | 🟡 Cần sửa | Chuyển thành trang gợi ý QR |
| `/checkin/[tram-id]` | `CheckinExperiencePage` | ✅ | AR + photobooth |
| `/ho-chieu` | `PassportJourneyPage` | ✅ | Xem dấu đã đi |
| `/cua-toi` | `UtilityPages` | ✅ | Tài khoản |
| `/photobooth` | `UtilityPages` | 🟢 Có UI | |
| `/phan-thuong` | `UtilityPages` | 🟡 Cần nội dung | Certificate + quà |
| `/gio-hang` | `UtilityPages` | ✅ | |
| `/ve-chung-toi` | `AboutPage` | ✅ | |
| `/admin/**` | `AdminShell` | ✅ | CMS |

---

## 6. Những việc cần làm tiếp theo

Ưu tiên theo thứ tự:

### 🔴 P0 — Luồng chính

- [ ] **Trang gợi ý QR tại mỗi địa điểm** — tạo component `QRGuidePage` (hoặc sửa `JourneyDetailPage`)
- [ ] **QR validation** — endpoint/server xác thực QR, redirect tới check-in
- [ ] **Chặn check-in trùng** — kiểm tra `journeyProgress` trước khi cho vào AR

### 🟡 P1 — Hoàn thiện

- [ ] **Certificate hoàn thành** — thiết kế + hiển thị + tải xuống
- [ ] **Nội dung phần thưởng** tại `/phan-thuong`
- [ ] **Ảnh minh hoạ vị trí QR** — chờ người dùng bổ sung

### 🟢 P2 — Nâng cao

- [ ] Email certificate khi hoàn thành
- [ ] Admin dashboard: theo dõi số lượng user check-in từng trạm
- [ ] QR code quản lý: admin tạo/cập nhật QR cho từng trạm
- [ ] Test AR trên Android Chrome + iPhone Safari (HTTPS)
- [ ] Audit encoding tiếng Việt

---

## 7. Sơ đồ luồng (text flow)

```
[Sách vật lý] ──> Mã SCD ──> kich-hoat
                                │
                     ┌──────────┴──────────┐
                     │  User đã active      │
                     └──────────┬──────────┘
                                │
              ┌─────────────────┼─────────────────┐
              ▼                 ▼                 ▼
     Tràng An ──── Hoa Lư ── Bái Đính ── Phố Cổ ── Tam Cốc ── Hang Múa
              │                 │                 │
              ▼                 ▼                 ▼
     Tìm QR tại           Tìm QR tại           Tìm QR tại
     địa điểm              địa điểm              địa điểm
         │                    │                    │
         ▼                    ▼                    ▼
     Quét QR              Quét QR              Quét QR
         │                    │                    │
         ▼                    ▼                    ▼
  [Validate QR] ──── [Validate QR] ──── [Validate QR]
         │                    │                    │
         ▼                    ▼                    ▼
     AR trải nghiệm       AR trải nghiệm       AR trải nghiệm
     + Photobooth          + Photobooth          + Photobooth
         │                    │                    │
         ▼                    ▼                    ▼
     Lưu ảnh +            Lưu ảnh +            Lưu ảnh +
     Đóng dấu              Đóng dấu              Đóng dấu
         │                    │                    │
         └──────────────────┬─┴────────────────────┘
                            │
                            ▼
                    Đủ 6/6 dấu?
                        │
              ┌─────────┴──────────┐
              ▼                    ▼
            Không               Có ──> Certificate
          (tiếp tục)                 + Phần thưởng
```
