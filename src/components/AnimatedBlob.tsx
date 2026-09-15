import { useEffect, useRef } from 'react';
import blobTexture from '../assets/anker/blob-texture-shader.png';

// Probed once at module load — WebGL support doesn't change at runtime.
// Callers use this to decide whether to render <AnimatedBlob> at all; a
// later hard GL failure mid-session is reported via the onGlFailed prop.
export const isWebglSupported = (() => {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl') || c.getContext('experimental-webgl'));
  } catch {
    return false;
  }
})();

const VERTEX_SHADER = `attribute vec2 position;\nvoid main(){ gl_Position = vec4(position,0.0,1.0); }`;

// Domain-warping shader (fbm-based), texture-mapped onto the blob photo. Only
// the radius uniform is driven externally (per-frame, via getRadius).
const FRAGMENT_SHADER = `precision highp float;
uniform float iTime;
uniform float iRadius;
uniform vec2 iResolution;
uniform sampler2D iChannel0;
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453123); }
float noise(in vec2 x){
  vec2 p = floor(x);
  vec2 f = fract(x);
  f = f*f*(3.0-2.0*f);
  float a = hash(p+vec2(0.0,0.0));
  float b = hash(p+vec2(1.0,0.0));
  float c = hash(p+vec2(0.0,1.0));
  float d = hash(p+vec2(1.0,1.0));
  return mix(mix(a,b,f.x), mix(c,d,f.x), f.y);
}
const mat2 mtx = mat2(0.80,0.60,-0.60,0.80);
float fbm(vec2 p){
  float f = 0.0;
  f += 0.500000*noise(p); p = mtx*p*2.02;
  f += 0.250000*noise(p); p = mtx*p*2.03;
  f += 0.125000*noise(p); p = mtx*p*2.01;
  f += 0.062500*noise(p); p = mtx*p*2.04;
  f += 0.031250*noise(p); p = mtx*p*2.01;
  f += 0.015625*noise(p);
  return f/0.96875;
}
void pattern(in vec2 p, in float t, out vec2 q, out vec2 r, out vec2 g){
  q = vec2(fbm(p), fbm(p+vec2(10.0,1.3)));
  r = vec2(fbm(p+4.0*q+vec2(t)+vec2(1.7,9.2)), fbm(p+4.0*q+vec2(t)+vec2(8.3,2.8)));
  g = vec2(fbm(p+2.0*r+vec2(t*2.0)+vec2(2.0,6.0)), fbm(p+2.0*r+vec2(t*1.0)+vec2(5.0,3.0)));
}
void main(){
  vec2 fragCoord = gl_FragCoord.xy;
  vec2 uv = (fragCoord - 0.5*iResolution.xy) / iResolution.y;
  float dist = length(uv);
  float radius = iRadius;
  vec2 q, r, g;
  pattern(uv*2.2, iTime*0.06, q, r, g);
  vec2 warp = (g - 0.5) * 0.16 + (r - 0.5) * 0.09;
  vec2 texUV = uv / (radius*1.5) * 0.5 + 0.5 + warp;
  texUV = clamp(texUV, vec2(0.10), vec2(0.90));
  vec3 col = texture2D(iChannel0, texUV).rgb;
  float mask = 1.0 - smoothstep(radius-0.004, radius+0.004, dist);
  gl_FragColor = vec4(col, mask);
}`;

// Same normalized radius range works for any canvas size — the shader's UV
// space is scaled by iResolution, not by absolute pixels.
export const MIN_RADIUS = 0.21;
export const MAX_RADIUS = 0.39;

interface Props {
  /** Backing canvas resolution in device pixels (square). Independent of the
   * element's on-screen CSS size, which always fills its container. */
  resolution: number;
  /** Optional frame-rate cap. Omit for uncapped (matches the original Anker
   * blob's behavior exactly). */
  maxFps?: number;
  /** Radius (0.21-0.39 range) for the given elapsed seconds since this GL
   * context started. Called every rendered frame from outside React. */
  getRadius: (elapsedSeconds: number) => number;
  /** Fired once if WebGL init or a later render call fails — the caller is
   * expected to swap in its own fallback visual. */
  onGlFailed: () => void;
}

