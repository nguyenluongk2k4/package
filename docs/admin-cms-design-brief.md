# Admin CMS Design Brief - Sac Co Do

## Goal

Design a polished admin CMS for the "Sac Co Do" travel/passport experience. The CMS is used by project admins to manage Firebase content for the public website: destinations, products, AR characters, and users.

The design should feel like a professional operations tool, not a marketing landing page. Prioritize clarity, speed, dense information, strong form ergonomics, and reliable status feedback.

## Product Context

Sac Co Do is a heritage travel product around Ninh Binh, combining:

- A physical passport/check-in journey.
- Destination pages and station data.
- Souvenir products.
- AR characters and 3D assets.
- User progress, cart, photobooth, and AR session data.

The CMS edits Firestore collections and uploads media through Cloudinary.

## Current Routes

- `/admin`: Dashboard.
- `/admin/stations`: Destination/station manager.
- `/admin/products`: Product manager.
- `/admin/ar-characters`: AR character/model manager.
- `/admin/users`: Read-only user overview.
- `/admin/login`: Admin login.

## Main Users

Primary user: internal admin/operator.

They need to:

- Login with email/password.
- Quickly see content counts and operational status.
- Find existing documents by name/slug/status.
- Create or edit destination, product, and AR records.
- Upload image/GLB/USDZ/poster assets.
- Save, archive, and verify changes.
- Inspect user data read-only.

## Visual Direction

Use a calm, premium admin visual language inspired by the Sac Co Do brand:

- Deep heritage green as the main admin color.
- Warm gold/amber for small highlights and status accents.
- Clean off-white or pale green backgrounds.
- White content surfaces with subtle borders and shadows.
- 8px to 16px radius maximum for admin UI. Avoid overly round, playful cards.
- Typography should be readable and compact. Use Vietnamese-safe fonts.

Suggested palette:

- Primary: `#052c24`
- Primary hover: `#09473e`
- Accent green: `#10b981`
- Gold accent: `#d97706`
- Page background: `#f4f7f5`
- Surface: `#ffffff`
- Text: `#0f172a`
- Muted text: `#64748b`
- Border: `rgba(5, 52, 44, 0.10)`
- Warning bg: `#fef3c7`
- Error: `#ef4444`

## Typography

Use Vietnamese-capable fonts. Avoid custom display fonts for form-heavy admin surfaces unless used only for small brand moments.

Recommended:

- Body: Be Vietnam Pro, Inter, or system sans.
- Headings: Be Vietnam Pro or Baloo 2 only if kept restrained.
- Code/JSON fields: ui-monospace, SFMono-Regular, Menlo, Consolas.

Important: all Vietnamese text must render correctly. No mojibake such as `ÄÄƒng nháº­p`.

## Layout

### Desktop Shell

Use a two-column admin shell:

- Fixed/sticky left sidebar: 260-280px.
- Main content area: max width around 1200px.
- Content padding: 40-48px desktop.

Sidebar:

- Logo at top.
- Navigation links with icons.
- Active state highly visible.
- User email and logout pinned at bottom.

Main area:

- Page eyebrow.
- Page title.
- Short helper description.
- Content below with dashboard stats or manager grid.

### Mobile/Tablet

At tablet/mobile sizes:

- Sidebar becomes top stacked nav or collapsible drawer.
- Manager grid becomes single column.
- Form actions should stay reachable.
- Search/filter controls stack vertically.

## Required Screens

### 1. Login Screen

Purpose: admin email/password login only.

Elements:

- Centered login card.
- Logo.
- Eyebrow: `Admin CMS`.
- Title: `Đăng nhập quản trị`.
- Email input.
- Password input.
- Primary submit button: `Đăng nhập`.
- Loading button state: `Đang đăng nhập...`.
- Alert area for Firebase/Auth errors.
- Toast or inline status for login progress.

Do not include Google login in admin.

States:

- Empty.
- Loading.
- Auth error.
- Firebase/offline error.
- Missing Firebase env config.
- Logged-in but not admin.

Copy examples:

- `Thiếu Firebase env: ...`
- `Tài khoản chưa có quyền`
- `Account này chưa có adminUsers/{user.uid}. Hãy chạy seed hoặc cấp quyền thủ công.`
- `Không đọc được dữ liệu Firebase sau khi đăng nhập.`

### 2. Dashboard

Purpose: quick CMS overview.

Stats:

- Địa danh.
- Sản phẩm.
- Users.
- AR Characters.

Layout:

- Four stat cards on desktop.
- Each card has label, count, and small icon.
- Use subtle hover feedback.
- Counts can show `-` while loading.

Header copy:

- Eyebrow: `Firebase v1`
- Title: `Dashboard`
- Description: `Quản trị dữ liệu đang dùng cho public app: địa danh, sản phẩm, nhân vật AR và user journey.`

### 3. Collection Manager Pattern

Used for:

- Stations.
- Products.
- AR Characters.

Structure:

- Header.
- Toolbar.
- Left document list.
- Right editor form.

Toolbar:

- Search input with icon.
- Status filter select: all, published, draft, archived.
- Create button: `Tạo mới`.

Document list:

- Cards/rows showing name, slug/status, status and sort order.
- Active selected item state.
- Empty state if no results.
- Loading state while fetching.

Editor:

- Top section: `Tạo mới` or `Chỉnh sửa`.
- Save feedback message.
- Form sections grouped by domain.
- Sticky or repeated save/archive actions if form is long.
- Primary save button.
- Secondary archive button.

Required editor states:

- Saving.
- Saved successfully.
- Validation error.
- Uploading asset.
- Upload failed.
- Firebase offline/network error.

### 4. Stations Manager

Route: `/admin/stations`

Title:

- `Địa danh`

Description:

