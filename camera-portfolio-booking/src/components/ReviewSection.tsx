'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Review } from '@/types';
import { Star } from 'lucide-react';
import Reveal from '@/components/Reveal';

interface Props {
  initialReviews: Review[];
}

const fieldCls =
  'w-full bg-ink/60 border border-line text-ivory rounded-lg p-2.5 text-sm placeholder:text-mute/60 focus:border-tungsten/60 outline-none transition-colors';

export default function ReviewSection({ initialReviews }: Props) {
  const [clientName, setClientName] = useState('');
  const [comment, setComment] = useState('');
  const [rating, setRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setSubmitting(true);

    // No .select() here: new reviews are hidden until the owner approves them
    const { error } = await supabase
      .from('reviews')
      .insert([{ client_name: clientName.trim(), comment: comment.trim(), rating }]);

    if (error) {
      setMessage({ type: 'error', text: 'Could not send your feedback. Please try again.' });
    } else {
      setMessage({ type: 'ok', text: 'Thank you! Your feedback will appear after the owner approves it.' });
      setClientName('');
      setComment('');
      setRating(5);
    }
    setSubmitting(false);
  };

  return (
    <section id="reviews" className="mb-24 border-t border-line pt-16">
      <Reveal>
        <div className="mb-10">
          <h2 className="font-display text-3xl md:text-4xl tracking-tight">Client feedback</h2>
          <p className="text-sm text-mute mt-2">Shot with us? Share how it went.</p>
        </div>
      </Reveal>

      <div className="grid md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-8 items-start">
        <Reveal>
          <form onSubmit={handleSubmit} className="rounded-2xl border border-line bg-panel/70 p-5 space-y-4">
            {message && (
              <div
                className={`p-3 text-sm rounded-lg border ${
                  message.type === 'ok'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-red-500/10 border-red-500/30 text-red-300'
                }`}
              >
                {message.text}
              </div>
            )}

            <div>
              <label className="text-sm text-mute block mb-1">Your name</label>
              <input
                type="text"
                required
                minLength={2}
                maxLength={60}
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className={fieldCls}
              />
            </div>

            <div>
              <label className="text-sm text-mute block mb-1">Rating</label>
              <select value={rating} onChange={(e) => setRating(Number(e.target.value))} className={fieldCls}>
                <option value="5">5 stars: exceptional</option>
                <option value="4">4 stars: great</option>
                <option value="3">3 stars: good</option>
                <option value="2">2 stars</option>
                <option value="1">1 star</option>
              </select>
            </div>

            <div>
              <label className="text-sm text-mute block mb-1">Feedback</label>
              <textarea
                required
                rows={4}
                minLength={3}
                maxLength={1000}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className={fieldCls}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-ivory text-ink text-sm font-semibold py-2.5 hover:bg-tungsten disabled:opacity-60 transition"
            >
              {submitting ? 'Sending...' : 'Send feedback'}
            </button>
          </form>
        </Reveal>

        <div className="space-y-4">
          {initialReviews.length === 0 && (
            <p className="text-sm text-mute">No reviews yet. Yours could be the first.</p>
          )}
          {initialReviews.map((r, i) => (
            <Reveal key={r.id} delay={(i % 4) * 70}>
              <div className="rounded-2xl border border-line bg-panel/50 p-5">
                <div className="flex justify-between items-center gap-3">
                  <span className="font-semibold text-sm text-ivory">{r.client_name}</span>
                  <div className="flex text-tungsten" aria-label={`${r.rating} out of 5 stars`}>
                    {Array.from({ length: r.rating }).map((_, k) => (
                      <Star key={k} className="w-3.5 h-3.5 fill-current" />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-mute mt-3 leading-relaxed">{r.comment}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
