# HR & Office Management — Next.js + Supabase (Netlify)

1. Supabase: create project → SQL Editor → run `../01_supabase_schema.sql`.
   Auth > Providers: enable Email. Promote your first account to director (last line of the SQL).
2. Download face models: copy the `weights/` files of face-api.js
   (tiny_face_detector_model-*) into `public/models/`.
3. `cp .env.example .env.local`, fill values, `npm i && npm run dev`.
4. Netlify: New site from Git → add the same env vars → deploy (netlify.toml included).
5. Android APK: point your WebView shell to the Netlify URL; enable
   `setJavaScriptEnabled`, `setGeolocationEnabled`, and grant CAMERA + ACCESS_FINE_LOCATION
   in `WebChromeClient.onPermissionRequest` / `onGeolocationPermissionsShowPrompt`. HTTPS is required for camera.
