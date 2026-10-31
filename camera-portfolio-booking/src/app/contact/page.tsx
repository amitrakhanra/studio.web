import type { Metadata } from 'next';
import Link from 'next/link';
import { Phone, MessageCircle, Mail } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Reveal from '@/components/Reveal';
import CopyButton from '@/components/CopyButton';
import { CONTACT } from '@/lib/contact';

export const metadata: Metadata = {
  title: 'Contact | Camera Works & Shoot Booking',
  description: 'Call, WhatsApp or email us to plan your shoot.',
};

export default function ContactPage() {
  const brand = process.env.NEXT_PUBLIC_OWNER_NAME || 'FrameStudio';
  const waLink = `https://wa.me/${CONTACT.whatsappNumber}?text=${encodeURIComponent(
    'Hi, I would like to ask about a shoot.'
  )}`;

  const cards = [
    {
      icon: Phone,
      title: 'Call',
      note: 'Talk to us directly about your shoot.',
      value: CONTACT.phoneDisplay,
      copy: CONTACT.phoneDisplay,
      href: `tel:${CONTACT.phoneHref}`,
      action: 'Call now',
      external: false,
    },
    {
      icon: MessageCircle,
      title: 'WhatsApp',
      note: 'Send your package and preferred date.',
      value: CONTACT.whatsappDisplay,
      copy: CONTACT.whatsappDisplay,
      href: waLink,
      action: 'Open WhatsApp',
      external: true,
    },
    {
      icon: Mail,
      title: 'Email',
      note: 'Share details, questions or enquiries.',
      value: CONTACT.email,
      copy: CONTACT.email,
      href: `mailto:${CONTACT.email}`,
      action: 'Send an email',
      external: false,
    },
  ];

  return (
    <>
      <Navbar />
      <main className="max-w-6xl mx-auto px-6 py-14 md:py-20">
        <div className="max-w-2xl mb-12 animate-fade-up">
          <h1 className="font-display text-4xl md:text-6xl tracking-tight leading-[1.05]">Let&apos;s plan your shoot</h1>
          <p className="mt-5 text-base md:text-lg text-mute leading-relaxed">
            Reach us the way that suits you. To reserve a date, pick a package and book it online.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {cards.map((c, i) => (
            <Reveal key={c.title} delay={i * 90} className="h-full">
              <div className="group relative h-full overflow-hidden rounded-2xl border border-line bg-panel/70 p-6 flex flex-col justify-between transition duration-500 hover:-translate-y-1 hover:border-tungsten/40">
                <div
                  className="pointer-events-none absolute -top-16 -right-16 h-44 w-44 rounded-full bg-tungsten/20 blur-3xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                  aria-hidden="true"
                />
                <div className="relative">
                  <c.icon className="w-6 h-6 text-tungsten mb-4" />
                  <h2 className="font-display text-xl text-ivory">{c.title}</h2>
                  <p className="text-sm text-mute mt-1 mb-5">{c.note}</p>
                  <p className="text-ivory text-lg break-all select-all">{c.value}</p>
                  <div className="mt-2">
                    <CopyButton text={c.copy} label={c.title.toLowerCase()} />
                  </div>
                </div>
                <a
                  href={c.href}
                  {...(c.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                  className="relative mt-6 w-full rounded-xl bg-ivory text-ink font-semibold text-sm py-3 text-center transition hover:bg-tungsten"
                >
                  {c.action}
                </a>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal>
          <div className="mt-14 flex flex-wrap items-center gap-4 text-sm">
            <Link
              href="/#services"
              className="rounded-full bg-gradient-to-r from-tungsten to-orange-400 px-6 py-3 font-semibold text-ink hover:brightness-110 transition"
            >
              See packages and book a date
            </Link>
            <Link href="/" className="text-mute hover:text-ivory transition-colors">
              Back to home
            </Link>
          </div>
        </Reveal>

        <footer className="border-t border-line mt-20 py-8 text-center text-xs text-mute">
          © {new Date().getFullYear()} {brand}. All rights reserved.
        </footer>
      </main>
    </>
  );
}
