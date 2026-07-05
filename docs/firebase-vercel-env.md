# Firebase + Vercel Environment Setup

## Local development

1. Copy `.env.example` to `.env.local`.
2. Fill the `NEXT_PUBLIC_FIREBASE_*` values from Firebase Console.
3. Fill the `NEXT_PUBLIC_CLOUDINARY_*` values from Cloudinary.
4. Restart `npm run dev` after changing env values.

## Vercel

Add these variables in **Vercel Project Settings > Environment Variables** for Production, Preview, and Development:

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` optional
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_FIREBASE_USE_EMULATOR`
- `NEXT_PUBLIC_ADMIN_EMAIL`
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
- `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`
- `SEPAY_ENV`
- `SEPAY_MERCHANT_ID`
- `SEPAY_SECRET_KEY`
- `SEPAY_IPN_SECRET_KEY` optional, defaults to `SEPAY_SECRET_KEY`
- `SEPAY_APP_URL`
- `SEPAY_PAYMENT_METHOD`

Use `NEXT_PUBLIC_FIREBASE_USE_EMULATOR=false` on Vercel.

## Firebase Console checklist

- Enable Authentication providers: Email/Password and Google.
- Create Firestore Database.
- Add the deployed Vercel domain to Authentication > Settings > Authorized domains.
- Add the local dev domain if needed: `localhost`.

## Auth model

- Customers use `/dang-nhap`.
- Customer login supports Email/Password and Google.
- Admin uses the same Firebase Auth project, but only the fixed admin account should receive an `adminUsers/{uid}` document.

## Admin seed

`npm run firebase:seed` uses Firebase Admin SDK, so it needs service account credentials when Firestore rules are in production mode.

Set one of:

- `FIREBASE_SERVICE_ACCOUNT_BASE64`
- `FIREBASE_SERVICE_ACCOUNT_JSON`

For the fixed admin account, set either:

- `FIREBASE_ADMIN_UID` if the Auth user already exists, or
- `FIREBASE_ADMIN_EMAIL` + `FIREBASE_ADMIN_PASSWORD` to let the seed script create/reuse that Auth user and write `adminUsers/{uid}`.

After changing `.env.local`, restart `npm run dev` because Next reads env at server startup.

## Cloudinary checklist

- Create a Cloudinary account.
- Copy the Cloud name into `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`.
- Create an unsigned upload preset.
- Copy the preset name into `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`.
- Allow the preset to upload images and raw files, because product/AR assets can include `.glb` and `.usdz`.

## SePay checklist

- Bat dau voi `SEPAY_ENV=sandbox`.
- Dien `SEPAY_MERCHANT_ID` va `SEPAY_SECRET_KEY` tu dashboard SePay.
- Neu IPN dung secret rieng, dien `SEPAY_IPN_SECRET_KEY`; neu khong co the de trong va dung chung `SEPAY_SECRET_KEY`.
- Dat `SEPAY_APP_URL` la domain public cua app, vi SePay can goi lai duoc IPN va redirect URL.
- Cau hinh IPN URL trong SePay tro toi:
  - `/api/sepay/ipn`
- Checkout return URLs duoc tao tu dong tren server va quay ve:
  - `/cua-toi?order=<orderId>&payment=success|error|cancel`
- Khi test local, can expose app qua public HTTPS tunnel neu muon nhan IPN that.

## Notes

The `NEXT_PUBLIC_*` Firebase web config is safe to expose in browser code. Firestore access control must be enforced with Firebase Auth and Firestore Rules. Cloudinary uploads use an unsigned preset for v1 CMS convenience, so keep that preset scoped to the project folder and use Cloudinary dashboard limits if needed.
