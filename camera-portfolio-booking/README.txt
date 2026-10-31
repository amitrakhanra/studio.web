CAMERA PORTFOLIO BOOKING - SETUP

1. SUPABASE (one time)
   a) Authentication > turn OFF "Allow new users to sign up".
   b) Authentication > Users > Add user (your owner email + strong password).
   c) SQL Editor > paste ALL of supabase/0_create_tables.sql > Run.
   d) SQL Editor > paste ALL of supabase/1_supabase_setup.sql > Run.
      (Always in this order: 0 first, then 1.)

2. FILL IN .env.local (main folder, next to package.json)
   Replace every placeholder with your real values. No spaces around "=",
   no quotes. Delete the WhatsApp line if you do not want that button.
   Never upload .env.local to GitHub (.gitignore already blocks it).

3. RUN
   npm install
   npm run build
   npm run dev
   Open http://localhost:3000   (owner panel: http://localhost:3000/admin)

4. TEST
   Log in at /admin > add a service > book it from the home page >
   Confirm the booking > upload a photo > post a review and approve it.

5. DEPLOY (Vercel)
   Add the same 5 variables from .env.local in Vercel > Settings >
   Environment Variables, then deploy.

Edit the "Booking Policy" text in src/app/page.tsx to match your rules.
