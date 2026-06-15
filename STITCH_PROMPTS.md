# Stitch Prompts - Sắc Cố Đô

File này gom toàn bộ prompt để đưa qua Stitch dựng giao diện, sau đó chuyển tiếp qua Figma. Các prompt bên dưới bám theo giao diện live hiện tại của `saccodo.com`, đặc biệt là font, màu, tinh thần thương hiệu và nội dung 8 trang cần thiết kế.

## 0. Design System Chung

```text
Thiết kế website Sắc Cố Đô theo đúng tinh thần giao diện hiện tại của saccodo.com: du lịch văn hóa Ninh Bình, passport trải nghiệm, dấu mộc, bản đồ hành trình, AR guide, sản phẩm lưu niệm.

Font chữ:
- Font nhận diện chính cho headline, hero title, section title, card title lớn: Baloo 2, weight 700-900.
- Font body, mô tả, navigation, button, form, thông tin phụ: Be Vietnam Pro, weight 400-700.
- Font display/accent thương hiệu nếu cần: Faltura, dùng tiết chế cho các chi tiết trang trí hoặc brand moment.
- Một số đoạn quote hoặc copy cảm xúc có thể dùng Georgia / Times New Roman như site hiện tại, nhưng không lạm dụng.
- Không tự thêm font mới ngoài Baloo 2, Be Vietnam Pro, Faltura, Georgia.
- Tất cả text tiếng Việt phải hiển thị đúng dấu.

Màu sắc bám theo website hiện tại:
- Paper / nền giấy xanh nhạt: #f6fbf4
- Paper 2 / nền phụ: #eef8ea
- Ink / chữ chính xanh mực: #063e43
- Muted / chữ phụ: #4c777c
- Brand green / xanh thương hiệu: #104c27
- Brand red-brown / đỏ nâu dấu mộc: #92330a
- Accent gold / vàng cổ: #f3c977
- Cream / kem passport: #fff0cf
- Border line: rgba(23, 97, 51, 0.18)
- Shadow xanh nhẹ: rgba(23, 97, 51, 0.14)

Cách dùng màu:
- Header dùng nền trắng/xanh giấy mờ, blur nhẹ, border xanh nhạt.
- Footer dùng xanh thương hiệu đậm, chữ trắng/kem.
- CTA chính dùng xanh #104c27 hoặc vàng #f3c977.
- Dấu mộc, trạng thái completed, stamp, điểm nhấn văn hóa dùng #92330a.
- Card dùng nền trắng ấm hoặc kem passport, border mảnh, shadow xanh nhẹ.
- Không dùng gradient tím, neon, xanh điện tử hoặc phong cách SaaS quá hiện đại.

UI style:
- Premium heritage nhưng thân thiện, không quá game.
- Desktop rộng, nhiều khoảng thở; mobile ưu tiên dễ đọc, nút lớn, thao tác rõ.
- Border radius card khoảng 18-24px giống site hiện tại.
- Button bo tròn mềm, có hover rõ.
- Ảnh địa điểm phải lớn, sáng, rõ, không blur/tối quá.
- Có motif passport, dấu mộc, route line, marker bản đồ, giấy hành trình.
- Không lồng quá nhiều card trong card.

Header:
- Sticky header.
- Logo Sắc Cố Đô bên trái.
- Navigation: Trang chủ, Hành trình, Hộ Chiếu, Sản phẩm, Giới thiệu, Kích hoạt.
- Có icon search, ngôn ngữ/thông tin, giỏ hàng, đăng nhập.
- Khi hover/click mục Trang chủ hoặc khu vực địa điểm, hiện dropdown 6 địa điểm:
  Tràng An, Cố đô Hoa Lư, Chùa Bái Đính, Phố cổ Hoa Lư, Tam Cốc - Bích Động, Hang Múa.
- Click từng địa điểm mở trang chi tiết riêng.

Footer:
- Logo hoặc tên Sắc Cố Đô.
- Mô tả ngắn: Pop-up passport Ninh Bình.
- Thông tin liên hệ:
  Địa chỉ: Ninh Bình, Việt Nam
  Số điện thoại: 09xx xxx xxx
  Email: contact@saccodo.vn
- Mạng xã hội: Facebook, Instagram, TikTok, YouTube.
- Link nhanh dạng hyperlink: Trang chủ, Hành trình, Hộ Chiếu, Sản phẩm, Kích hoạt, Giới thiệu, Liên hệ.
- Copyright: © 2026 Sắc Cố Đô. All rights reserved.
```

## 1. Prompt Tổng 8 Trang

