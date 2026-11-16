// Elemen dekorasi: kilau bintang 4 titik & pita gelombang (selaras dengan UI di game)

export function Sparkle({
  size = 18,
  style,
  delay = 0,
}: {
  size?: number;
  style?: React.CSSProperties;
  delay?: number;
}) {
  return (
    <span
      className="sparkle"
      aria-hidden
      style={{ width: size, height: size, animationDelay: `${delay}s`, ...style }}
    >
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0c.6 5.6 2.2 8.9 4.3 10.1 1.4.8 4 1.4 7.7 1.9-3.7.5-6.3 1.1-7.7 1.9C14.2 15.1 12.6 18.4 12 24c-.6-5.6-2.2-8.9-4.3-10.1C6.3 13.1 3.7 12.5 0 12c3.7-.5 6.3-1.1 7.7-1.9C9.8 8.9 11.4 5.6 12 0z" />
      </svg>
    </span>
  );
}

export function Waves({ className = "" }: { className?: string }) {
  // garis-garis halus yang merapat (kesan pita sutra)
  const lines = Array.from({ length: 14 }, (_, i) => i);
  return (
    <svg className={className} viewBox="0 0 1200 400" preserveAspectRatio="none" aria-hidden>
      <defs>
        <linearGradient id="wfade" x1="0" x2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.25" stopColor="#bcd3ff" stopOpacity="0.9" />
          <stop offset="0.8" stopColor="#bcd3ff" stopOpacity="0.7" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
      {lines.map((i) => {
        const t = i / (lines.length - 1);
        const y0 = 330 - t * 40;
        const c1 = 210 + t * 30;
        const c2 = 360 - t * 60;
        const y1 = 150 + t * 50;
        return (
          <path
            key={i}
            d={`M-20 ${y0} C 300 ${c1}, 700 ${c2}, 1220 ${y1}`}
            fill="none"
            stroke="url(#wfade)"
            strokeWidth={i === 0 ? 1.6 : 0.9}
            opacity={i === 0 ? 0.9 : 0.18 + (1 - t) * 0.35}
          />
        );
      })}
    </svg>
  );
}

export function Backdrop() {
  return (
    <div className="backdrop" aria-hidden>
      <Waves />
    </div>
  );
}

export function BrandMark() {
  return (
    <span className="brand-mark" aria-hidden>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff">
        <path d="M12 0c.6 5.6 2.2 8.9 4.3 10.1 1.4.8 4 1.4 7.7 1.9-3.7.5-6.3 1.1-7.7 1.9C14.2 15.1 12.6 18.4 12 24c-.6-5.6-2.2-8.9-4.3-10.1C6.3 13.1 3.7 12.5 0 12c3.7-.5 6.3-1.1 7.7-1.9C9.8 8.9 11.4 5.6 12 0z" />
      </svg>
    </span>
  );
}
