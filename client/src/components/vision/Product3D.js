'use client';

import { useEffect, useRef, useState } from 'react';

/*
  Interactive 3D product model (three.js, loaded on demand).
  Models are built from geometry, not scanned, so they are illustrative:
  - Wiper Blades: a pair of beam blades at their real relative lengths
  - Rain Repellent: an atomiser bottle
  - Washer Fluid: effervescent tablets
  - Microfiber Towel: a folded waffle-weave cloth
*/

function bladeGeometry(THREE, lengthIn) {
  const L = lengthIn * 0.12; // scene units
  const curve = new THREE.CatmullRomCurve3(
    Array.from({ length: 9 }, (_, i) => {
      const t = i / 8 - 0.5;
      return new THREE.Vector3(t * L, -Math.pow(t * 2, 2) * 0.08 * L * 0.25, 0);
    })
  );
  // Spoiler cross-section (an asymmetric aerofoil), extruded along the slightly curved beam
  const spoiler = new THREE.Shape();
  spoiler.moveTo(-0.11, 0);
  spoiler.lineTo(0.11, 0);
  spoiler.quadraticCurveTo(0.1, 0.09, 0.02, 0.17);
  spoiler.quadraticCurveTo(-0.07, 0.09, -0.11, 0.02);
  spoiler.closePath();
  const rubber = new THREE.Shape();
  rubber.moveTo(-0.025, 0);
  rubber.lineTo(0.025, 0);
  rubber.lineTo(0.008, -0.09);
  rubber.lineTo(-0.008, -0.09);
  rubber.closePath();
  const rail = new THREE.Shape();
  rail.moveTo(-0.115, -0.005);
  rail.lineTo(0.115, -0.005);
  rail.lineTo(0.115, 0.012);
  rail.lineTo(-0.115, 0.012);
  rail.closePath();
  const opts = { steps: 80, bevelEnabled: false, extrudePath: curve };
  return {
    L,
    spoiler: new THREE.ExtrudeGeometry(spoiler, opts),
    rubber: new THREE.ExtrudeGeometry(rubber, opts),
    rail: new THREE.ExtrudeGeometry(rail, opts),
  };
}

