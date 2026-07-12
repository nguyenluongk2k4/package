# Đề xuất triển khai: bán hàng qua Facebook / Zalo

## Trạng thái

Đã triển khai theo phương án được duyệt. Các thay đổi code nằm trong working tree hiện tại.

## Kết quả quét hiện tại

Luồng bán hàng hiện tại đang gồm:

- Trang danh sách sản phẩm: `components/sac-co-do/ProductPage.jsx`
  - Có nút `Thêm giỏ` ở hover card.
  - Ghi sản phẩm vào `users/{uid}/cart` trên Firestore.
- Trang chi tiết sản phẩm: `components/sac-co-do/ProductConfigurator.jsx`
  - Có chọn biến thể, số lượng, tổng tiền và nút `Thêm vào giỏ hàng`.
  - Ghi sản phẩm vào `users/{uid}/cart`.
- Khu sản phẩm nổi bật trang chủ: `components/sac-co-do/PassportVersionSection.jsx`
  - Có thêm passport/sản phẩm nổi bật vào giỏ.
- Header: `components/sac-co-do/SiteHeader.jsx`
  - Có icon dẫn tới `/gio-hang`.
- Giỏ hàng/checkout: `components/sac-co-do/CartCheckoutPage.jsx`
  - Đọc cart, nhập thông tin giao hàng, tạo order và có lựa chọn COD/SePay.
- Thanh toán SePay:
  - Browser helper: `lib/sepay/browser.js`.
  - Server helper: `lib/server/sepay.js`.
  - API: `app/api/sepay/checkout/route.js`, `app/api/sepay/ipn/route.js`.
  - Retry thanh toán trong `components/sac-co-do/AccountDashboardPage.jsx`.
- Order/admin:
  - `lib/firebase/userData.js` tạo `orders` từ cart.
  - Các màn admin order vẫn hiển thị và quản lý order cũ, trong đó có dữ liệu SePay.

## Phương án đề xuất

### Hành vi public mới

1. Không còn nút thêm vào giỏ ở danh sách, chi tiết và khu sản phẩm nổi bật.
2. Mỗi sản phẩm có CTA `Liên hệ đặt hàng`.
3. CTA mở một khu lựa chọn:
   - `Nhắn Facebook`.
   - `Nhắn Zalo`.
4. Giữ lựa chọn biến thể và số lượng ở trang chi tiết để khách chọn đúng sản phẩm trước khi liên hệ.
5. Không tạo cart, không yêu cầu đăng nhập, không tạo order và không gọi SePay từ luồng sản phẩm mới.
6. Bỏ icon giỏ hàng khỏi header và cho `/gio-hang` chuyển về `/san-pham` hoặc một trang thông báo đã chuyển sang đặt hàng qua kênh liên hệ.

### Cấu hình kênh bán hàng

Không hard-code link vào từng component. Bổ sung vào document `appSettings/commerce`:

```js
{
  facebookUrl: "https://m.me/1063895426816810",
  zaloUrl: "https://zalo.me/0962216876",
}
```

Admin chỉnh 2 link này tại `/admin/settings`; public đọc cùng lớp settings hiện có. Khi link trống, CTA tương ứng bị ẩn và giao diện hiển thị thông báo cần cấu hình kênh liên hệ.

Hai link đã được đặt làm giá trị mặc định và có thể chỉnh tại `/admin/settings`.

## File dự kiến chỉnh sửa

### Bắt buộc cho luồng public

- `components/sac-co-do/ProductPage.jsx`
  - Xóa logic import/auth/toast dùng cho quick add.
  - Thay quick add bằng CTA liên hệ.
- `components/sac-co-do/ProductConfigurator.jsx`
  - Xóa ghi cart và trạng thái add-to-cart.
  - Đổi nút sang liên hệ Facebook/Zalo, giữ variant/quantity để tạo context cho khách.