```text
Tạo bộ UI gồm 8 trang cho website Sắc Cố Đô:
1. Trang chủ
2. Trang hành trình / bản đồ 6 điểm
3. Trang chi tiết Tràng An
4. Trang chi tiết Cố đô Hoa Lư
5. Trang chi tiết Chùa Bái Đính
6. Trang chi tiết Phố cổ Hoa Lư
7. Trang chi tiết Tam Cốc - Bích Động
8. Trang chi tiết Hang Múa

Áp dụng design system đã mô tả: headline dùng Baloo 2, body/UI dùng Be Vietnam Pro, màu xanh thương hiệu #104c27, xanh mực #063e43, nền giấy #f6fbf4, vàng #f3c977, đỏ nâu dấu mộc #92330a.

Mục tiêu:
- Website phải có sản phẩm và 6 địa điểm.
- Thiết kế phải phù hợp để đưa qua Figma.
- Giao diện premium heritage, hiện đại, văn hóa Ninh Bình, passport/check-in/AR.
- Không làm landing page chung chung; mỗi trang phải là một màn hình usable, rõ nội dung, rõ CTA.

Yêu cầu chung:
- Header sticky có dropdown 6 địa điểm.
- Footer đầy đủ thông tin liên lạc, mạng xã hội, địa chỉ, số điện thoại, email, copyright và hyperlink.
- Mỗi trang chi tiết địa điểm có nút “Phát thuyết minh”.
- Trang hành trình có bản đồ 6 điểm theo mẫu mới.
- Trang chủ có giới thiệu sơ qua 6 địa điểm, sản phẩm, và section “Một hành trình đủ nhẹ để chơi, đủ sâu để nhớ” được design lại.
- Nút “Xem video” và “Khám phá ngay” ở trang chủ có trạng thái switch qua lại giữa video và ảnh.
- Cuối trang chủ có loop carousel hình ảnh/nhân vật/địa điểm theo ý Lương.
- Có nhân vật Nibi/guide xuất hiện như trợ lý nhỏ, hướng dẫn hành trình và AR.
```

## 2. Trang Chủ

```text
Thiết kế trang chủ Sắc Cố Đô.

Header:
- Sticky header theo design system.
- Logo Sắc Cố Đô bên trái.
- Menu gồm Trang chủ, Hành trình, Hộ Chiếu, Sản phẩm, Giới thiệu, Kích hoạt.
- Hover/click menu địa điểm mở dropdown 6 địa điểm.

Hero:
- Bố cục 2 cột.
- Một bên là ảnh/video lớn về passport Sắc Cố Đô hoặc Tràng An/Ninh Bình.
- Một bên là text:
  Eyebrow: Di sản nghìn năm
  H1: Sắc Cố Đô
  Description: Khám phá vẻ đẹp tiềm ẩn của Ninh Bình thông qua công nghệ AR, passport hành trình và những dấu mộc văn hóa.
- CTA chính: Khám phá ngay.
- CTA phụ: Xem video giới thiệu.
- Hai CTA có thể switch trạng thái hero giữa ảnh và video: bấm Xem video thì khung visual chuyển sang video, bấm Khám phá ngay hoặc tab ảnh thì quay lại ảnh/cover.

Section giới thiệu 6 địa điểm:
- Title: Khám phá 6 điểm văn hóa Ninh Bình
- Mô tả ngắn: Mỗi điểm đến là một câu chuyện, một dấu mộc và một trải nghiệm check-in riêng.
- Hiển thị 6 card ngang hoặc grid 3x2.
- Mỗi card có ảnh thật, tên địa điểm, tag, mô tả ngắn, nút “Tìm hiểu thêm”.
- 6 điểm:
  1. Tràng An - Non nước di sản, hang động và sông xanh.
  2. Cố đô Hoa Lư - Kinh đô xưa, dấu ấn triều đại Đinh - Lê.
  3. Chùa Bái Đính - Không gian tâm linh rộng lớn và thanh tịnh.
  4. Phố cổ Hoa Lư - Đèn lồng, phố đêm, check-in văn hóa.
  5. Tam Cốc - Bích Động - Sông Ngô Đồng, đồng lúa, hang động.
  6. Hang Múa - Điểm ngắm toàn cảnh, thử thách cuối hành trình.

Design lại section:
Title: Một hành trình đủ nhẹ để chơi, đủ sâu để nhớ
- Không dùng layout 3 card cũ y nguyên.
- Làm thành timeline / route cards / passport flow.
- 3 bước:
  1. Nhận passport
  2. Đi qua 6 trạm
  3. Quét QR, mở AR, đóng dấu
- Có Nibi/guide nhỏ đứng bên cạnh hoặc nằm trong một bubble hướng dẫn.
- Cảm giác dễ hiểu, có route line, số bước, dấu mộc.

Section sản phẩm:
- Title: Sản phẩm đồng hành
- Hiển thị ít nhất 6 sản phẩm:
  1. Sổ Passport Sắc Cố Đô
  2. Combo Đồng Hành
  3. Hộp Quà Sắc Cố Đô
  4. Bộ Sticker Dấu Mộc
  5. Postcard 6 Điểm Di Sản
  6. Túi Tote Sắc Cố Đô
- Mỗi card có ảnh/mockup, giá, badge, mô tả ngắn, CTA “Xem chi tiết”.

Cuối trang:
- Loop carousel / image ticker chạy lặp nhẹ.
- Nội dung loop gồm ảnh địa điểm, sản phẩm, dấu mộc, Nibi, passport.
- Tùy chỉnh theo ý Lương: sống động, vui vừa đủ, vẫn premium.

Footer:
- Đầy đủ thông tin liên hệ, mạng xã hội, link nhanh, copyright.
```