// Renders the shared breath-blob shader into a canvas that fills its parent.
// Pauses its render loop while the document is hidden (backgrounded tab,
// locked/backgrounded native app) and resumes on visibility return.
export default function AnimatedBlob({ resolution, maxFps, getRadius, onGlFailed }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const getRadiusRef = useRef(getRadius);
  getRadiusRef.current = getRadius;
  const onGlFailedRef = useRef(onGlFailed);
  onGlFailedRef.current = onGlFailed;

  useEffect(() => {
    if (!isWebglSupported) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    let gl: WebGLRenderingContext | null = null;
    let rafId: number | null = null;
    let isHidden = document.hidden;
    let lastFrameTime = 0;
    const minFrameInterval = maxFps ? 1000 / maxFps : 0;

    const glState: {
      prog: WebGLProgram | null;
      tex: WebGLTexture | null;
      iTimeLoc: WebGLUniformLocation | null;
      iRadiusLoc: WebGLUniformLocation | null;
      iResLoc: WebGLUniformLocation | null;
      iChanLoc: WebGLUniformLocation | null;
      glStart: number;
    } = { prog: null, tex: null, iTimeLoc: null, iRadiusLoc: null, iResLoc: null, iChanLoc: null, glStart: 0 };

    const scheduleFrame = () => {
      if (isHidden) return;
      rafId = requestAnimationFrame(renderFrame);
    };

    const renderFrame = (now: number) => {
      if (!gl) return;
      if (minFrameInterval && now - lastFrameTime < minFrameInterval) {
        scheduleFrame();
        return;
      }
      lastFrameTime = now;
      try {
        const t = (now - glState.glStart) / 1000;
        gl.useProgram(glState.prog);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.uniform1f(glState.iTimeLoc, t);
        gl.uniform1f(glState.iRadiusLoc, getRadiusRef.current(t));
        gl.uniform2f(glState.iResLoc, canvas.width, canvas.height);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, glState.tex);
        gl.uniform1i(glState.iChanLoc, 0);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
      } catch (e) {
        console.warn('Lomira: WebGL render failed, falling back', e);
        gl = null;
        onGlFailedRef.current();
        return;
      }
      scheduleFrame();
    };

    const handleVisibility = () => {
      isHidden = document.hidden;
      if (!isHidden && gl && rafId == null) {
        rafId = requestAnimationFrame(renderFrame);
      } else if (isHidden && rafId != null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    try {
      gl = (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;
      if (!gl) throw new Error('WebGL not available');

      const compile = (type: number, src: string) => {
        const s = gl!.createShader(type)!;
        gl!.shaderSource(s, src);
        gl!.compileShader(s);
        if (!gl!.getShaderParameter(s, gl!.COMPILE_STATUS)) throw new Error(gl!.getShaderInfoLog(s) ?? 'shader compile failed');
        return s;
      };
      const prog = gl.createProgram()!;
      gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERTEX_SHADER));
      gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAGMENT_SHADER));
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog) ?? 'program link failed');
      gl.useProgram(prog);
      glState.prog = prog;

      const quad = new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]);
      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, quad, gl.STATIC_DRAW);
      const posLoc = gl.getAttribLocation(prog, 'position');
      gl.enableVertexAttribArray(posLoc);
      gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

      glState.iTimeLoc = gl.getUniformLocation(prog, 'iTime');
      glState.iRadiusLoc = gl.getUniformLocation(prog, 'iRadius');
      glState.iResLoc = gl.getUniformLocation(prog, 'iResolution');
      glState.iChanLoc = gl.getUniformLocation(prog, 'iChannel0');
      glState.tex = gl.createTexture();

      const img = new Image();
      img.onload = () => {
        if (!gl) return;
        gl.bindTexture(gl.TEXTURE_2D, glState.tex);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.clearColor(0, 0, 0, 0);
        glState.glStart = performance.now();
        scheduleFrame();
      };
      img.onerror = () => onGlFailedRef.current();
      img.src = blobTexture;
    } catch (e) {
      console.warn('Lomira: WebGL init failed, falling back', e);
      onGlFailedRef.current();
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      gl = null;
      if (rafId != null) cancelAnimationFrame(rafId);
    };
  }, [resolution, maxFps]);

  return <canvas ref={canvasRef} width={resolution} height={resolution} style={{ width: '100%', height: '100%', display: 'block' }} />;
}
