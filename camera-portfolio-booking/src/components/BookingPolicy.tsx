import Reveal from '@/components/Reveal';

// EDIT YOUR RULES HERE. One rule per line, inside quotes, ending with a comma.
// Do not use the " character inside a rule.
const POLICY: string[] = [
  "The advance amount reserves your date. The remaining balance is paid as agreed with us.",
  "Your date is held when you submit, and confirmed by us (after we verify the advance payment, where one is required).",
  "To reschedule or cancel, contact us as early as possible. Terms for advance refunds are decided by the studio.",
  "Only one shoot is booked per date.",
];

export default function BookingPolicy() {
  return (
    <Reveal>
      <section id="policy" className="max-w-2xl mb-24 rounded-2xl border border-line bg-panel/60 p-6">
        <h2 className="font-display text-xl mb-3">Booking policy</h2>
        <ul className="text-sm text-mute space-y-2 list-disc pl-5 leading-relaxed">
          {POLICY.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ul>
      </section>
    </Reveal>
  );
}
