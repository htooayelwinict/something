export function SunMark({ size = 30 }: { size?: number }) {
  const rays = Array.from({ length: 12 }, (_, index) => index * 30);
  return (
    <svg className="sun-mark" width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      {rays.map((deg) => <line key={deg} x1="24" y1="4" x2="24" y2="10" transform={`rotate(${deg} 24 24)`} />)}
      <circle cx="24" cy="24" r="9" />
      <circle cx="24" cy="24" r="4.5" className="sun-core" />
    </svg>
  );
}

export function Brand() {
  return (
    <a className="brand" href="/" aria-label="သုရိယ ပင်မစာမျက်နှာ">
      <span className="brand-mark"><SunMark /></span>
      <span className="brand-name"><span className="brand-my">သုရိယ</span><span className="brand-latin">SURIYA</span></span>
    </a>
  );
}