## 3. Trang Hành Trình

```text
Thiết kế trang “Hành trình 6 điểm”.

Mục tiêu:
- Đây là trang bản đồ/check-in chính.
- Người dùng nhìn vào là hiểu phải đi qua 6 điểm, quét QR, mở AR và đóng dấu passport.

Hero:
- Eyebrow: Hành trình văn hóa
- H1: Bản đồ 6 trạm văn hóa Ninh Bình
- Description: Đi qua từng trạm, quét QR, mở AR, nghe thuyết minh và đóng dấu passport số.
- CTA: Bắt đầu hành trình

Bản đồ:
- Sửa bản đồ theo mẫu mới.
- Bản đồ dạng minh họa trên giấy passport, có đường route line nối 6 điểm.
- Mỗi điểm là marker có số thứ tự, tên địa điểm, icon dấu mộc.
- Khi hover/click marker, hiện card nhỏ với ảnh, tên, mô tả, nút “Mở địa điểm”.
- Thứ tự:
  1. Tràng An
  2. Cố đô Hoa Lư
  3. Chùa Bái Đính
  4. Phố cổ Hoa Lư
  5. Tam Cốc - Bích Động
  6. Hang Múa

Section hướng dẫn:
- 4 bước:
  1. Nhận passport
  2. Đến địa điểm
  3. Quét QR / mở AR
  4. Đóng dấu và lưu tiến trình

Section tiến độ:
- Hiển thị 6 stamp slot.
- Slot chưa hoàn thành là outline.
- Slot hoàn thành là dấu đỏ nâu #92330a.
- Có text “0/6 trạm hoàn thành” hoặc trạng thái tương tự.

Nibi guide:
- Có một khung hướng dẫn với Nibi:
  “Nibi sẽ đồng hành cùng bạn tại mỗi điểm đến. Hãy mở AR, nghe thuyết minh và nhận dấu mộc.”

Footer đầy đủ.
```

## 4. Trang Chi Tiết Tràng An

```text
Thiết kế trang chi tiết địa điểm Tràng An.

Hero:
- Ảnh lớn Tràng An: sông, núi đá vôi, thuyền.
- Eyebrow: Trạm 01
- H1: Tràng An
- Badge: Di sản non nước
- Mô tả: Tràng An mở đầu hành trình bằng vẻ đẹp sông núi hùng vĩ, hang động xuyên thủy và những lớp di sản ngàn năm.
- CTA chính: Mở check-in
- CTA phụ: Phát thuyết minh

Nội dung:
- Section “Câu chuyện địa điểm”:
  Tràng An là không gian di sản với núi đá vôi, dòng nước xanh và những hang động tự nhiên. Đây là điểm mở đầu lý tưởng để người dùng bắt đầu cuốn passport Sắc Cố Đô.
- Section “Dấu mộc tại đây”:
  Tên dấu: Dấu sóng đá vôi
  Mô tả: Một dấu mộc gợi hình dòng sông và khối núi đá vôi đặc trưng.
- Section “Trải nghiệm AR”:
  Nibi/guide xuất hiện, hướng dẫn người dùng mở AR, nghe thuyết minh, đóng dấu.
- Section gallery ảnh Tràng An.
- Section địa điểm tiếp theo:
  Gợi ý Cố đô Hoa Lư.

Footer đầy đủ.
```

## 5. Trang Chi Tiết Cố Đô Hoa Lư