- `Quản lý card, detail, gallery, map, AR guide và trạng thái publish.`

Fields:

- Tên.
- Slug.
- Tag.
- Mô tả card.
- Hero image URL.
- Upload hero image.
- Map image URL.
- Giờ mở cửa.
- Stamp.
- Status.
- Sort order.
- Hiện ở homepage.
- Detail badge.
- Detail headline.
- Intro.
- Gallery JSON array.
- History JSON array.
- Chapters JSON array.
- AR voice text.
- AR modelId.
- Subtitles JSON array.

Design needs:

- Consider grouping into tabs/sections:
  - Basic info.
  - Media.
  - Detail page.
  - AR guide.
  - Publishing.
- JSON fields need monospace editor style and validation/error affordance.

### 5. Products Manager

Route: `/admin/products`

Title:

- `Sản phẩm`

Description:

- `Quản lý list/detail/homepage flags, ảnh chi tiết và model 3D.`

Fields:

- Tên.
- Slug.
- Short name.
- Mô tả.
- Giá.
- Khối lượng.
- Badge.
- Category.
- Status.
- Sort order.
- Hiện homepage.
- Hiện product list.
- Home placement.
- Images JSON array.
- Detail images JSON array.
- Features JSON array.
- Variants JSON array.
- GLB URL.
- Upload GLB.
- USDZ URL.
- Upload USDZ.
- Poster URL.
- 3D model preview.

Design needs:

- Product forms are long, so use clear sectioning.
- 3D preview should be visibly framed but not decorative.
- Upload controls should show accepted file type hints.
- Price field should be numeric and easy to scan.

### 6. AR Characters Manager

Route: `/admin/ar-characters`

Title:

- `Nhân vật AR`

Description:

- `Upload GLB/USDZ/poster, preview model-viewer và set default.`

Fields:

- Tên.
- Status.
- Sort order.
- Nhân vật mặc định.
- GLB URL.
- Upload GLB.
- USDZ URL.
- Upload USDZ.
- Poster URL.
- Default animation.
- Animations JSON array.
- Model preview.

Design needs:

- Strong visual treatment for model preview.
- Clearly mark default character.
- Show file upload progress/status.

### 7. Users Overview

Route: `/admin/users`

Purpose: read-only user inspection.

Header:

- Eyebrow: `Read only`
- Title: `User overview`
- Description: `Xem profile, cart, hành trình, photobooth và AR sessions theo từng user.`

Layout:

- Left list of users.
- Right details panel.
- Details grouped by:
  - cart.
  - journeyProgress.
  - photoboothPhotos.
  - arExperiences.

Design needs:

- Read-only treatment.
- JSON/detail blocks with scroll areas.
- Empty state: `Chọn user`.
- User rows should show display name/email/id.

## Components To Design

Core:

- Admin shell/sidebar.
- Header/title block.
- Stat card.
- Toolbar.
- Search input.
- Status select.
- Primary button.
- Secondary button.
- Danger/archive button.
- Document list item.
- Editor card/panel.
- Text input.
- Textarea.
- Number input.
- Checkbox/toggle.
- File upload field.
- JSON editor field.
- Toast.
- Alert.
- Loading state.
- Empty state.
- Model preview frame.

## Interaction Requirements

Navigation:

- Active sidebar item persists per route.
- Logout is always available.

Search/filter:

- Search filters by name, slug, category.
- Status filter narrows list.

Create:

- `Tạo mới` clears selection and opens blank editor.

Edit:

- Clicking a row loads the document into editor.
- Selected row visually persists.

Save:

- Validate required name/slug.
- Disable button while saving.
- Show success or error message.

Archive:

- Secondary/destructive action.
- Should ask for confirmation in ideal design.

Upload:

- Upload fields should show selected file name.
- Show uploading/success/error state.
- Media URL field should update after successful upload.

## Content And Copy

Use Vietnamese UI text for admin labels and actions where the current app already does:

- `Đăng nhập quản trị`
- `Mật khẩu`
- `Đang đăng nhập...`
- `Đăng xuất`
- `Đang kiểm tra quyền admin...`
- `Tài khoản chưa có quyền`
- `Địa danh`
- `Sản phẩm`
- `Nhân vật AR`
- `Tìm theo tên, slug...`
- `Tất cả trạng thái`
- `Tạo mới`
- `Chỉnh sửa`
- `Đang lưu...`
- `Lưu`
- `Lưu trữ`
- `Giờ mở cửa`
- `Hiện ở homepage`
- `Nhân vật mặc định`
- `Chọn user`

Avoid broken Vietnamese encoding.

## Technical Constraints

Current app:

- Next.js App Router.
- React client components.
- Firebase Auth and Firestore.
- Cloudinary upload for media.
- Existing CSS is in `app/globals.css`.
- Current main admin component is `components/admin/AdminShell.jsx`.

Implementation can use:

- Plain CSS.
- Existing assets in `/public/assets`.
- Optional icon library if added by engineering, but do not require it.

Do not introduce:

- A marketing landing page for admin.
- Heavy animations that slow down form work.
- Card-inside-card nesting.
- Decorative gradients/orbs as the main visual language.

## Suggested Information Architecture Improvement

For long editor forms, prefer tabs or grouped sections:

- Basic.
- Media.
- Detail.
- AR.
- Publish.

On desktop, consider:

- Left document list.
- Middle editor.
- Right compact preview/status column for selected item.

On mobile, collapse to:

- Toolbar.
- List.
- Editor below selected item.

## Quality Bar

The final design should:

- Look credible as a production CMS.
- Make Vietnamese text readable and properly encoded.
- Keep repeated admin tasks fast.
- Make errors obvious and actionable.
- Support long content forms without feeling chaotic.
- Work on desktop first, with graceful tablet/mobile behavior.

