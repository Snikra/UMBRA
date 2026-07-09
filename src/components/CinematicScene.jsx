import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import * as THREE from 'three';

// ─── POSIÇÃO DA LUA ─────────────────────────────────────────────────────────
const MOON_POS = [0, 28, -12];

// ─── CAMINHO CONTÍNUO DA CÂMERA ─────────────────────────────────────────────
// Em vez de saltos discretos, a câmera segue um caminho suave baseado no tempo.
// progress vai de 0.0 (rua) a 1.0 (lua) de forma contínua.

const WAYPOINTS = [
  { t: 0.0,  camY: 2.5,  camZ: 14, lookY: 3.5,  lookZ: -30, moonGlow: 0,    particles: 0,    sky: 0.40, windowGlow: 1.0 },
  { t: 0.15, camY: 4,    camZ: 13.5, lookY: 7,   lookZ: -25, moonGlow: 0,    particles: 0,    sky: 0.35, windowGlow: 0.9 },
  { t: 0.30, camY: 7,    camZ: 13, lookY: 12,    lookZ: -18, moonGlow: 0.03, particles: 0.05, sky: 0.25, windowGlow: 0.7 },
  { t: 0.45, camY: 12,   camZ: 12, lookY: 18,    lookZ: -14, moonGlow: 0.08, particles: 0.15, sky: 0.15, windowGlow: 0.5 },
  { t: 0.60, camY: 17,   camZ: 11, lookY: 23,    lookZ: -12, moonGlow: 0.18, particles: 0.30, sky: 0.06, windowGlow: 0.25 },
  { t: 0.75, camY: 21,   camZ: 10.5, lookY: 26,  lookZ: -12, moonGlow: 0.40, particles: 0.50, sky: 0.02, windowGlow: 0.08 },
  { t: 0.88, camY: 24,   camZ: 10, lookY: 28,    lookZ: -12, moonGlow: 1.0,  particles: 0.85, sky: 0.0,  windowGlow: 0.0 },
  { t: 1.0,  camY: 25,   camZ: 10, lookY: 28,    lookZ: -12, moonGlow: 0.8,  particles: 0.7,  sky: 0.0,  windowGlow: 0.0 },
];

function sampleJourney(progress) {
  // Clamp
  const t = Math.max(0, Math.min(1, progress));

  // Encontra os dois waypoints entre os quais estamos
  let a = WAYPOINTS[0], b = WAYPOINTS[WAYPOINTS.length - 1];
  for (let i = 0; i < WAYPOINTS.length - 1; i++) {
    if (t >= WAYPOINTS[i].t && t <= WAYPOINTS[i + 1].t) {
      a = WAYPOINTS[i];
      b = WAYPOINTS[i + 1];
      break;
    }
  }

  // Interpolação local entre a e b (smootherstep para fluidez máxima, zero solavancos)
  const localT = (b.t - a.t) > 0 ? (t - a.t) / (b.t - a.t) : 0;
  const s = localT * localT * localT * (localT * (localT * 6 - 15) + 10); // smootherstep

  const lerp = (v0, v1) => v0 + (v1 - v0) * s;

  return {
    camPos:     [0, lerp(a.camY, b.camY), lerp(a.camZ, b.camZ)],
    lookAt:     [0, lerp(a.lookY, b.lookY), lerp(a.lookZ, b.lookZ)],
    moonGlow:   lerp(a.moonGlow, b.moonGlow),
    particles:  lerp(a.particles, b.particles),
    sky:        lerp(a.sky, b.sky),
    windowGlow: lerp(a.windowGlow, b.windowGlow),
  };
}

