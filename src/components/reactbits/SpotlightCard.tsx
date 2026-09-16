import { useRef } from 'react';

export default function SpotlightCard({ children, className = '', spotlightColor = 'rgba(203,166,247,0.15)' }: { children: React.ReactNode, className?: string, spotlightColor?: string }) {
  const divRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!divRef.current) return;
    const rect = divRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    divRef.current.style.setProperty('--mouse-x', `${x}px`);
    divRef.current.style.setProperty('--mouse-y', `${y}px`);
    divRef.current.style.setProperty('--spotlight-color', spotlightColor);
  };

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      className={`group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#1E1E2E]/70 backdrop-blur-xl
      before:absolute before:inset-0 before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-500 before:pointer-events-none
      before:bg-[radial-gradient(500px_circle_at_var(--mouse-x)_var(--mouse-y),var(--spotlight-color),transparent_45%)]
      hover:border-white/[0.14] hover:bg-[#252538]/80 transition-all duration-300
      ${className}`}
    >
      <div className="relative z-10">{children}</div>
    </div>
  );
}
