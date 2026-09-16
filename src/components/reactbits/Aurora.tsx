// Fixed Aurora - handles WebGL context loss + safe cleanup
// Original React Bits Aurora crashes with "forEach undefined" when unmounted during render
import { Renderer, Program, Mesh, Color, Triangle } from 'ogl';
import { useEffect, useRef } from 'react';

type Props = {
  colorStops?: string[]
  amplitude?: number
  blend?: number
  speed?: number
  className?: string
}

export default function Aurora({ colorStops = ['#CBA6F7', '#7c3aed', '#1a1033'], amplitude = 0.9, blend = 0.4, speed = 0.4, className = '' }: Props) {
  const ctnDom = useRef<HTMLDivElement>(null);
  const propsRef = useRef({ colorStops, amplitude, blend, speed });
  propsRef.current = { colorStops, amplitude, blend, speed };

  useEffect(() => {
    const ctn = ctnDom.current;
    if (!ctn) return;

    // Skip on low-end devices / if WebGL not supported
    const isLowEnd = (() => {
      try {
        const n = navigator as any;
        return (n.deviceMemory && n.deviceMemory <= 4) || (n.hardwareConcurrency && n.hardwareConcurrency <= 4);
      } catch { return false; }
    })();
    if (isLowEnd) return;

    let renderer: Renderer | null = null;
    let gl: WebGL2RenderingContext | null = null;
    let program: Program | null = null;
    let mesh: Mesh | null = null;
    let animateId = 0;
    let mounted = true;

    try {
      renderer = new Renderer({ alpha: true, premultipliedAlpha: true, antialias: false, dpr: Math.min(window.devicePixelRatio || 1, 1.5) });
      gl = renderer.gl as WebGL2RenderingContext;
      if (!gl) throw new Error('No WebGL2');
      gl.clearColor(0, 0, 0, 0);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.canvas.style.backgroundColor = 'transparent';
      gl.canvas.style.width = '100%';
      gl.canvas.style.height = '100%';
      gl.canvas.style.display = 'block';
    } catch (e) {
      console.warn('Aurora: WebGL not supported, using CSS fallback', e);
      return;
    }

    const VERT = `#version 300 es
      in vec2 position;
      void main() { gl_Position = vec4(position, 0.0, 1.0); }
    `;

    const FRAG = `#version 300 es
      precision highp float;
      uniform float uTime; uniform float uAmplitude; uniform vec3 uColorStops[3]; uniform vec2 uResolution; uniform float uBlend;
      float snoise(vec2 v){
        const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
        vec2 i = floor(v + dot(v, C.yy)); vec2 x0 = v - i + dot(i, C.xx);
        vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
        vec4 x12 = x0.xyxy + C.xxzz; x12.xy -= i1; i = mod(i, 289.0);
        vec3 p = mod(((i.y + vec3(0.0, i1.y, 1.0)) * 34.0 + 1.0) * (i.y + vec3(0.0, i1.y, 1.0)), 289.0);
        p = mod((p + i.x + vec3(0.0, i1.x, 1.0)) * 34.0 + 1.0, 289.0) * p;
        vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0); m = m*m; m = m*m;
        vec3 x = 2.0 * fract(p * C.www) - 1.0; vec3 h = abs(x) - 0.5; vec3 ox = floor(x + 0.5); vec3 a0 = x - ox;
        m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
        vec3 g; g.x = a0.x * x0.x + h.x * x0.y; g.yz = a0.yz * x12.xz + h.yz * x12.yw; return 130.0 * dot(m, g);
      }
      void main() {
        vec2 uv = gl_FragCoord.xy / uResolution;
        vec3 ramp = mix(mix(uColorStops[0], uColorStops[1], smoothstep(0.0,0.5,uv.x)), uColorStops[2], smoothstep(0.5,1.0,uv.x));
        float height = snoise(vec2(uv.x * 2.0 + uTime * 0.1, uTime * 0.25)) * 0.5 * uAmplitude;
        height = exp(height); height = (uv.y * 2.0 - height + 0.2);
        float intensity = 0.6 * height; float auroraAlpha = smoothstep(0.20 - uBlend * 0.5, 0.20 + uBlend * 0.5, intensity);
        vec3 auroraColor = intensity * ramp;
        gl_FragColor = vec4(auroraColor * auroraAlpha, auroraAlpha * 0.8);
      }
    `;

    const resize = () => {
      if (!mounted || !ctn || !renderer || !program) return;
      const width = ctn.offsetWidth;
      const height = ctn.offsetHeight;
      if (width === 0 || height === 0) return;
      renderer.setSize(width, height);
      try {
        if (program.uniforms.uResolution) program.uniforms.uResolution.value = [width, height];
      } catch {}
    };

    const handleContextLost = (e: Event) => {
      e.preventDefault();
      console.warn('Aurora: context lost');
      if (animateId) cancelAnimationFrame(animateId);
    };
    const handleContextRestored = () => {
      console.log('Aurora: context restored');
      resize();
      animateId = requestAnimationFrame(update);
    };

    try {
      const geometry = new Triangle(gl);
      // @ts-ignore
      if (geometry.attributes.uv) delete geometry.attributes.uv;

      const stops = (propsRef.current.colorStops || colorStops).slice(0, 3);
      while (stops.length < 3) stops.push(stops[0] || '#CBA6F7');

      program = new Program(gl, {
        vertex: VERT,
        fragment: FRAG,
        uniforms: {
          uTime: { value: 0 },
          uAmplitude: { value: propsRef.current.amplitude ?? amplitude },
          uColorStops: { value: stops.map(hex => { const c = new Color(hex); return [c.r, c.g, c.b]; }) },
          uResolution: { value: [ctn.offsetWidth || 800, ctn.offsetHeight || 600] },
          uBlend: { value: propsRef.current.blend ?? blend }
        }
      });

      mesh = new Mesh(gl, { geometry, program });
      ctn.appendChild(gl.canvas);
      gl.canvas.addEventListener('webglcontextlost', handleContextLost as any, false);
      gl.canvas.addEventListener('webglcontextrestored', handleContextRestored as any, false);
    } catch (e) {
      console.warn('Aurora init failed', e);
      return;
    }

    const update = (t: number) => {
      if (!mounted) return;
      animateId = requestAnimationFrame(update);
      if (!renderer || !program || !mesh || !gl) return;
      
      // Safety check: if gl is lost, skip
      if (gl.isContextLost && gl.isContextLost()) return;

      try {
        const { colorStops: cs, amplitude: amp, blend: bl, speed: sp } = propsRef.current;
        if (program.uniforms.uTime) program.uniforms.uTime.value = t * 0.01 * (sp ?? speed);
        if (program.uniforms.uAmplitude) program.uniforms.uAmplitude.value = amp ?? amplitude;
        if (program.uniforms.uBlend) program.uniforms.uBlend.value = bl ?? blend;
        if (program.uniforms.uColorStops && cs && cs.length >= 3) {
          program.uniforms.uColorStops.value = cs.slice(0, 3).map(hex => {
            try { const c = new Color(hex); return [c.r, c.g, c.b]; } catch { return [0.8, 0.65, 0.97]; }
          });
        }
        renderer.render({ scene: mesh });
      } catch (e) {
        // Swallow OGL errors (the forEach crash) - don't spam console
        // console.debug('Aurora render skip', e);
      }
    };

    animateId = requestAnimationFrame(update);
    resize();
    window.addEventListener('resize', resize);

    return () => {
      mounted = false;
      if (animateId) cancelAnimationFrame(animateId);
      window.removeEventListener('resize', resize);
      try {
        if (gl) {
          const canvas = gl.canvas as HTMLCanvasElement;
          canvas?.removeEventListener('webglcontextlost', handleContextLost as any);
          canvas?.removeEventListener('webglcontextrestored', handleContextRestored as any);
          if (ctn && canvas && canvas.parentNode === ctn) ctn.removeChild(canvas);
          gl.getExtension('WEBGL_lose_context')?.loseContext();
        }
      } catch {}
      renderer = null;
      program = null;
      mesh = null;
      gl = null;
    };
  }, []);

  // CSS fallback that always shows (beautiful even without WebGL)
  return (
    <div ref={ctnDom} className={`aurora-container absolute inset-0 w-full h-full pointer-events-none ${className}`}>
      {/* CSS fallback gradient - visible when WebGL fails or on low-end */}
      <div className="absolute inset-0 opacity-40">
        <div className="absolute inset-0 bg-[radial-gradient(60%_50%_at_20%_0%,rgba(203,166,247,0.15),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(50%_40%_at_80%_10%,rgba(124,58,237,0.12),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(70%_50%_at_50%_100%,rgba(203,166,247,0.08),transparent_70%)]" />
      </div>
    </div>
  );
}