- `components/sac-co-do/PassportVersionSection.jsx`
  - Xóa logic thêm sản phẩm nổi bật vào cart.
  - Dùng cùng CTA liên hệ.
- `components/sac-co-do/SiteHeader.jsx`
  - Bỏ link/icon `/gio-hang`.
- `components/sac-co-do/CartCheckoutPage.jsx`
  - Không còn là entry point của luồng public mới; có thể thay bằng màn chuyển hướng/thông báo.
  - Nếu giữ route để tương thích bookmark cũ thì không đọc cart và không tạo order.
- `app/gio-hang/page.jsx`
  - Chuyển route cũ về `/san-pham` hoặc render thông báo chuyển sang Facebook/Zalo.
- `app/globals.css`
  - Thêm style cho CTA/khu lựa chọn Facebook-Zalo; dọn các style cũ chỉ khi không còn component sử dụng.

### Cấu hình link liên hệ

- `lib/firebase/appSettings.js`
  - Bổ sung default, normalize và load/save `facebookUrl`, `zaloUrl`.
- `components/admin/SettingsManager.jsx`
  - Thêm 2 field URL và validate URL cơ bản.
- Có thể tạo component dùng chung, ví dụ `components/sac-co-do/ProductContactActions.jsx`, để tránh lặp UI giữa list/detail/home.

### Chưa nên xóa ngay

- `lib/firebase/userData.js`: giữ schema/order helper để không ảnh hưởng dữ liệu cũ; chỉ ngừng gọi từ public.
- `lib/sepay/browser.js`, `lib/server/sepay.js`, `app/api/sepay/*`: giữ tạm để không làm hỏng order lịch sử hoặc callback cũ. Có thể gỡ ở phase cleanup sau khi xác nhận không còn cần.
- `components/admin/Orders*.jsx`, `components/admin/OrderDetailManager.jsx`, `components/admin/Dashboard.jsx`, `components/admin/UsersOverview.jsx`: giữ khả năng xem order cũ.
- `package.json`: chưa gỡ `sepay-pg-node` trong phase đầu; gỡ sau khi đã xác nhận không còn endpoint nào cần deploy.
- `firestore.rules`: chưa cần đổi vì cart/order cũ vẫn có thể được admin tra cứu.

## Dữ liệu và tương thích

- Dữ liệu sản phẩm hiện tại không cần sửa nếu dùng link bán hàng chung.
- Cart cũ trong Firestore không tự động xóa; chỉ không còn được tạo từ UI mới.
- Order cũ và dữ liệu SePay cũ vẫn giữ để admin tra cứu.
- Nếu muốn mỗi sản phẩm có link Facebook/Zalo riêng, cần mở rộng thêm field trong product schema và admin CatalogManager; phương án hiện tại không làm việc đó để giảm phạm vi.

## Checklist sau khi được duyệt

- [ ] Anh cung cấp URL Facebook và Zalo thật.
- [ ] Thêm settings + admin form cho 2 URL.
- [ ] Tạo CTA dùng chung cho list/detail/home.
- [ ] Gỡ toàn bộ thao tác add-to-cart ở public.
- [ ] Ẩn/bỏ header cart và xử lý route `/gio-hang`.
- [ ] Ngắt SePay khỏi checkout/account public.
- [ ] Kiểm tra `rg` không còn CTA add-to-cart public hoặc import SePay public ngoài code legacy đã giữ.
- [ ] Chạy `npm run build`.
- [ ] Kiểm tra mobile: link Facebook/Zalo mở đúng ứng dụng hoặc fallback trình duyệt.

## Phạm vi không làm trong phase này

- Không xóa dữ liệu Firestore `cart`/`orders` cũ.
- Không xóa ngay toàn bộ backend SePay.
- Không xây CRM, form gửi lead vào Firebase, hay tracking đơn từ Facebook/Zalo.
- Không đổi layout sản phẩm ngoài khu CTA liên hệ và các phần liên quan đến cart.
