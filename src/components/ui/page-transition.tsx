import { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { useRouter, useRouterState } from "@tanstack/react-router";

/**
 * Reusable Three.js page-transition LOADER.
 * - Only visible while the router is pending/loading.
 * - Non-blocking (pointer-events none) — never traps user interaction.
 * - Compact spherical blast of glassy neon cubes, transparent greenish aura.
 * - Loops radial propagation as long as loading continues.
 */
export default function PageTransition() {
  const router = useRouter();
  const status = useRouterState({ select: (s) => s.status });
  const isLoading = useRouterState({ select: (s) => s.isLoading });
  const isTransitioning = useRouterState({ select: (s) => s.isTransitioning });
  const isPending = status === "pending" || isLoading || isTransitioning;

  const [active, setActive] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const activeRef = useRef(false);
  const pendingRef = useRef(false);
  const progressRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Compact loader size (centered card, not fullscreen)
    const SIZE = 260;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.setSize(SIZE, SIZE, false);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 200);
    camera.position.set(0, 0, 44);

    scene.add(
      new THREE.AmbientLight(0xffffff, 0.9),
      (() => { const l = new THREE.PointLight(0x9dff9a, 1.4); l.position.set(20, 18, 30); return l; })(),
      (() => { const l = new THREE.PointLight(0xd8ff6a, 0.8); l.position.set(-18, -14, 20); return l; })(),
    );

    const group = new THREE.Group();
    scene.add(group);

    const sphereRadius = 8;
    const particleCount = 64;
    const startRadius = 28;
    const blastMax = 34;

    // soft neon-green aura
    const aura = new THREE.Mesh(
      new THREE.SphereGeometry(sphereRadius * 1.3, 32, 16),
      new THREE.MeshBasicMaterial({
        color: 0x8cff9a,
        transparent: true,
        opacity: 0.14,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    group.add(aura);

    const geometry = new THREE.BoxGeometry(1.1, 1.1, 1.1);
    const cubes: THREE.Mesh<THREE.BoxGeometry, THREE.MeshPhysicalMaterial>[] = [];
    const spherePositions: THREE.Vector3[] = [];
    const startPositions: THREE.Vector3[] = [];
    const dirs: THREE.Vector3[] = [];

    for (let i = 0; i < particleCount; i++) {
      const mat = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color().setHSL(0.28 + Math.random() * 0.08, 0.85, 0.7),
        metalness: 0,
        roughness: 0.05,
        transmission: 1,
        transparent: true,
        opacity: 0.55,
        ior: 1.45,
        clearcoat: 1,
        clearcoatRoughness: 0.05,
        emissive: new THREE.Color(0x9dff7a),
        emissiveIntensity: 0.6,
      });
      const mesh = new THREE.Mesh(geometry, mat);
      const u = 2 * (i + 0.5) / particleCount - 1;
      const theta = Math.acos(u);
      const phi = 2 * Math.PI * (i + 0.5) / (1 + Math.sqrt(5));
      const sx = Math.sin(theta) * Math.cos(phi) * sphereRadius;
      const sy = Math.sin(theta) * Math.sin(phi) * sphereRadius;
      const sz = Math.cos(theta) * sphereRadius;
      const sphere = new THREE.Vector3(sx, sy, sz);
      const dir = sphere.clone().normalize();
      const start = dir.clone().multiplyScalar(startRadius + Math.random() * 6);
      mesh.position.copy(start);
      mesh.scale.setScalar(0.6 + Math.random() * 0.5);
      mesh.rotation.set(Math.random(), Math.random(), Math.random());
      spherePositions.push(sphere);
      startPositions.push(start);
      dirs.push(dir);
      cubes.push(mesh);
      group.add(mesh);
    }

    let rafId = 0;
    const animate = () => {
      group.rotation.y += 0.008;
      group.rotation.x = Math.sin(performance.now() * 0.001) * 0.12;

      if (activeRef.current) {
        // faster loop cycle
        progressRef.current += 0.018;
        if (progressRef.current >= 1) {
          if (pendingRef.current) {
            progressRef.current = 0; // loop while loading
          } else {
            activeRef.current = false;
            setActive(false);
            progressRef.current = 0;
          }
        }
        const p = progressRef.current;
        // radial propagation: implode (0->0.35) then blast outward (0.35->1)
        const collapse = Math.min(1, p / 0.35);
        const blast = Math.max(0, (p - 0.35) / 0.65);
        const cEase = 1 - Math.pow(1 - collapse, 3);
        const bEase = 1 - Math.pow(1 - blast, 3);

        cubes.forEach((cube, i) => {
          const s = spherePositions[i];
          const st = startPositions[i];
          const d = dirs[i];
          if (p < 0.35) {
            cube.position.lerpVectors(st, s, cEase);
            cube.material.opacity = 0.35 + cEase * 0.35;
          } else {
            const dist = bEase * blastMax;
            cube.position.set(s.x + d.x * dist, s.y + d.y * dist, s.z + d.z * dist);
            cube.material.opacity = Math.max(0.05, 0.7 - bEase * 0.7);
          }
          cube.rotation.x += 0.05;
          cube.rotation.y += 0.06;
        });

        const auraPulse = p < 0.35 ? cEase * 0.5 : 0.5 + bEase * 0.7;
        aura.scale.setScalar(1 + auraPulse * 0.5);
        (aura.material as THREE.MeshBasicMaterial).opacity = Math.max(0.08, 0.32 - bEase * 0.24);
      }

      renderer.render(scene, camera);
      rafId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(rafId);
      geometry.dispose();
      cubes.forEach((c) => c.material.dispose());
      aura.geometry.dispose();
      (aura.material as THREE.Material).dispose();
      renderer.dispose();
    };
  }, []);

  const startTransition = useCallback(() => {
    if (activeRef.current) return;
    activeRef.current = true;
    progressRef.current = 0;
    setActive(true);
  }, []);

  useEffect(() => {
    pendingRef.current = isPending;
    if (isPending && !activeRef.current) startTransition();
  }, [isPending, startTransition]);

  useEffect(() => {
    const unsubscribe = router.subscribe("onBeforeNavigate", startTransition);
    return unsubscribe;
  }, [router, startTransition]);

  return (
    <div
      ref={wrapperRef}
      className={active ? "page-transition-wrapper active" : "page-transition-wrapper"}
      aria-hidden={!active}
      role="status"
    >
      <div className="page-transition-loader">
        <canvas ref={canvasRef} className="page-transition-canvas" width={260} height={260} />
        <span className="page-transition-label">Loading…</span>
      </div>
    </div>
  );
}
