FULL SOURCE BACKUP - Photography booking and client gallery website
Next.js 14 + Supabase + Tailwind. Backup date: 2026-11-08.

WHAT IS INSIDE
  src/app            pages: home, /book (booking steps), /receipt/[token], /gallery/[token],
                     /contact, /admin, /admin/galleries, and the API routes in src/app/api
  src/components     Navbar, BookingCalendar, BookingPolicy, PortfolioGrid, ReviewSection, ...
  src/lib            settings and helpers (contact.ts = your public phone/email,
                     galleryServer.ts + supabaseAdmin.ts = SERVER ONLY secure code)
  supabase/          the 4 database scripts, run IN ORDER in the Supabase SQL Editor:
                     0_create_tables.sql, 1_supabase_setup.sql, 2_booking_wizard.sql, 3_gallery.sql
                     (never re-run 1_ after 2_)
  env.local.example  the settings you must fill in (see below)

NOT INSIDE ON PURPOSE (keep these safely yourself)
  .env.local         your real keys. Store a copy in a password manager. Never upload it.
  node_modules, .next   rebuilt automatically
  your Supabase data    bookings, reviews, photos live in Supabase, not in this zip

HOW TO RESTORE
  1. Unzip. Open a terminal in the folder that contains package.json.
  2. Create .env.local from env.local.example and fill in your real values.
  3. npm install
  4. npm run build   (checks for errors)   then   npm run dev
  5. New Supabase project? Run the 4 scripts in supabase/ in order, switch off sign-ups,
     and add your owner user (Authentication > Users).

TIP: also keep the project in a PRIVATE GitHub repository. It keeps every version.
