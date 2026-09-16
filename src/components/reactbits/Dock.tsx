// React Bits Dock - for kiku mini player controls
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';
import { useRef } from 'react';

function DockItem({ children, mouseX, base = 44, mag = 60, dist = 140 }: any) {
  const ref = useRef<HTMLDivElement>(null);
  const mouseDist = useTransform(mouseX, (val: number) => {
    const rect = ref.current?.getBoundingClientRect() ?? { x: 0, width: base };
    return val - rect.x - base / 2;
  });
  const target = useTransform(mouseDist, [-dist, 0, dist], [base, mag, base]);
  const size = useSpring(target, { mass: 0.1, stiffness: 150, damping: 12 });

  return (
    <motion.div ref={ref} style={{ width: size, height: size }} className="flex items-center justify-center rounded-xl bg-white/5 border border-white/10 cursor-pointer">
      {children}
    </motion.div>
  );
}

export default function Dock({ items, className = '' }: { items: { icon: React.ReactNode, label: string, onClick?: () => void }[], className?: string }) {
  const mouseX = useMotionValue(Infinity);
  return (
    <motion.div
      onMouseMove={(e) => mouseX.set(e.pageX)}
      onMouseLeave={() => mouseX.set(Infinity)}
      className={`flex items-end gap-2 px-3 py-2 rounded-2xl bg-[rgba(30,30,46,0.85)] backdrop-blur-2xl border border-white/10 shadow-xl ${className}`}
    >
      {items.map((item, i) => (
        <DockItem key={i} mouseX={mouseX}>
          <button onClick={item.onClick} aria-label={item.label} className="w-full h-full flex items-center justify-center text-[#A6ADC8] hover:text-[#CDD6F4]">
            {item.icon}
          </button>
        </DockItem>
      ))}
    </motion.div>
  );
}
