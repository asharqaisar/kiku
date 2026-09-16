// Simplified ElasticSlider for volume - React Bits inspired
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';
import { useRef, useState } from 'react';

export default function ElasticSlider({ value = 0.7, onChange, vertical = true }: { value: number, onChange: (v: number) => void, vertical?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const mv = useMotionValue(value);
  const spring = useSpring(mv, { stiffness: 400, damping: 30 });
  const fillHeight = useTransform(spring, [0, 1], ['0%', '100%']);

  const update = (clientY: number) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const pct = vertical ? 1 - (clientY - rect.top) / rect.height : (clientY - rect.left) / rect.width;
    const clamped = Math.max(0, Math.min(1, pct));
    mv.set(clamped);
    onChange(clamped);
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <span className="font-mono text-[11px] text-[#CBA6F7]">{Math.round(value * 100)}%</span>
      <div
        ref={ref}
        className="relative w-2 h-32 bg-white/10 rounded-full cursor-pointer overflow-hidden"
        onPointerDown={(e) => { setDragging(true); (e.target as HTMLElement).setPointerCapture(e.pointerId); update(e.clientY); }}
        onPointerMove={(e) => dragging && update(e.clientY)}
        onPointerUp={() => setDragging(false)}
      >
        <motion.div style={{ height: fillHeight }} className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#CBA6F7] to-[#E6D8FF] rounded-full" />
        <motion.div style={{ bottom: fillHeight }} className="absolute left-1/2 -translate-x-1/2 w-4 h-4 bg-white rounded-full shadow-lg -mb-2" />
      </div>
    </div>
  );
}