// ─── JANELAS ILUMINADAS ─────────────────────────────────────────────────────
function createWindowTexture(cols, rows) {
  const s = 128;
  const c = document.createElement('canvas');
  c.width = s; c.height = s;
  const ctx = c.getContext('2d');

  // Fachada
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, s, s);

  const cellW = s / cols, cellH = s / rows, pad = 2;
  for (let r = 0; r < rows; r++) {
    for (let col = 0; col < cols; col++) {
      if (Math.random() > 0.45) continue;
      const warm = Math.random();
      ctx.fillStyle = `rgba(255, ${Math.floor(180 + warm * 60)}, ${Math.floor(100 + warm * 40)}, ${(Math.random() * 0.4 + 0.35).toFixed(2)})`;
      ctx.fillRect(col * cellW + pad, r * cellH + pad, cellW - pad * 2, cellH - pad * 2);
    }
  }

  return new THREE.CanvasTexture(c);
}

// ─── PRÉDIOS ─────────────────────────────────────────────────────────────────
function CityBuildings({ windowMatRefs }) {
  const buildings = useMemo(() => {
    const list = [];
    const left = [
      { x: -5,   z: 8,   w: 4.5, h: 10, d: 6, c: 4, r: 6 },
      { x: -6,   z: -1,  w: 5,   h: 16, d: 7, c: 5, r: 10 },
      { x: -5,   z: -10, w: 4,   h: 8,  d: 5, c: 3, r: 5 },
      { x: -6.5, z: -18, w: 5.5, h: 20, d: 7, c: 5, r: 12 },
      { x: -5,   z: -27, w: 4,   h: 12, d: 5, c: 4, r: 8 },
      { x: -6,   z: -35, w: 5,   h: 18, d: 6, c: 5, r: 11 },
    ];
    const right = [
      { x: 5,    z: 7,   w: 4.5, h: 13, d: 6, c: 4, r: 8 },
      { x: 6,    z: -2,  w: 5,   h: 18, d: 7, c: 5, r: 11 },
      { x: 5,    z: -11, w: 4,   h: 9,  d: 5, c: 3, r: 6 },
      { x: 6.5,  z: -20, w: 5.5, h: 22, d: 7, c: 5, r: 14 },
      { x: 5,    z: -28, w: 4,   h: 15, d: 5, c: 4, r: 9 },
      { x: 6,    z: -36, w: 5,   h: 14, d: 6, c: 5, r: 9 },
    ];
    [...left, ...right].forEach((b, i) => {
      list.push({
        id: i, position: [b.x, b.h / 2, b.z], size: [b.w, b.h, b.d],
        tex: createWindowTexture(b.c, b.r)
      });
    });
    return list;
  }, []);

  return (
    <group>
      {buildings.map((b, i) => (
        <mesh key={b.id} position={b.position}>
          <boxGeometry args={b.size} />
          <meshStandardMaterial
            ref={(el) => { if (el && windowMatRefs.current) windowMatRefs.current[i] = el; }}
            map={b.tex}
            emissiveMap={b.tex}
            emissive="#ffcc88"
            emissiveIntensity={1.0}
            roughness={0.85}
            metalness={0.05}
            color="#2a2a40"
          />
        </mesh>
      ))}

      {/* Asfalto */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, -10]}>
        <planeGeometry args={[6.5, 80]} />
        <meshStandardMaterial color="#181818" roughness={0.95} />
      </mesh>

      {/* Faixas da rua */}
      {[-6, 0, 6, 12, 18].map((z, i) => (
        <mesh key={`line-${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, -z]}>
          <planeGeometry args={[0.15, 2.5]} />
          <meshBasicMaterial color="#444444" />
        </mesh>
      ))}
    </group>
  );
}

// ─── LUA DE SANGUE ───────────────────────────────────────────────────────────
function BloodMoon({ matRef, glow1Ref, glow2Ref }) {
  const moonMesh = useRef();

  const tex = useMemo(() => {
    const s = 512;
    const c = document.createElement('canvas');
    c.width = s; c.height = s;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#3d0000';
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 300; i++) {
      const x = Math.random() * s, y = Math.random() * s;
      const r = Math.random() * 16 + 1;
      const a = Math.random() * 0.35 + 0.05;
      const dk = Math.random() > 0.5;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, dk ? `rgba(0,0,0,${a + 0.2})` : `rgba(190,0,0,${a})`);
      g.addColorStop(0.6, dk ? `rgba(15,0,0,${a})` : `rgba(110,0,0,${a * 0.5})`);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = g; ctx.fill();
    }
    return new THREE.CanvasTexture(c);
  }, []);

  useFrame(({ clock }) => {
    if (moonMesh.current) {
      moonMesh.current.scale.setScalar(1 + Math.sin(clock.getElapsedTime() * 0.6) * 0.015);
      moonMesh.current.rotation.y += 0.001;
    }
  });

  return (
    <group position={MOON_POS}>
      <mesh><sphereGeometry args={[7, 32, 32]} /><meshBasicMaterial ref={glow2Ref} color="#770000" transparent opacity={0} blending={THREE.AdditiveBlending} side={THREE.BackSide} /></mesh>
      <mesh><sphereGeometry args={[4.5, 32, 32]} /><meshBasicMaterial ref={glow1Ref} color="#ff2200" transparent opacity={0} blending={THREE.AdditiveBlending} side={THREE.BackSide} /></mesh>
      <mesh rotation={[0.3, 0, 0]}><torusGeometry args={[4, 0.06, 8, 80]} /><meshBasicMaterial color="#ff2200" transparent opacity={0.12} /></mesh>
      <mesh ref={moonMesh}><sphereGeometry args={[3, 64, 64]} /><meshStandardMaterial ref={matRef} map={tex} roughness={0.95} metalness={0.05} emissiveMap={tex} emissive="#cc0000" emissiveIntensity={0} /></mesh>
    </group>
  );
}

// ─── CINZAS ──────────────────────────────────────────────────────────────────
function AshParticles({ count = 500, matRef }) {
  const pts = useRef();
  const { positions, velocities } = useMemo(() => {
    const p = new Float32Array(count * 3), v = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      p[i*3]=(Math.random()-0.5)*25; p[i*3+1]=Math.random()*35+2; p[i*3+2]=(Math.random()-0.5)*40;
      v[i*3]=(Math.random()-0.5)*0.012; v[i*3+1]=Math.random()*0.008+0.003; v[i*3+2]=(Math.random()-0.5)*0.008;
    }
    return { positions: p, velocities: v };
  }, [count]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const arr = pts.current.geometry.attributes.position.array;
    for (let i = 0; i < count; i++) {
      arr[i*3] += velocities[i*3]+Math.sin(t*0.2+i)*0.001;
      arr[i*3+1] += velocities[i*3+1];
      arr[i*3+2] += velocities[i*3+2];
      if (arr[i*3+1]>40){arr[i*3+1]=2;arr[i*3]=(Math.random()-0.5)*25;}
    }
    pts.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={pts}>
      <bufferGeometry><bufferAttribute attach="attributes-position" array={positions} count={count} itemSize={3} /></bufferGeometry>
      <pointsMaterial ref={matRef} size={0.12} color="#ff5522" transparent opacity={0} sizeAttenuation blending={THREE.AdditiveBlending} />
    </points>
  );
}

// ─── CONTROLADOR FLUIDO ──────────────────────────────────────────────────────
// A câmera sobe continuamente baseada no tempo total desde o início.
// Duração total da intro: ~38 segundos (6 frases com fade in/out).
const TOTAL_DURATION = 46; // segundos

function Director({ currentLine, isFinal, moonMat, particlesMat, glow1, glow2, ambLight, windowMats, hasStarted }) {
  const { camera } = useThree();
  const startTime = useRef(null);
  const mouse = useRef({ x: 0, y: 0 });
  const mLerp = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const fn = (e) => {
      mouse.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouse.current.y = -(e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('mousemove', fn);
    return () => window.removeEventListener('mousemove', fn);
  }, []);

  useFrame(({ clock }) => {
    // Só inicia o relógio quando a intro for oficialmente iniciada
    if (!hasStarted) {
      startTime.current = null; // mantem o start parado
      return; // A cena fica parada no primeiro frame
    }
    
    if (startTime.current === null) startTime.current = clock.getElapsedTime();
    const elapsed = clock.getElapsedTime() - startTime.current;

    // Progress contínuo de 0 → 1 ao longo da intro inteira
    let progress = Math.min(elapsed / TOTAL_DURATION, 1.0);

    // Se o botão final apareceu, fixa em 1.0
    if (isFinal) progress = 1.0;

    // Amostra o caminho contínuo
    const state = sampleJourney(progress);

    // Aplica posição da câmera diretamente (sem lerp — o smoothstep já suaviza)
    const targetPos = new THREE.Vector3(...state.camPos);
    const targetLook = new THREE.Vector3(...state.lookAt);

    // Mouse parallax quando perto da lua
    if (progress > 0.75) {
      mLerp.current.x += (mouse.current.x - mLerp.current.x) * 0.04;
      mLerp.current.y += (mouse.current.y - mLerp.current.y) * 0.04;
      const strength = (progress - 0.75) / 0.25; // 0→1 nos últimos 25%
      targetPos.x += mLerp.current.x * 1.5 * strength;
      targetPos.y += mLerp.current.y * 0.8 * strength;
    }

    camera.position.copy(targetPos);
    camera.lookAt(targetLook);

    // Lua emissive
    if (moonMat.current) moonMat.current.emissiveIntensity = state.moonGlow;
    // Glow
    if (glow1.current) glow1.current.opacity = state.moonGlow * 0.4;
    if (glow2.current) glow2.current.opacity = state.moonGlow * 0.25;
    // Partículas
    if (particlesMat.current) particlesMat.current.opacity = state.particles;
    // Luz ambiente
    if (ambLight.current) ambLight.current.intensity = state.sky;
    // Janelas
    if (windowMats.current) {
      windowMats.current.forEach((mat) => {
        if (mat) mat.emissiveIntensity = state.windowGlow;
      });
    }
  });

  return null;
}

// ─── CENA PRINCIPAL ──────────────────────────────────────────────────────────
export default function CinematicScene({ currentLine = 0, isFinal = false, hasStarted = false }) {
  const moonMat = useRef(), particlesMat = useRef();
  const glow1 = useRef(), glow2 = useRef();
  const ambLight = useRef();
  const windowMats = useRef([]);

  return (
    <Canvas
      camera={{ position: [0, 2.5, 14], fov: 60, near: 0.1, far: 300 }}
      gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.0 }}
      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }}
    >
      <ambientLight ref={ambLight} intensity={0.40} color="#556" />

      {/* Postes — mais claros */}
      <pointLight position={[-3, 5, 10]}  color="#ffdd88" intensity={1.0} distance={20} />
      <pointLight position={[3,  5, 10]}  color="#ffdd88" intensity={1.0} distance={20} />
      <pointLight position={[-3, 5, 0]}   color="#ffcc66" intensity={0.7} distance={20} />
      <pointLight position={[3,  5, 0]}   color="#ffcc66" intensity={0.7} distance={20} />
      <pointLight position={[-3, 5, -12]} color="#ffaa44" intensity={0.4} distance={18} />
      <pointLight position={[3,  5, -12]} color="#ffaa44" intensity={0.4} distance={18} />

      {/* Luz da Lua */}
      <pointLight position={MOON_POS} color="#ff2200" intensity={6} distance={90} />

      <fog attach="fog" color="#080012" near={40} far={110} />

      <Stars radius={180} depth={80} count={2500} factor={2.5} saturation={0.2} fade speed={0.1} />

      <CityBuildings windowMatRefs={windowMats} />
      <BloodMoon matRef={moonMat} glow1Ref={glow1} glow2Ref={glow2} />
      <AshParticles count={500} matRef={particlesMat} />

      <Director
        currentLine={currentLine}
        isFinal={isFinal}
        moonMat={moonMat}
        particlesMat={particlesMat}
        glow1={glow1}
        glow2={glow2}
        ambLight={ambLight}
        windowMats={windowMats}
        hasStarted={hasStarted}
      />
    </Canvas>
  );
}