function buildModel(THREE, type, lengths, mats) {
  const group = new THREE.Group();
  if (type === 'Wiper Blades') {
    const sizes = lengths?.length ? lengths : [22, 16];
    const sorted = [...sizes].sort((a, b) => b - a);
    sorted.forEach((len, i) => {
      const g = bladeGeometry(THREE, len);
      const blade = new THREE.Group();
      // ExtrudeGeometry along a path places the shape in the path's normal plane; rotate to stand the blade up
      const sp = new THREE.Mesh(g.spoiler, mats.satin);
      const rb = new THREE.Mesh(g.rubber, mats.rubber);
      const rl = new THREE.Mesh(g.rail, mats.steel);
      blade.add(sp, rb, rl);
      // Centre connector with a hook adapter
      const conn = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.16, 0.2, 2, 2, 2), mats.satin);
      conn.position.set(0, 0.17, 0);
      const cap = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.05, 0.21), mats.steel);
      cap.position.set(0, 0.27, 0);
      const hook = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.018, 12, 24, Math.PI), mats.chrome);
      hook.position.set(0.05, 0.3, 0);
      hook.rotation.z = Math.PI;
      // End caps
      for (const s of [-1, 1]) {
        const end = new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 0.12, 4, 12), mats.satin);
        end.rotation.z = Math.PI / 2;
        end.position.set((s * g.L) / 2, 0.05, 0);
        blade.add(end);
      }
      // Electric-blue accent line on the spoiler crest
      const accentCurve = new THREE.LineCurve3(new THREE.Vector3(-g.L / 2 + 0.2, 0.172, 0), new THREE.Vector3(g.L / 2 - 0.2, 0.172, 0));
      const accent = new THREE.Mesh(new THREE.TubeGeometry(accentCurve, 2, 0.006, 6), mats.glow);
      blade.add(conn, cap, hook, accent);
      blade.rotation.x = Math.PI / 2; // shape plane → upright
      blade.position.z = i === 0 ? -0.45 : 0.45;
      blade.position.y = 0;
      group.add(blade);
      blade.userData.length = len;
    });
    group.rotation.x = -Math.PI / 2 + 0.25;
  } else if (type === 'Rain Repellent') {
    const pts = [
      [0, -1.2], [0.42, -1.2], [0.48, -1.12], [0.5, -0.9], [0.5, 0.55], [0.46, 0.75], [0.3, 0.92], [0.2, 1.0], [0.2, 1.12], [0, 1.12],
    ].map(([x, y]) => new THREE.Vector2(x, y));
    const body = new THREE.Mesh(new THREE.LatheGeometry(pts, 64), mats.gloss);
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.505, 0.505, 0.5, 64, 1, true), mats.steel);
    band.position.y = -0.15;
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.505, 0.006, 8, 96), mats.glow);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.1;
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.26, 0.42, 48), mats.satin);
    cap.position.y = 1.33;
    const nozzle = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.08, 0.1), mats.chrome);
    nozzle.position.set(0.24, 1.44, 0);
    group.add(body, band, ring, cap, nozzle);
    group.rotation.z = 0.08;
  } else if (type === 'Washer Fluid') {
    const tabletGeo = new THREE.CylinderGeometry(0.55, 0.55, 0.16, 64);
    const edgeGeo = new THREE.TorusGeometry(0.55, 0.012, 8, 96);
    [[0, -0.3, 0, 0.1], [0.15, -0.1, 0.1, -0.15], [-0.05, 0.1, -0.05, 0.22], [0.9, -0.42, 0.6, 0.6], [-0.85, -0.42, 0.4, -0.4]].forEach(([x, y, z, r]) => {
      const t = new THREE.Mesh(tabletGeo, mats.tablet);
      t.position.set(x, y, z);
      t.rotation.set(r * 0.4, r, r * 0.3);
      const e = new THREE.Mesh(edgeGeo, mats.glow);
      e.rotation.x = Math.PI / 2;
      e.position.y = 0.08;
      t.add(e);
      group.add(t);
    });
    for (let i = 0; i < 26; i++) {
      const b = new THREE.Mesh(new THREE.SphereGeometry(0.02 + Math.random() * 0.05, 16, 12), mats.bubble);
      b.position.set((Math.random() - 0.5) * 1.6, 0.1 + Math.random() * 1.4, (Math.random() - 0.5) * 1.2);
      group.add(b);
    }
  } else {
    // Microfiber towel: a folded cloth with a waffle-weave texture
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 256;
    const c = canvas.getContext('2d');
    c.fillStyle = '#1b2433';
    c.fillRect(0, 0, 256, 256);
    c.strokeStyle = '#2c3a52';
    c.lineWidth = 6;
    for (let i = 0; i <= 256; i += 32) {
      c.beginPath(); c.moveTo(i, 0); c.lineTo(i, 256); c.stroke();
      c.beginPath(); c.moveTo(0, i); c.lineTo(256, i); c.stroke();
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(4, 4);
    tex.colorSpace = THREE.SRGBColorSpace;
    const mat = new THREE.MeshPhysicalMaterial({ map: tex, roughness: 0.95, sheen: 1, sheenColor: new THREE.Color('#8fd0ff'), sheenRoughness: 0.6 });
    for (let layer = 0; layer < 3; layer++) {
      const geo = new THREE.PlaneGeometry(2.6, 1.9, 60, 40);
      const pos = geo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        pos.setZ(i, Math.sin(x * 2.2 + layer) * 0.06 + Math.cos(y * 3 + layer * 2) * 0.04 + (layer === 2 ? Math.max(0, x - 0.6) ** 2 * 0.5 : 0));
      }
      geo.computeVertexNormals();
      const m = new THREE.Mesh(geo, mat);
      m.rotation.x = -Math.PI / 2 + 0.05;
      m.position.y = -0.4 + layer * 0.07;
      m.rotation.z = layer * 0.05;
      m.scale.setScalar(1 - layer * 0.08);
      group.add(m);
    }
    const edge = new THREE.Mesh(new THREE.TubeGeometry(new THREE.LineCurve3(new THREE.Vector3(-1.3, -0.2, 0.95), new THREE.Vector3(1.3, -0.2, 0.95)), 2, 0.006, 6), mats.glow);
    group.add(edge);
  }
  return group;
}

