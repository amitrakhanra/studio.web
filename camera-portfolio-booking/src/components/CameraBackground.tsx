'use client';
import { useEffect, useRef, useState } from 'react';
import type * as T from 'three';
import type { RoundedBoxGeometry as RoundedBoxType } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import type { RoomEnvironment as RoomEnvType } from 'three/examples/jsm/environments/RoomEnvironment.js';

// ---- easy settings ----
const ENABLED = true; // set to false to switch the 3D camera off completely
const MIN_WIDTH = 1024; // only on laptops/desktops; phones keep the light glow instead
const OPACITY = 0.55; // 0 = invisible, 1 = fully solid

type Lib = typeof T;

function makeTexture(THREE: Lib, w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  if (ctx) draw(ctx);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.RepeatWrapping;
  return t;
}

function start(
  THREE: Lib,
  RoundedBox: typeof RoundedBoxType,
  RoomEnvironment: typeof RoomEnvType,
  canvas: HTMLCanvasElement
): () => void {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = envTex;

  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.set(0, 0, 11);

  // ---- lights: warm key, violet rim, soft fill ----
  const key = new THREE.DirectionalLight(0xffc27a, 2.4);
  key.position.set(4, 4, 6);
  const rim = new THREE.DirectionalLight(0x6d5bff, 3.2);
  rim.position.set(-5, 2, -4);
  scene.add(key, rim, new THREE.AmbientLight(0x223355, 0.45));

  // ---- procedural textures ----
  const leather = makeTexture(THREE, 256, 256, (ctx) => {
    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 7000; i++) {
      const v = 90 + Math.floor(Math.random() * 90);
      ctx.fillStyle = `rgb(${v},${v},${v})`;
      ctx.fillRect(Math.random() * 256, Math.random() * 256, 2, 2);
    }
  });
  leather.repeat.set(4, 3);

  const knurl = makeTexture(THREE, 512, 8, (ctx) => {
    ctx.fillStyle = '#404040';
    ctx.fillRect(0, 0, 512, 8);
    ctx.fillStyle = '#d0d0d0';
    for (let x = 0; x < 512; x += 8) ctx.fillRect(x, 0, 4, 8);
  });

  // ---- materials ----
  const matBody = new THREE.MeshStandardMaterial({ color: 0x15171c, roughness: 0.6, metalness: 0.2, bumpMap: leather, bumpScale: 0.7 });
  const matBlack = new THREE.MeshStandardMaterial({ color: 0x0d0f13, roughness: 0.45, metalness: 0.35 });
  const matRing = new THREE.MeshStandardMaterial({ color: 0x14161b, roughness: 0.5, metalness: 0.5, bumpMap: knurl, bumpScale: 1.2 });
  const matMetal = new THREE.MeshStandardMaterial({ color: 0xb8bec8, roughness: 0.28, metalness: 1 });
  const matGlass = new THREE.MeshStandardMaterial({ color: 0x04070f, roughness: 0.04, metalness: 0.95, envMapIntensity: 1.7 });
  const matViolet = new THREE.MeshStandardMaterial({ color: 0x1b1456, roughness: 0.15, metalness: 0.7, emissive: 0x1a1250, emissiveIntensity: 0.5 });
  const matTeal = new THREE.MeshStandardMaterial({ color: 0x0b3a44, roughness: 0.15, metalness: 0.7, emissive: 0x0a3340, emissiveIntensity: 0.5 });
  const matAmber = new THREE.MeshStandardMaterial({ color: 0xffb347, roughness: 0.3, metalness: 0.4, emissive: 0xffb347, emissiveIntensity: 0.9 });
  const matScreen = new THREE.MeshStandardMaterial({ color: 0x04060b, roughness: 0.2, metalness: 0.6, emissive: 0x0a1a30, emissiveIntensity: 0.6 });

  // ---- build the camera (front of the camera faces +z) ----
  const cam = new THREE.Group();
  const add = (m: T.Object3D, x = 0, y = 0, z = 0) => {
    m.position.set(x, y, z);
    cam.add(m);
    return m;
  };
  const cyl = (r: number, len: number, mat: T.Material) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 64, 1), mat);
    m.rotation.x = Math.PI / 2; // lay the cylinder along the z axis
    return m;
  };

  add(new THREE.Mesh(new RoundedBox(3.4, 2.2, 1.7, 6, 0.2), matBody)); // body
  add(new THREE.Mesh(new RoundedBox(1.3, 0.6, 1.2, 5, 0.15), matBody), 0, 1.35, -0.1); // prism hump
  add(new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.05, 0.6), matMetal), 0, 1.68, -0.1); // hot shoe
  add(new THREE.Mesh(new RoundedBox(0.85, 2.05, 1.55, 6, 0.28), matBody), -1.85, -0.02, 0.12); // grip
  add(new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.22, 0.22), matMetal), -1.72, 0.95, 0); // strap lugs
  add(new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.22, 0.22), matMetal), 1.72, 0.95, 0);
  add(new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.2, 48), matRing), -1.0, 1.2, 0.2); // mode dial
  add(new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.12, 32), matAmber), -1.9, 1.08, 0.55); // shutter button

  // lens: mount, barrel, zoom ring, focus ring, front
  add(cyl(1.0, 0.16, matMetal), 0, 0, 0.93);
  add(cyl(0.9, 0.5, matBlack), 0, 0, 1.18);
  add(cyl(0.98, 0.85, matRing), 0, 0, 1.85);
  add(cyl(0.9, 0.1, matMetal), 0, 0, 2.33);
  add(cyl(0.95, 0.5, matRing), 0, 0, 2.63);
  add(cyl(0.88, 0.4, matBlack), 0, 0, 3.03);
  add(new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.025, 12, 96), matAmber), 0, 0, 2.9); // amber accent ring
  add(new THREE.Mesh(new THREE.TorusGeometry(0.8, 0.06, 16, 96), matMetal), 0, 0, 3.24); // front rim

  // glass with coloured coatings for depth
  add(new THREE.Mesh(new THREE.CircleGeometry(0.78, 64), matGlass), 0, 0, 3.2);
  add(new THREE.Mesh(new THREE.CircleGeometry(0.55, 64), matViolet), 0, 0, 3.21);
  add(new THREE.Mesh(new THREE.CircleGeometry(0.32, 64), matTeal), 0, 0, 3.22);
  add(new THREE.Mesh(new THREE.CircleGeometry(0.12, 48), matBlack), 0, 0, 3.23);
  add(new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.012, 8, 96), matAmber), 0, 0, 3.205);

  // back: screen and buttons
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.4), matScreen);
  screen.rotation.y = Math.PI;
  add(screen, 0.1, -0.1, -0.856);
  [0.5, 0, -0.5].forEach((y) => {
    const b = cyl(0.1, 0.06, matMetal);
    add(b, 1.4, y, -0.86);
  });

  cam.position.z = -1.3; // centre the model on its pivot
  const pivot = new THREE.Group();
  pivot.add(cam);
  scene.add(pivot);

  // ---- sizing ----
  const FOV_TAN = Math.tan((35 / 2) * (Math.PI / 180));
  const halfWidth = () => FOV_TAN * 11 * camera.aspect;
  const resize = () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    pivot.scale.setScalar(Math.max(0.55, Math.min(1, camera.aspect / 1.78)) * 0.85);
    if (reduced) drawStill();
  };

  const scrollProgress = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    return max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
  };

  function drawStill() {
    pivot.position.set(halfWidth() * 0.55, 0, 0);
    pivot.rotation.set(0.2, 0.7, 0.06);
    renderer.render(scene, camera);
  }

  // ---- animation ----
  let raf = 0;
  let last = performance.now();
  let spin = 0.7;
  let curX = 0;
  let curY = 0;
  const heroEl = document.querySelector('[aria-label="Camera showcase"]');

  const frame = (now: number) => {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (document.hidden) return;
    // while the full-screen camera hero covers the page, skip drawing to save battery
    if (heroEl) {
      const r = heroEl.getBoundingClientRect();
      if (r.top <= 0 && r.bottom >= window.innerHeight) return;
    }
    const p = scrollProgress();
    const k = Math.min(1, dt * 3);
    curX += (Math.sin(p * Math.PI * 3) * halfWidth() * 0.62 - curX) * k;
    curY += (Math.cos(p * Math.PI * 2.2) * 0.6 - curY) * k;
    spin += dt * 0.25;
    pivot.position.set(curX, curY, 0);
    pivot.rotation.set(0.18 + Math.sin(p * 6) * 0.08, spin + p * Math.PI * 2.5, 0.06);
    renderer.render(scene, camera);
  };

  resize();
  window.addEventListener('resize', resize);
  if (!reduced) raf = requestAnimationFrame(frame);

  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener('resize', resize);
    scene.traverse((o) => {
      const m = o as T.Mesh;
      if (m.isMesh) {
        m.geometry.dispose();
      }
    });
    [matBody, matBlack, matRing, matMetal, matGlass, matViolet, matTeal, matAmber, matScreen].forEach((m) => m.dispose());
    leather.dispose();
    knurl.dispose();
    envTex.dispose();
    pmrem.dispose();
    renderer.dispose();
  };
}

export default function CameraBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [wide, setWide] = useState(false);

  useEffect(() => {
    if (!ENABLED) return;
    const mq = window.matchMedia(`(min-width: ${MIN_WIDTH}px)`);
    const update = () => setWide(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (!wide) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    let disposed = false;
    let cleanup: () => void = () => {};

    (async () => {
      try {
        const THREE = await import('three');
        const { RoundedBoxGeometry } = await import('three/examples/jsm/geometries/RoundedBoxGeometry.js');
        const { RoomEnvironment } = await import('three/examples/jsm/environments/RoomEnvironment.js');
        if (disposed) return;
        cleanup = start(THREE, RoundedBoxGeometry, RoomEnvironment, canvas);
      } catch {
        // WebGL unavailable or download failed: the page simply keeps the soft glow background
      }
    })();

    return () => {
      disposed = true;
      cleanup();
    };
  }, [wide]);

  if (!ENABLED || !wide) return null;
  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 h-full w-full pointer-events-none"
      style={{ zIndex: -1, opacity: OPACITY }}
    />
  );
}