```text
Thiết kế trang chi tiết Cố đô Hoa Lư.

Hero:
- Ảnh đền, cổng thành, kiến trúc cổ.
- Eyebrow: Trạm 02
- H1: Cố đô Hoa Lư
- Badge: Kinh đô xưa
- Mô tả: Hoa Lư là nơi lưu giữ dấu ấn triều đại Đinh - Lê, mở ra chiều sâu lịch sử cho hành trình Sắc Cố Đô.
- CTA chính: Mở check-in
- CTA phụ: Phát thuyết minh

Nội dung:
- Section “Câu chuyện địa điểm”:
  Cố đô Hoa Lư gợi nhớ về kinh đô đầu tiên, thành cổ, đền vua Đinh - vua Lê và những lớp lịch sử còn hiện diện trong không gian di tích.
- Section “Dấu mộc tại đây”:
  Tên dấu: Dấu cổng thành
  Mô tả: Dấu mộc đại diện cho cánh cổng lịch sử mở vào vùng đất cố đô.
- Section “Góc khám phá”:
  3 card nhỏ:
  1. Cổng thành xưa
  2. Đền vua Đinh
  3. Đền vua Lê
- Section AR với Nibi hướng dẫn.
- Gallery ảnh.
- Gợi ý địa điểm tiếp theo: Chùa Bái Đính.

Footer đầy đủ.
```

## 6. Trang Chi Tiết Chùa Bái Đính

```text
Thiết kế trang chi tiết Chùa Bái Đính.

Hero:
- Ảnh chùa rộng, tượng Phật, hành lang La Hán hoặc tháp chuông.
- Eyebrow: Trạm 03
- H1: Chùa Bái Đính
- Badge: Tâm linh hội tụ
- Mô tả: Bái Đính mang đến khoảng lặng thanh tịnh giữa hành trình, nơi âm chuông và không gian rộng mở tạo nên dấu ấn tâm linh.
- CTA chính: Mở check-in
- CTA phụ: Phát thuyết minh

Nội dung:
- Section “Câu chuyện địa điểm”:
  Bái Đính là không gian tâm linh rộng lớn, nơi người đi có thể chậm lại, lắng nghe tiếng chuông và cảm nhận sự bình an trong hành trình.
- Section “Dấu mộc tại đây”:
  Tên dấu: Dấu chuông đồng
  Mô tả: Dấu mộc tượng trưng cho âm vang thanh tịnh và may mắn.
- Section “Trải nghiệm nên thử”:
  3 card:
  1. Hành lang La Hán
  2. Tháp chuông
  3. Điện Tam Thế
- Section AR với Nibi.
- Gallery ảnh.
- Gợi ý địa điểm tiếp theo: Phố cổ Hoa Lư.

Footer đầy đủ.
```

## 7. Trang Chi Tiết Phố Cổ Hoa Lư

```text
Thiết kế trang chi tiết Phố cổ Hoa Lư.

Hero:
- Ảnh phố đêm, đèn lồng, mặt nước phản chiếu.
- Eyebrow: Trạm 04
- H1: Phố cổ Hoa Lư
- Badge: Đêm phố di sản
- Mô tả: Phố cổ Hoa Lư là điểm dừng rực rỡ ánh đèn, phù hợp để check-in, chụp ảnh và lưu lại ký ức văn hóa về đêm.
- CTA chính: Mở check-in
- CTA phụ: Phát thuyết minh

Nội dung:
- Section “Câu chuyện địa điểm”:
  Phố cổ Hoa Lư mang sắc màu đèn lồng, không gian đi bộ và nhịp dạo chơi về đêm, tạo một trạm trải nghiệm giàu cảm xúc và hình ảnh.
- Section “Dấu mộc tại đây”:
  Tên dấu: Dấu đèn phố
  Mô tả: Dấu mộc ghi lại sắc đèn, mặt nước và không khí lễ hội của phố đêm.
- Section “Photobooth”:
  Nhấn mạnh chụp ảnh, chia sẻ, lưu kỷ niệm.
- Section AR với Nibi.
- Gallery ảnh phố đêm.
- Gợi ý địa điểm tiếp theo: Tam Cốc - Bích Động.

Footer đầy đủ.
```

## 8. Trang Chi Tiết Tam Cốc - Bích Động

