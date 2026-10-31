import Link from 'next/link';
import { Aperture } from 'lucide-react';

export default function Navbar() {
  const brand = process.env.NEXT_PUBLIC_OWNER_NAME || 'FrameStudio';
  const link = 'hidden sm:inline hover:text-ivory transition-colors';

  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-ink/70 backdrop-blur-md">
      <nav className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 font-display text-lg text-ivory">
          <Aperture className="w-5 h-5 text-tungsten" />
          <span>{brand}</span>
        </Link>

        <div className="flex items-center gap-4 sm:gap-7 text-sm text-mute">
          <Link href="/#services" className={link}>Packages</Link>
          <Link href="/#portfolio" className={link}>Portfolio</Link>
          <Link href="/#reviews" className={link}>Reviews</Link>
          <Link href="/contact" className="hover:text-ivory transition-colors">Contact</Link>
          <Link
            href="/#services"
            className="rounded-full bg-tungsten px-4 py-1.5 text-xs font-semibold text-ink hover:brightness-110 transition"
          >
            Book now
          </Link>
        </div>
      </nav>
    </header>
  );
}
