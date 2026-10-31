'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Service, PortfolioItem, Review } from '@/types';
import Navbar from '@/components/Navbar';
import Reveal from '@/components/Reveal';
import PortfolioGrid from '@/components/PortfolioGrid';
import BookingPolicy from '@/components/BookingPolicy';
import BookingModal from '@/components/BookingModal';
import ReviewSection from '@/components/ReviewSection';
import { Calendar, MessageCircle } from 'lucide-react';

export default function Home() {
  const [services, setServices] = useState<Service[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const brand = process.env.NEXT_PUBLIC_OWNER_NAME || 'FrameStudio';
  const whatsapp = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '').replace(/\D/g, '');
  const whatsappLink = whatsapp
    ? `https://wa.me/${whatsapp}?text=${encodeURIComponent('Hi, I would like to know more about your shoot packages.')}`
    : '';

  useEffect(() => {
    const loadData = async () => {
      const [s, p, r] = await Promise.all([
        supabase.from('services').select('*').order('total_price', { ascending: true }),
        supabase.from('portfolio').select('*').order('created_at', { ascending: true }),
        // Only approved reviews (also keeps the owner's own session from showing pending ones)
        supabase.from('reviews').select('*').eq('approved', true).order('created_at', { ascending: false }),
      ]);

      if (s.error || p.error || r.error) setLoadError(true);
      setServices((s.data ?? []) as Service[]);
      setPortfolio((p.data ?? []) as PortfolioItem[]);
      setReviews((r.data ?? []) as Review[]);
      setLoading(false);
    };
    loadData();
  }, []);

  return (
    <>
      <Navbar />

      <main className="max-w-6xl mx-auto px-6">

        {/* Hero (text only) */}
        <section className="max-w-3xl py-16 md:py-28">
          <h1
            className="font-display text-5xl md:text-7xl leading-[1.04] tracking-tight text-ivory animate-fade-up"
            style={{ animationDelay: '0.05s' }}
          >
            Visual Stories &amp; Frames
          </h1>
          <p
            className="mt-6 max-w-lg text-base md:text-lg text-mute leading-relaxed animate-fade-up"
            style={{ animationDelay: '0.25s' }}
          >
            Professional camera shoots. Choose a package, pick an open date, and reserve it with a small UPI advance
            where one applies. We confirm every booking personally.
          </p>
          <div className="mt-8 flex flex-wrap gap-3 animate-fade-up" style={{ animationDelay: '0.45s' }}>
            <a
              href="#services"
              className="rounded-full bg-gradient-to-r from-tungsten to-orange-400 px-6 py-3 text-sm font-semibold text-ink hover:brightness-110 transition"
            >
              See packages
            </a>
            <a
              href="#portfolio"
              className="rounded-full border border-line px-6 py-3 text-sm font-semibold text-ivory hover:border-tungsten/60 transition-colors"
            >
              View portfolio
            </a>
          </div>
        </section>
        {loadError && (
          <div className="mb-8 p-3 text-sm bg-red-500/10 border border-red-500/30 text-red-300 rounded-xl">
            Some content could not be loaded. Refresh the page, or try again in a minute.
          </div>
        )}

        {/* Packages */}
        <section id="services" className="mb-28">
          <Reveal>
            <div className="mb-10">
              <h2 className="font-display text-3xl md:text-4xl tracking-tight">Book your shoot</h2>
              <p className="text-sm text-mute mt-2">Choose a package, then pick a date that is still open.</p>
            </div>
          </Reveal>

          {loading && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6" aria-hidden="true">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-64 rounded-2xl border border-line bg-panel/60 animate-pulse" />
              ))}
            </div>
          )}
          {!loading && services.length === 0 && !loadError && (
            <p className="text-sm text-mute">Packages will be listed here soon.</p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {services.map((svc, i) => (
              <Reveal key={svc.id} delay={i * 90} className="h-full">
                <div className="group relative h-full overflow-hidden rounded-2xl border border-line bg-panel/70 p-6 flex flex-col justify-between transition duration-500 hover:-translate-y-1 hover:border-tungsten/40">
                  <div
                    className="pointer-events-none absolute -top-16 -right-16 h-44 w-44 rounded-full bg-tungsten/20 blur-3xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                    aria-hidden="true"
                  />
                  <div className="relative">
                    <h3 className="font-display text-xl mb-1 text-ivory">{svc.title}</h3>
                    <p className="text-mute text-sm mb-6 leading-relaxed">{svc.description}</p>
                    <div className="font-display text-4xl text-ivory mb-2">₹{svc.total_price}</div>
                    <div className="text-sm text-tungsten mb-6">
                      {svc.advance_amount > 0
                        ? `Advance to reserve your date: ₹${svc.advance_amount}`
                        : 'No advance needed. Request your date for free.'}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedService(svc)}
                    className="relative w-full rounded-xl bg-ivory text-ink font-semibold text-sm py-3 transition hover:bg-tungsten flex items-center justify-center gap-2"
                  >
                    <Calendar className="w-4 h-4" />
                    <span>Book this date</span>
                  </button>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        <PortfolioGrid items={portfolio} />

        <BookingPolicy />

        <ReviewSection initialReviews={reviews} />

        <footer className="border-t border-line py-8 mb-4 text-center text-xs text-mute">
          <Link href="/contact" className="inline-block mb-3 text-sm text-ivory hover:text-tungsten transition-colors">
            Contact us
          </Link>
          <p>© {new Date().getFullYear()} {brand}. All rights reserved.</p>
        </footer>
      </main>

      {whatsappLink && (
        <a
          href={whatsappLink}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Chat on WhatsApp"
          className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-tungsten px-4 py-3 text-xs font-semibold text-ink shadow-[0_0_30px_-4px_rgba(255,179,71,0.6)] hover:brightness-110 transition"
        >
          <MessageCircle className="w-4 h-4" />
          <span>WhatsApp</span>
        </a>
      )}

      {selectedService && (
        <BookingModal service={selectedService} onClose={() => setSelectedService(null)} />
      )}
    </>
  );
}
