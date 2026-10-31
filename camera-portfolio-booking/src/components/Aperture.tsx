// Decorative animated camera lens for the hero (pure SVG + CSS, no images).
export default function Aperture({ className = '' }: { className?: string }) {
  const spin = '[transform-box:fill-box] origin-center';
  return (
    <svg viewBox="0 0 400 400" className={className} role="img" aria-label="Camera lens illustration">
      <defs>
        <radialGradient id="lens-glass" cx="38%" cy="32%" r="75%">
          <stop offset="0%" stopColor="#3A3F7A" />
          <stop offset="55%" stopColor="#10152B" />
          <stop offset="100%" stopColor="#05070D" />
        </radialGradient>
        <radialGradient id="lens-core" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFD08A" stopOpacity="0.95" />
          <stop offset="45%" stopColor="#FFB347" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#FFB347" stopOpacity="0" />
        </radialGradient>
      </defs>

      <circle cx="200" cy="200" r="196" fill="none" stroke="#1C2436" strokeWidth="1" />
      <circle cx="200" cy="200" r="178" fill="none" stroke="#FFB347" strokeOpacity="0.55" strokeWidth="6" strokeDasharray="1.5 11.5" className={`animate-spin-slow ${spin}`} />
      <circle cx="200" cy="200" r="150" fill="none" stroke="#6D5BFF" strokeOpacity="0.5" strokeWidth="1" />
      <circle cx="200" cy="200" r="128" fill="none" stroke="#EEF1F7" strokeOpacity="0.35" strokeWidth="3" strokeDasharray="1 7" className={`animate-spin-rev ${spin}`} />
      <circle cx="200" cy="200" r="100" fill="url(#lens-glass)" stroke="#FFB347" strokeOpacity="0.35" strokeWidth="1.5" />
      <circle cx="200" cy="200" r="64" fill="none" stroke="#6D5BFF" strokeOpacity="0.5" strokeWidth="1" />
      <circle cx="200" cy="200" r="44" fill="none" stroke="#FFB347" strokeOpacity="0.3" strokeWidth="1" />
      <circle cx="200" cy="200" r="70" fill="url(#lens-core)" className={`animate-glow ${spin}`} />
      <ellipse cx="165" cy="150" rx="26" ry="12" transform="rotate(-35 165 150)" fill="#ffffff" opacity="0.14" />
    </svg>
  );
}