const DISTANCE = { 'Wiper Blades': 6.4, 'Rain Repellent': 7.6, 'Washer Fluid': 6.2, 'Microfiber Towel': 6.2 };

export default function Product3D({ type, lengths, className = '', label, vignette = false }) {
  const mountRef = useRef(null);
  const apiRef = useRef(null);
  const [state, setState] = useState('loading'); // loading | ready | fallback
  // A stable key, so a new array with the same sizes doesn't rebuild the scene
  const lengthsKey = (lengths || []).join(',');

  useEffect(() => {
    const sizes = lengthsKey ? lengthsKey.split(',').map(Number) : [];
    let disposed = false;
    let cleanup = () => {};
    (async () => {
      try {
        const THREE = await import('three');
        const { OrbitControls } = await import('three/examples/jsm/controls/OrbitControls.js');
        const { RoomEnvironment } = await import('three/examples/jsm/environments/RoomEnvironment.js');
        if (disposed || !mountRef.current) return;
        const mount = mountRef.current;
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.05;
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        mount.appendChild(renderer.domElement);
        renderer.domElement.setAttribute('aria-hidden', 'true');

        const scene = new THREE.Scene();
        const pmrem = new THREE.PMREMGenerator(renderer);
        scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

        const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
        camera.position.set(0, 1.2, DISTANCE[type] ?? 6.4);

        const key = new THREE.DirectionalLight('#ffffff', 2.2);
        key.position.set(3, 4, 5);
        const rim = new THREE.DirectionalLight('#2f8cff', 3.2);
        rim.position.set(-4, 2, -4);
        const fill = new THREE.HemisphereLight('#bfe3ff', '#05070a', 0.6);
        scene.add(key, rim, fill);

        const mats = {
          satin: new THREE.MeshPhysicalMaterial({ color: '#0d0f13', roughness: 0.42, metalness: 0.2, clearcoat: 0.8, clearcoatRoughness: 0.25 }),
          rubber: new THREE.MeshStandardMaterial({ color: '#050506', roughness: 0.92 }),
          steel: new THREE.MeshStandardMaterial({ color: '#c3cad5', roughness: 0.28, metalness: 1 }),
          chrome: new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.08, metalness: 1 }),
          glow: new THREE.MeshBasicMaterial({ color: '#4aa3ff' }),
          gloss: new THREE.MeshPhysicalMaterial({ color: '#0a1220', roughness: 0.15, metalness: 0.1, clearcoat: 1, clearcoatRoughness: 0.05 }),
          tablet: new THREE.MeshPhysicalMaterial({ color: '#dff1ff', roughness: 0.55, transmission: 0.35, thickness: 0.4 }),
          bubble: new THREE.MeshPhysicalMaterial({ color: '#ffffff', roughness: 0, transmission: 0.9, thickness: 0.05, ior: 1.33 }),
        };

        const model = buildModel(THREE, type, sizes, mats);
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3()).length();
        const center = box.getCenter(new THREE.Vector3());
        model.position.sub(center);
        model.scale.setScalar(3.6 / size);
        scene.add(model);

        // Soft reflective floor glow
        const floor = new THREE.Mesh(
          new THREE.CircleGeometry(2.4, 64),
          new THREE.MeshBasicMaterial({ color: '#2f8cff', transparent: true, opacity: 0.08 })
        );
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = -1.2;
        scene.add(floor);

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.08;
        controls.enablePan = false;
        controls.minDistance = 3;
        controls.maxDistance = 11;
        controls.autoRotate = !reduce;
        controls.autoRotateSpeed = 1.2;
        controls.addEventListener('start', () => (controls.autoRotate = false));

        const resize = () => {
          const w = mount.clientWidth;
          const h = mount.clientHeight;
          renderer.setSize(w, h, false);
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
        };
        resize();
        const ro = new ResizeObserver(resize);
        ro.observe(mount);

        let raf = 0;
        let visible = true;
        const loop = () => {
          controls.update();
          renderer.render(scene, camera);
          if (visible && !document.hidden) raf = requestAnimationFrame(loop);
        };
        const io = new IntersectionObserver(([e]) => {
          visible = e.isIntersecting;
          cancelAnimationFrame(raf);
          if (visible) raf = requestAnimationFrame(loop);
        });
        io.observe(mount);
        loop();

        apiRef.current = {
          rotate: (deg) => {
            controls.autoRotate = false;
            const offset = camera.position.clone().sub(controls.target);
            offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), (deg * Math.PI) / 180);
            camera.position.copy(controls.target).add(offset);
            if (!visible || document.hidden) renderer.render(scene, camera);
          },
          reset: () => {
            camera.position.set(0, 1.2, DISTANCE[type] ?? 6.4);
            controls.target.set(0, 0, 0);
            controls.autoRotate = !reduce;
          },
        };
        setState('ready');

        cleanup = () => {
          cancelAnimationFrame(raf);
          io.disconnect();
          ro.disconnect();
          controls.dispose();
          scene.traverse((o) => {
            o.geometry?.dispose?.();
            if (o.material) [].concat(o.material).forEach((m) => { m.map?.dispose?.(); m.dispose?.(); });
          });
          pmrem.dispose();
          renderer.dispose();
          renderer.domElement.remove();
        };
      } catch (err) {
        console.warn('3D viewer unavailable:', err?.message);
        if (!disposed) setState('fallback');
      }
    })();
    return () => {
      disposed = true;
      cleanup();
    };
  }, [type, lengthsKey]);

  const ariaLabel = label || `Interactive 3D model: ${type}${lengths?.length ? `, ${lengths.join(' and ')} inch` : ''}`;

  return (
    <div className={`${/\b(absolute|fixed)\b/.test(className) ? '' : 'relative '}${className}`} role="group" aria-label={ariaLabel}>
      <div ref={mountRef} data-cursor="Drag" className="absolute inset-0 touch-none [&>canvas]:h-full [&>canvas]:w-full" style={vignette ? { maskImage: 'radial-gradient(closest-side, #000 72%, transparent 100%)', WebkitMaskImage: 'radial-gradient(closest-side, #000 72%, transparent 100%)' } : undefined} />
      {state === 'loading' && (
        <p className="hud absolute inset-0 grid place-items-center">Loading 3D model…</p>
      )}
      {state === 'fallback' && (
        <p className="hud absolute inset-0 grid place-items-center px-6 text-center">3D view isn’t available on this device</p>
      )}
      {state === 'ready' && (
        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between gap-3">
          <p className="hud hidden sm:block">Drag to rotate · scroll to zoom</p>
          <div className="flex gap-2">
            <button type="button" onClick={() => apiRef.current?.rotate(-30)} aria-label="Rotate model left" className="glass grid h-10 w-10 place-items-center rounded-full text-ice hover:border-accent/60">⟲</button>
            <button type="button" onClick={() => apiRef.current?.rotate(30)} aria-label="Rotate model right" className="glass grid h-10 w-10 place-items-center rounded-full text-ice hover:border-accent/60">⟳</button>
            <button type="button" onClick={() => apiRef.current?.reset()} className="glass h-10 rounded-full px-4 font-mono text-[10px] uppercase tracking-[0.2em] text-ice hover:border-accent/60">Reset</button>
          </div>
        </div>
      )}
    </div>
  );
}