```text
Thiết kế trang chi tiết Tam Cốc - Bích Động.

Hero:
- Ảnh thuyền trên sông, đồng lúa, núi đá.
- Eyebrow: Trạm 05
- H1: Tam Cốc - Bích Động
- Badge: Sông núi nên thơ
- Mô tả: Tam Cốc - Bích Động đưa người xem vào khung cảnh mềm mại của sông Ngô Đồng, đồng lúa và những hang động tự nhiên.
- CTA chính: Mở check-in
- CTA phụ: Phát thuyết minh

Nội dung:
- Section “Câu chuyện địa điểm”:
  Tam Cốc - Bích Động là lát cắt mềm mại của Ninh Bình, nơi dòng sông, đồng lúa và núi đá tạo nên một hành trình chậm rãi, nên thơ.
- Section “Dấu mộc tại đây”:
  Tên dấu: Dấu thuyền lúa
  Mô tả: Dấu mộc gợi hình thuyền, sông và mùa lúa vàng.
- Section “Khoảnh khắc nên lưu”:
  3 card:
  1. Bến thuyền
  2. Đồng lúa
  3. Hang động
- Section AR với Nibi.
- Gallery ảnh.
- Gợi ý địa điểm tiếp theo: Hang Múa.

Footer đầy đủ.
```

## 9. Trang Chi Tiết Hang Múa

```text
Thiết kế trang chi tiết Hang Múa.

Hero:
- Ảnh view từ đỉnh Hang Múa, rồng đá, toàn cảnh Tam Cốc.
- Eyebrow: Trạm 06
- H1: Hang Múa
- Badge: Đỉnh nhìn di sản
- Mô tả: Hang Múa là trạm kết giàu năng lượng, nơi người đi hoàn thành thử thách và nhìn lại toàn cảnh hành trình từ trên cao.
- CTA chính: Mở check-in
- CTA phụ: Phát thuyết minh

Nội dung:
- Section “Câu chuyện địa điểm”:
  Hang Múa là điểm kết của hành trình, nổi bật với bậc đá, tượng rồng và góc nhìn toàn cảnh xuống vùng sông núi Ninh Bình.
- Section “Dấu mộc tại đây”:
  Tên dấu: Dấu long đỉnh
  Mô tả: Dấu mộc cuối cùng, tượng trưng cho thành tựu hoàn thành hành trình.
- Section “Hoàn thành hành trình”:
  Hiển thị 6 dấu mộc, nhấn mạnh đây là điểm kết thúc.
- Section AR với Nibi chúc mừng.
- Gallery ảnh.
- CTA cuối:
  1. Xem hộ chiếu của tôi
  2. Nhận phần thưởng

Footer đầy đủ.
```

## 10. Prompt Ngắn Dán Một Lần

```text
Tạo bộ UI 8 trang cho website Sắc Cố Đô gồm: Trang chủ, Trang hành trình, và 6 trang chi tiết địa điểm Tràng An, Cố đô Hoa Lư, Chùa Bái Đính, Phố cổ Hoa Lư, Tam Cốc - Bích Động, Hang Múa.

Thiết kế bám theo saccodo.com hiện tại: headline dùng Baloo 2, body/UI dùng Be Vietnam Pro, accent có thể dùng Faltura hoặc Georgia rất tiết chế. Màu chính gồm xanh thương hiệu #104c27, xanh mực #063e43, nền giấy #f6fbf4, nền phụ #eef8ea, vàng #f3c977, đỏ nâu dấu mộc #92330a, kem passport #fff0cf.

Phong cách premium heritage Ninh Bình, passport văn hóa, dấu mộc, bản đồ hành trình, AR guide. Header sticky có logo, navigation, dropdown 6 địa điểm khi hover/click. Footer có thông tin liên hệ, mạng xã hội, địa chỉ, số điện thoại, email, copyright và hyperlink.

Trang chủ có hero 2 cột, một bên ảnh/video, một bên text, nút “Khám phá ngay” và “Xem video” có thể switch qua lại giữa video và ảnh. Có section giới thiệu 6 địa điểm bằng card ngang/grid, section sản phẩm gồm ít nhất 6 sản phẩm, và redesign section “Một hành trình đủ nhẹ để chơi, đủ sâu để nhớ”. Cuối trang có loop carousel hình ảnh/Nibi/sản phẩm/địa điểm.

Trang hành trình có bản đồ 6 điểm theo mẫu mới, marker từng địa điểm, tiến độ 6 dấu mộc, hướng dẫn quét QR - mở AR - đóng dấu.

Mỗi trang chi tiết địa điểm có hero ảnh lớn, tên địa điểm, mô tả, nút “Mở check-in”, nút “Phát thuyết minh”, section câu chuyện địa điểm, dấu mộc riêng, gallery, trải nghiệm AR với Nibi guide, và gợi ý địa điểm tiếp theo.
```
