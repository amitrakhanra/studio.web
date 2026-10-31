'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PortfolioItem } from '@/types';
import { Camera, Video, Play, X, ChevronLeft, ChevronRight } from 'lucide-react';
import Reveal from '@/components/Reveal';

interface Props {
  items: PortfolioItem[];
}

export default function PortfolioGrid({ items }: Props) {
  // only items that actually have media can be opened in the popup
  const viewable = useMemo(() => items.filter((i) => (i.media_url?.trim() ?? '') !== ''), [items]);
  const [openId, setOpenId] = useState<string | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const idx = openId ? viewable.findIndex((i) => i.id === openId) : -1;
  const current = idx >= 0 ? viewable[idx] : null;

  const go = useCallback(
    (step: number) => {
      if (idx < 0 || viewable.length === 0) return;
      setOpenId(viewable[(idx + step + viewable.length) % viewable.length].id);
    },
    [idx, viewable]
  );

  useEffect(() => {
    if (!current) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenId(null);
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [current, go]);

  return (
    <section id="portfolio" className="mb-28">
      <Reveal>
        <div className="mb-10">
          <h2 className="font-display text-3xl md:text-4xl tracking-tight">Camera works</h2>
          <p className="text-sm text-mute mt-2">Recent shoots and projects. Tap any frame to view it full size.</p>
        </div>
      </Reveal>

      {items.length === 0 && <p className="text-sm text-mute">New work is being added. Check back soon.</p>}

      <div className="columns-1 sm:columns-2 lg:columns-3 gap-5">
        {items.map((item, index) => {
          const url = item.media_url?.trim() ?? '';
          return (
            <Reveal key={item.id || index} delay={(index % 3) * 90} className="mb-5 break-inside-avoid">
              {!url ? (
                <div className="aspect-[4/5] rounded-2xl border border-line bg-panel/60 flex flex-col items-center justify-center p-6 text-center select-none">
                  <div className="w-14 h-14 rounded-full border border-line bg-ink flex items-center justify-center mb-3">
                    {item.media_type === 'video' ? (
                      <Video className="w-6 h-6 text-mute" />
                    ) : (
                      <Camera className="w-6 h-6 text-mute" />
                    )}
                  </div>
                  <span className="text-sm font-semibold text-ivory/80">{item.title || `Work frame ${index + 1}`}</span>
                  <span className="text-xs text-mute mt-1">Coming soon</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setOpenId(item.id)}
                  aria-label={`Open ${item.title}`}
                  className="group relative block w-full overflow-hidden rounded-2xl border border-line bg-panel text-left"
                >
                  {item.media_type === 'video' ? (
                    <video
                      src={url}
                      muted
                      playsInline
                      preload="metadata"
                      className="w-full h-auto transition duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <img
                      src={url}
                      alt={item.title}
                      loading="lazy"
                      className="w-full h-auto transition duration-700 group-hover:scale-105"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                  {item.media_type === 'video' && (
                    <span className="absolute top-3 right-3 rounded-full bg-ink/70 p-2 text-ivory">
                      <Play className="w-4 h-4" />
                    </span>
                  )}
                  <span className="absolute bottom-3 left-4 right-4 text-sm text-ivory opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                    {item.title}
                  </span>
                </button>
              )}
            </Reveal>
          );
        })}
      </div>

      {/* Zoom popup */}
      {current && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={current.title}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-pop"
          onClick={() => setOpenId(null)}
        >
          <button
            ref={closeRef}
            type="button"
            aria-label="Close"
            onClick={(e) => {
              e.stopPropagation();
              setOpenId(null);
            }}
            className="absolute top-4 right-4 rounded-full border border-line bg-panel p-2 text-ivory hover:border-tungsten/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {viewable.length > 1 && (
            <>
              <button
                type="button"
                aria-label="Previous"
                onClick={(e) => {
                  e.stopPropagation();
                  go(-1);
                }}
                className="absolute left-3 md:left-6 rounded-full border border-line bg-panel p-2 text-ivory hover:border-tungsten/60 transition-colors"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                type="button"
                aria-label="Next"
                onClick={(e) => {
                  e.stopPropagation();
                  go(1);
                }}
                className="absolute right-3 md:right-6 rounded-full border border-line bg-panel p-2 text-ivory hover:border-tungsten/60 transition-colors"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}

          <figure className="flex max-h-full max-w-5xl flex-col items-center gap-3" onClick={(e) => e.stopPropagation()}>
            {current.media_type === 'video' ? (
              <video
                key={current.id}
                src={current.media_url ?? ''}
                controls
                autoPlay
                playsInline
                className="max-h-[78vh] max-w-full rounded-xl"
              />
            ) : (
              <img
                key={current.id}
                src={current.media_url ?? ''}
                alt={current.title}
                className="max-h-[78vh] w-auto max-w-full rounded-xl object-contain animate-pop"
              />
            )}
            <figcaption className="text-sm text-mute">
              {current.title}
              {viewable.length > 1 ? `  (${idx + 1} of ${viewable.length})` : ''}
            </figcaption>
          </figure>
        </div>
      )}
    </section>
  );
}
