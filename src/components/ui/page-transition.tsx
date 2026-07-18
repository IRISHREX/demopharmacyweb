import { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { useRouter, useRouterState } from "@tanstack/react-router";

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

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x09121f, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(48, window.innerWidth / window.innerHeight, 0.1, 200);
    camera.position.set(0, 0, 58);

    const ambient = new THREE.AmbientLight(0xffffff, 0.8);
    const rim = new THREE.PointLight(0x70a7ff, 1.4);
    rim.position.set(28, 24, 40);
    const accent = new THREE.PointLight(0x4be2ff, 0.9);
    accent.position.set(-25, -16, 22);
    const fill = new THREE.HemisphereLight(0x5a7cff, 0x0a152f, 0.34);

    scene.add(ambient, rim, accent, fill);

    const group = new THREE.Group();
    scene.add(group);

    // particle layout parameters (declare before usage)
    const sphereRadius = 14;
    const particleCount = 78;
    const startRadius = 72;
    const blastMax = 96;

    // aura mesh: a soft, yellow-orange glow that pulses during the transition
    const auraRadius = sphereRadius * 1.28;
    const auraGeo = new THREE.SphereGeometry(auraRadius, 32, 16);
    const auraMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(0x7cff7d),
      transparent: true,
      opacity: 0.16,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const aura = new THREE.Mesh(auraGeo, auraMat);
    aura.renderOrder = 999;
    group.add(aura);

    const geometry = new THREE.BoxGeometry(2.2, 2.2, 2.2);
    const cubes: THREE.Mesh<THREE.BoxGeometry, THREE.MeshPhysicalMaterial>[] = [];
    const startPositions: THREE.Vector3[] = [];
    const spherePositions: THREE.Vector3[] = [];
    const blastDirections: THREE.Vector3[] = [];

    for (let i = 0; i < particleCount; i += 1) {
      const hue = 0.55 + Math.random() * 0.08;
      const material = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color().setHSL(0.33 + Math.random() * 0.04, 0.72, 0.68),
        metalness: 0,
        roughness: 0.02,
        transmission: 0.98,
        transparent: true,
        opacity: 0.1,
        ior: 1.55,
        clearcoat: 1,
        clearcoatRoughness: 0.06,
        reflectivity: 0.72,
        envMapIntensity: 1.2,
        emissive: new THREE.Color(0x7cff7d),
        emissiveIntensity: 0.24,
      });

      const mesh = new THREE.Mesh(geometry, material);
      const u = 2 * (i + 0.5) / particleCount - 1;
      const theta = Math.acos(u);
      const phi = 2 * Math.PI * (i + 0.5) / (1 + Math.sqrt(5));
      const sx = Math.sin(theta) * Math.cos(phi) * sphereRadius;
      const sy = Math.sin(theta) * Math.sin(phi) * sphereRadius;
      const sz = Math.cos(theta) * sphereRadius;
      const spherePosition = new THREE.Vector3(sx, sy, sz);
      const startRadiusOffset = startRadius + Math.random() * 18;
      const startPosition = new THREE.Vector3(
        (sx / sphereRadius) * startRadiusOffset + (Math.random() - 0.5) * 14,
        (sy / sphereRadius) * startRadiusOffset + (Math.random() - 0.5) * 14,
        (sz / sphereRadius) * startRadiusOffset + (Math.random() - 0.5) * 14,
      );
      const direction = spherePosition.clone().normalize();

      mesh.position.copy(startPosition);
      mesh.rotation.set(Math.random() * 0.9, Math.random() * 0.9, Math.random() * 0.9);
      mesh.scale.setScalar(0.9 + Math.random() * 0.14);
      cubes.push(mesh);
      startPositions.push(startPosition);
      spherePositions.push(spherePosition);
      blastDirections.push(direction);
      group.add(mesh);
    }

    const resize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    resize();
    window.addEventListener("resize", resize);

    let rafId = 0;
    const animate = () => {
      group.rotation.y += 0.0022;
      group.rotation.x = Math.sin(performance.now() * 0.00108) * 0.08;

      const wrapper = wrapperRef.current;
      if (activeRef.current) {
        progressRef.current = Math.min(1, progressRef.current + 0.046);
        const progress = progressRef.current;
        const sphereProgress = Math.min(1, progress * 2.4);
        const blastProgress = Math.max(0, (progress - 0.4) * 2.8);
        const sphereEase = progress < 0.4 ? 1 - Math.pow(1 - sphereProgress, 4) : 1;
        const blastEase = progress < 0.4 ? 0 : 1 - Math.pow(1 - blastProgress, 4);

        group.scale.setScalar(1 + sphereEase * 0.18 + blastEase * 0.16);
        camera.position.z = 68 - sphereEase * 6 - blastEase * 10;

        const flash = Math.max(0, 1 - Math.abs(progress - 0.52) * 4.8) * (0.72 + progress * 0.28);
        const overlay = Math.min(0.9, sphereEase * 0.28 + blastEase * 0.88);
        wrapper?.style.setProperty("--transition-flash", flash.toString());
        wrapper?.style.setProperty("--transition-overlay", overlay.toString());

        cubes.forEach((cube, index) => {
          const start = startPositions[index];
          const sphere = spherePositions[index];
          const blast = blastDirections[index];

          if (progress < 0.5) {
            cube.position.lerpVectors(start, sphere, sphereEase);
            cube.material.opacity = 0.78 + sphereEase * 0.22;
            cube.scale.setScalar(0.9 + sphereEase * 0.12);
          } else {
            const blastDistance = blastEase * blastMax + Math.sin(progress * Math.PI + index * 0.36) * 4.4;
            cube.position.set(
              sphere.x + blast.x * blastDistance,
              sphere.y + blast.y * blastDistance,
              sphere.z + blast.z * blastDistance,
            );
            cube.material.opacity = Math.max(0.05, 1 - blastEase * 1.05);
            cube.material.emissiveIntensity = 0.95 + blastEase * 0.48;
            cube.scale.setScalar(1 + blastEase * 0.15);
          }

          cube.rotation.x += 0.009 + index * 0.00005;
          cube.rotation.y += 0.01 + index * 0.00004;
        });

        if (progress >= 1) {
          if (pendingRef.current) {
            progressRef.current = 0;
            wrapper?.style.setProperty("--transition-flash", "0");
            wrapper?.style.setProperty("--transition-overlay", "0");
            cubes.forEach((resetCube, index) => {
              resetCube.position.copy(startPositions[index]);
              resetCube.material.opacity = 1;
              resetCube.material.emissiveIntensity = 0.95;
              resetCube.scale.setScalar(0.9 + Math.random() * 0.14);
            });
            group.scale.setScalar(1);
            camera.position.z = 58;
          } else {
            activeRef.current = false;
            setActive(false);
            progressRef.current = 0;
            wrapper?.style.setProperty("--transition-flash", "0");
            wrapper?.style.setProperty("--transition-overlay", "0");
            cubes.forEach((resetCube, index) => {
              resetCube.position.copy(startPositions[index]);
              resetCube.material.opacity = 1;
              resetCube.material.emissiveIntensity = 0.95;
              resetCube.scale.setScalar(0.9 + Math.random() * 0.14);
            });
            group.scale.setScalar(1);
            camera.position.z = 58;
          }
        }
      } else {
        cubes.forEach((cube, index) => {
          cube.rotation.x += 0.003 + index * 0.00003;
          cube.rotation.y += 0.004 + index * 0.00002;
        });
      }

      // animate aura: pulse while collapsing, bloom on blast
      const progress = progressRef.current;
      const sphereProgress = Math.min(1, progress * 2);
      const blastProgress = Math.max(0, (progress - 0.5) * 2);
      const sphereEase = progress < 0.5 ? 1 - Math.pow(1 - sphereProgress, 3) : 1;
      const blastEase = progress < 0.5 ? 0 : 1 - Math.pow(1 - blastProgress, 3);
      const auraPulse = progress < 0.5 ? sphereEase * 0.6 + Math.sin(progress * Math.PI * 2) * 0.06 : blastEase * 1.0 + 0.1;
      aura.scale.setScalar(1 + auraPulse * 0.5);
      (aura.material as THREE.MeshBasicMaterial).opacity = Math.min(0.95, auraPulse * 0.95);

      renderer.render(scene, camera);
      rafId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
      geometry.dispose();
      cubes.forEach((cube) => cube.material.dispose());
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
    if (isPending && !activeRef.current) {
      startTransition();
    }
  }, [isPending, startTransition]);

  useEffect(() => {
    const unsubscribe = router.subscribe("onBeforeNavigate", startTransition);
    return unsubscribe;
  }, [router, startTransition]);

  return (
    <div ref={wrapperRef} className={active ? "page-transition-wrapper active" : "page-transition-wrapper"}>
      <canvas ref={canvasRef} className="page-transition-canvas" />
      <div className="page-transition-backdrop" />
      <div className="page-transition-flash" />
    </div>
  );
}
