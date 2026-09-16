// From React Bits - GlassSurface - adapted for kiku
// https://reactbits.dev/components/glass-surface
import { useEffect, useState, useRef, useId } from 'react';

type Props = {
  children: React.ReactNode
  width?: number | string
  height?: number | string
  borderRadius?: number
  borderWidth?: number
  brightness?: number
  opacity?: number
  blur?: number
  displace?: number
  backgroundOpacity?: number
  saturation?: number
  distortionScale?: number
  redOffset?: number
  greenOffset?: number
  blueOffset?: number
  className?: string
  style?: React.CSSProperties
}

export default function GlassSurface({
  children,
  width = '100%',
  height = '100%',
  borderRadius = 20,
  borderWidth = 0.07,
  brightness = 50,
  opacity = 0.93,
  blur = 11,
  displace = 0,
  backgroundOpacity = 0.08,
  saturation = 1,
  distortionScale = -180,
  redOffset = 0,
  greenOffset = 10,
  blueOffset = 20,
  className = '',
  style = {}
}: Props) {
  const uniqueId = useId().replace(/:/g, '-');
  const filterId = `glass-filter-${uniqueId}`;
  const [svgSupported, setSvgSupported] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const feImageRef = useRef<SVGFEImageElement>(null);

  useEffect(() => {
    const isWebkit = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
    const isFirefox = /Firefox/.test(navigator.userAgent);
    setSvgSupported(!isWebkit && !isFirefox && typeof window !== 'undefined');
  }, []);

  const containerStyle: any = {
    ...style,
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
    borderRadius: `${borderRadius}px`,
    '--glass-frost': backgroundOpacity,
    '--glass-saturation': saturation,
  }

  // Fallback for Firefox/Safari - use your original kiku glass
  if (!svgSupported) {
    return (
      <div
        ref={containerRef}
        className={`relative overflow-hidden backdrop-blur-xl bg-[rgba(30,30,46,0.65)] border border-white/10 ${className}`}
        style={containerStyle}
      >
        {children}
      </div>
    )
  }

  return (
    <div ref={containerRef} className={`glass-surface relative overflow-hidden ${className}`} style={containerStyle}>
      <svg className="absolute w-0 h-0 pointer-events-none">
        <defs>
          <filter id={filterId} colorInterpolationFilters="sRGB" x="0%" y="0%" width="100%" height="100%">
            <feImage ref={feImageRef} x="0" y="0" width="100%" height="100%" preserveAspectRatio="none" result="map" />
            <feDisplacementMap in="SourceGraphic" in2="map" scale={distortionScale + redOffset} xChannelSelector="R" yChannelSelector="G" result="dispRed" />
            <feDisplacementMap in="SourceGraphic" in2="map" scale={distortionScale + greenOffset} xChannelSelector="G" yChannelSelector="G" result="dispGreen" />
            <feDisplacementMap in="SourceGraphic" in2="map" scale={distortionScale + blueOffset} xChannelSelector="B" yChannelSelector="G" result="dispBlue" />
            <feBlend in="dispRed" in2="dispGreen" mode="screen" result="rg" />
            <feBlend in="rg" in2="dispBlue" mode="screen" result="output" />
            <feGaussianBlur in="output" stdDeviation={displace || 0.5} />
          </filter>
        </defs>
      </svg>
      <div
        className="absolute inset-0"
        style={{
          backdropFilter: `url(#${filterId}) blur(${blur}px) saturate(${saturation})`,
          WebkitBackdropFilter: `blur(${blur}px) saturate(${saturation})`,
          background: `rgba(30,30,46,${backgroundOpacity})`,
          borderRadius: `${borderRadius}px`,
        }}
      />
      <div className="relative z-10 w-full h-full">{children}</div>
    </div>
  )
}
