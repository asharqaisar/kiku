import { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';

export default function TiltedCard({ imageSrc, srcSet, sizes, alt = '', caption, containerHeight = '100%', className = '' }: { imageSrc: string, srcSet?: string, sizes?: string, alt?: string, caption?: string, containerHeight?: string, className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 30 });
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 30 });
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ['7.5deg', '-7.5deg']);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ['-7.5deg', '7.5deg']);
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); x.set(0); y.set(0); }}
      style={{ height: containerHeight, rotateX, rotateY, transformStyle: 'preserve-3d' }}
      className={`relative rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.6)] border border-white/15 ${className}`}
    >
      <img src={imageSrc} srcSet={srcSet} sizes={sizes || '500px'} alt={alt} className="w-full h-full object-cover" />
      <motion.div
        animate={{ opacity: isHovered ? 1 : 0 }}
        className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none"
        style={{ transform: 'translateZ(20px)' }}
      />
      {caption && (
        <motion.div style={{ transform: 'translateZ(40px)' }} className="absolute bottom-0 left-0 right-0 p-4 text-white font-serif">
          {caption}
        </motion.div>
      )}
      <div className="absolute inset-0 rounded-3xl ring-1 ring-inset ring-white/20 pointer-events-none" />
    </motion.div>
  );
}
