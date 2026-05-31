# Sắc Cố Đô - Journey & AR Check-in Design Brief

## Context

Sắc Cố Đô is a mobile-first tourism passport experience for 6 cultural destinations in Ninh Bình. Visitors buy/activate a physical pop-up passport, travel through the 6 stations, scan a QR code at each place, open an AR guide, listen to a short introduction, then stamp their digital passport.

The AR model already works on mobile. The current priority is to redesign the Journey and Check-in flow so it feels clear, premium, and easy for tourists to use outdoors.

## Product Goal

Create a simple tourist flow:

1. Visitor opens the journey map.
2. Visitor chooses one of 6 stations or scans the station QR.
3. Visitor enters the station check-in page.
4. Visitor starts the AR experience.
5. Visitor opens native AR and scans the floor.
6. Virtual guide appears on the ground.
7. Visitor plays the guide narration.
8. Visitor stamps the digital passport.
9. Station becomes completed in their passport progress.

## Target Devices

- Primary: mobile phones.
- Android Chrome: WebXR / Scene Viewer flow.
- iPhone Safari: Quick Look flow via USDZ.
- Desktop: preview only, not true floor tracking.

Important UX note: the in-page camera/model preview is not true floor tracking. True ground placement happens only after opening native AR through the main AR button on a secure HTTPS URL.

## Main Routes

- Journey map: `/hanh-trinh`
- Station check-in: `/checkin/trang-an`
- Station check-in: `/checkin/hoa-lu`
- Station check-in: `/checkin/bai-dinh`
- Station check-in: `/checkin/pho-co-hoa-lu`
- Station check-in: `/checkin/tam-coc`
- Station check-in: `/checkin/hang-mua`
- User passport/progress: `/cua-toi`

## The 6 Stations

### 1. Tràng An

- Theme: river, limestone mountains, heritage landscape.
- Stamp: Dấu sóng đá vôi.
- Mood: grand, calm, scenic, first destination energy.

### 2. Cố Đô Hoa Lư

- Theme: ancient capital, history, temples, dynasties.
- Stamp: Dấu cổng thành.
- Mood: ceremonial, historic, respectful.

### 3. Chùa Bái Đính

- Theme: spirituality, bells, large temple complex.
- Stamp: Dấu chuông đồng.
- Mood: peaceful, sacred, spacious.

### 4. Phố Cổ Hoa Lư

- Theme: lanterns, night street, old-town atmosphere.
- Stamp: Dấu đèn phố.
- Mood: warm, festive, photogenic.

### 5. Tam Cốc - Bích Động

- Theme: boat ride, rice fields, caves, river landscape.
- Stamp: Dấu thuyền lúa.
- Mood: poetic, soft, natural.

### 6. Hang Múa

- Theme: viewpoint, dragon mountain, final climb.
- Stamp: Dấu long đỉnh.
- Mood: energetic, achievement, final station.

## Journey Page UX

The Journey page should help visitors understand where to go and what to do next.

### Content Needed

- Header/title: “Bản đồ 6 trạm văn hóa Ninh Bình”.
- Short description: “Đi qua từng trạm, quét QR, mở AR, nghe hướng dẫn viên ảo và đóng dấu passport số.”
- A 6-station grid or map-like timeline.
- Each station card should show:
  - Station image.
  - Station name.
  - Short tag/theme.
  - Opening hours.
  - Stamp name.
  - Clear CTA: “Mở check-in” or “Quét QR / mở AR”.
- Completed stations should have a visible stamp/check state.
- Locked or not-yet-visited stations can remain normal, but should still be scannable if user is physically there.

### Desired Feel

- Not a marketing landing page.
- More like a beautiful travel passport dashboard.
- Fast to scan outdoors.
- Big tap targets.
- Strong visual distinction between completed and not completed.
- Avoid dense paragraphs.

## Station Check-in Page UX

This page appears after the visitor scans a QR code or chooses a station.

### Primary Purpose

Make the visitor confident that they are at the right station and guide them into AR.

### Layout

- Top: station identity and image.
- Middle: short explanation of what will happen.
- Main action: “Mở trải nghiệm AR”.
- Secondary fallback: manual daily code input.
- Completed state: show stamp overlay and button to view passport.

### Suggested Screen Sections

1. Station hero card:
   - Station image.
   - Station name.
   - Tag/theme.
   - Opening hours.
   - Stamp name.

2. AR instruction panel:
   - Step 1: “Mở AR”.
   - Step 2: “Lia camera xuống nền phẳng”.
   - Step 3: “Chạm để đặt hướng dẫn viên ảo”.
   - Step 4: “Nghe thuyết minh và đóng dấu”.

3. Main CTA:
   - Text: “Mở trải nghiệm AR”.
   - Should be the most visible button.

4. Manual fallback:
   - Label: “Không mở được AR?”
   - Input: “Nhập mã ngày tại quầy”.
   - Button: “Đóng dấu”.
   - This should be secondary, visually quieter.

## AR Viewer UX

The AR viewer has two modes:

### Preview Mode

This is the in-page screen with camera preview and 3D model. It helps users see the model and read controls, but it does not track the ground.

Preview mode should clearly communicate:

- “Đây là màn xem trước.”
- “Để nhân vật đứng dưới đất, hãy bấm Mở AR thật.”
- If not HTTPS: “AR tracking cần HTTPS. Hãy mở bằng link HTTPS.”

### Native AR Mode

This launches the phone’s AR system.

User action:

1. Tap “Mở AR thật để track mặt đất”.
2. Phone opens WebXR / Scene Viewer / Quick Look.
3. User scans the floor.
4. User taps to place the model.
5. User returns to the web page to play narration and stamp passport if needed.

### AR Viewer Controls

Controls should be in a bottom sheet:

- Primary button: “Mở AR thật để track mặt đất”.
- Narration button: “Phát thuyết minh”.
- Stamp button: “Đóng dấu passport số”.
- Music mute button can be small.
- Close button at top right.

### Important UI States

- Camera permission denied.
- HTTP / insecure context.
- Model file missing.
- AR unsupported.
- AR launching.
- Narration playing.
- Stamp success.

## Copy Suggestions

### Check-in CTA

“Mở trải nghiệm AR”

### AR Primary Button

“Mở AR thật để track mặt đất”

### AR Helper Text

“Lia camera xuống nền phẳng. Khi hệ thống nhận diện mặt đất, chạm để đặt hướng dẫn viên ảo.”

### Insecure Context Warning

“AR tracking cần HTTPS. Link HTTP nội bộ chỉ dùng để xem preview.”

### Stamp Success

“Đóng dấu thành công! Trạm này đã được ghi vào passport số của bạn.”

### Completed State

“Bạn đã nhận dấu mốc tại trạm này.”

## Visual Direction

- Premium cultural tourism, not gaming-heavy.
- Mobile-first, outdoor-readable, high contrast.
- Use Ninh Bình heritage colors: deep green, jade/teal, warm gold, red stamp accent, paper/off-white background.
- Buttons must be large and obvious.
- Avoid too many decorative cards nested inside each other.
- Station cards can feel like passport pages or stamp collection tiles.
- AR viewer should feel more like a camera tool than a normal web page.

## Design Priorities

1. Make the correct next action obvious.
2. Distinguish preview mode from true AR mode.
3. Make the 6-station journey easy to scan.
4. Make completed stamps satisfying and visible.
5. Keep text short for tourists using phones outdoors.

## Technical Notes For Designer

- Main GLB path: `/ar/sac-co-do-guide.glb`.
- Optional iPhone USDZ path: `/ar/sac-co-do-guide.usdz`.
- True AR requires HTTPS on mobile.
- Desktop does not provide real floor tracking.
- QR codes should point directly to station URLs like `/checkin/trang-an`.

