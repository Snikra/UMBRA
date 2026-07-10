import React, { useRef, useMemo, useEffect, memo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import * as THREE from 'three';
import { MUSIC_DROP_TIME } from '../config.js';

// ─── POSIÇÃO DA LUA ─────────────────────────────────────────────────────────
const MOON_POS = [0, 28, -12];

// ─── CAMINHO CONTÍNUO DA CÂMERA ─────────────────────────────────────────────
const WAYPOINTS = [
  { t: 0.0,  camY: 2.5,  camZ: 14,   lookY: 3.5,  lookZ: -30, moonGlow: 0,    particles: 0,    sky: 0.65, windowGlow: 1.0 },
  { t: 0.15, camY: 4,    camZ: 13.5, lookY: 7,    lookZ: -25, moonGlow: 0,    particles: 0,    sky: 0.55, windowGlow: 0.9 },
  { t: 0.30, camY: 7,    camZ: 13,   lookY: 12,   lookZ: -18, moonGlow: 0.05, particles: 0.08, sky: 0.40, windowGlow: 0.7 },
  { t: 0.45, camY: 12,   camZ: 12,   lookY: 18,   lookZ: -14, moonGlow: 0.12, particles: 0.20, sky: 0.25, windowGlow: 0.5 },
  { t: 0.60, camY: 17,   camZ: 11,   lookY: 23,   lookZ: -12, moonGlow: 0.25, particles: 0.35, sky: 0.12, windowGlow: 0.25 },
  { t: 0.75, camY: 21,   camZ: 10.5, lookY: 26,   lookZ: -12, moonGlow: 0.50, particles: 0.55, sky: 0.04, windowGlow: 0.08 },
  { t: 0.88, camY: 24,   camZ: 10,   lookY: 28,   lookZ: -12, moonGlow: 1.0,  particles: 0.85, sky: 0.0,  windowGlow: 0.0 },
  { t: 1.0,  camY: 25,   camZ: 10,   lookY: 28,   lookZ: -12, moonGlow: 0.8,  particles: 0.7,  sky: 0.0,  windowGlow: 0.0 },
];

function sampleJourney(progress) {
  const t = Math.max(0, Math.min(1, progress));
  let a = WAYPOINTS[0], b = WAYPOINTS[WAYPOINTS.length - 1];
  for (let i = 0; i < WAYPOINTS.length - 1; i++) {
    if (t >= WAYPOINTS[i].t && t <= WAYPOINTS[i + 1].t) {
      a = WAYPOINTS[i];
      b = WAYPOINTS[i + 1];
      break;
    }
  }
  const localT = (b.t - a.t) > 0 ? (t - a.t) / (b.t - a.t) : 0;
  const s = localT * localT * localT * (localT * (localT * 6 - 15) + 10);
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

// ─── JANELAS ILUMINADAS (TEXTURA MELHORADA) ──────────────────────────────────
function createWindowTexture(cols, rows) {
  const s = 256;
  const c = document.createElement('canvas');
  c.width = s; c.height = s;
  const ctx = c.getContext('2d');

  // Fachada com cor base
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, s, s);

  const cellW = s / cols, cellH = s / rows, pad = 2;

  // Linhas horizontais entre andares (detalhe arquitetônico)
  for (let r = 1; r < rows; r++) {
    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    ctx.fillRect(0, r * cellH - 1, s, 2);
  }

  // Janelas com moldura
  for (let r = 0; r < rows; r++) {
    for (let col = 0; col < cols; col++) {
      if (Math.random() > 0.50) continue;
      // Moldura da janela
      ctx.fillStyle = 'rgba(80,80,100,0.3)';
      ctx.fillRect(col * cellW + pad - 1, r * cellH + pad - 1, cellW - pad * 2 + 2, cellH - pad * 2 + 2);

      // Luz interna da janela
      const warm = Math.random();
      const brightness = Math.random() * 0.4 + 0.4;
      ctx.fillStyle = `rgba(255, ${Math.floor(180 + warm * 60)}, ${Math.floor(80 + warm * 60)}, ${brightness.toFixed(2)})`;
      ctx.fillRect(col * cellW + pad, r * cellH + pad, cellW - pad * 2, cellH - pad * 2);
    }
  }

  return new THREE.CanvasTexture(c);
}

// ─── PALETA DE CORES DOS PRÉDIOS ─────────────────────────────────────────────
const BUILDING_COLORS = ['#2a2a40', '#252538', '#302a3a', '#1e2035', '#2d2840', '#28253a', '#222240', '#2a253d'];

// ─── PRÉDIOS COM ARQUITETURA ESCALONADA ──────────────────────────────────────
function CityBuildings({ windowMatRefs }) {
  const buildingData = useMemo(() => {
    // Cada prédio agora tem múltiplos "segmentos" empilhados (setbacks)
    const defs = [
      // ESQUERDA — primeiro plano
      { x: -5,   z: 8,   segments: [{ w: 4.5, h: 10, d: 6 }], c: 4, r: 6 },
      { x: -6,   z: -1,  segments: [{ w: 5, h: 11, d: 7 }, { w: 4, h: 5, d: 5.5, ox: 0.3 }], c: 5, r: 10 },
      { x: -5,   z: -10, segments: [{ w: 4, h: 8, d: 5 }], c: 3, r: 5 },
      { x: -6.5, z: -18, segments: [{ w: 5.5, h: 14, d: 7 }, { w: 4.5, h: 4, d: 5.5, ox: 0.2 }, { w: 3.5, h: 3, d: 4, ox: 0.5 }], c: 5, r: 12 },
      { x: -5,   z: -27, segments: [{ w: 4, h: 12, d: 5 }], c: 4, r: 8 },
      { x: -6,   z: -35, segments: [{ w: 5, h: 13, d: 6 }, { w: 4, h: 5, d: 5, ox: 0.3 }], c: 5, r: 11 },
      // ESQUERDA — segundo plano (profundidade)
      { x: -9,   z: 5,   segments: [{ w: 4, h: 14, d: 5 }], c: 3, r: 9 },
      { x: -10,  z: -8,  segments: [{ w: 5, h: 20, d: 6 }, { w: 4, h: 5, d: 4.5, ox: 0.3 }], c: 4, r: 13 },
      { x: -9,   z: -22, segments: [{ w: 4.5, h: 16, d: 5.5 }], c: 4, r: 10 },
      { x: -10,  z: -32, segments: [{ w: 5, h: 24, d: 6 }, { w: 4, h: 6, d: 5, ox: 0.3 }, { w: 3, h: 4, d: 3.5, ox: 0.6 }], c: 5, r: 15 },
      // DIREITA — primeiro plano
      { x: 5,    z: 7,   segments: [{ w: 4.5, h: 9, d: 6 }, { w: 3.5, h: 4, d: 5, ox: -0.2 }], c: 4, r: 8 },
      { x: 6,    z: -2,  segments: [{ w: 5, h: 13, d: 7 }, { w: 4, h: 5, d: 5.5, ox: -0.3 }], c: 5, r: 11 },
      { x: 5,    z: -11, segments: [{ w: 4, h: 9, d: 5 }], c: 3, r: 6 },
      { x: 6.5,  z: -20, segments: [{ w: 5.5, h: 15, d: 7 }, { w: 4.5, h: 5, d: 5.5, ox: -0.2 }, { w: 3.5, h: 3, d: 4, ox: -0.5 }], c: 5, r: 14 },
      { x: 5,    z: -28, segments: [{ w: 4, h: 15, d: 5 }], c: 4, r: 9 },
      { x: 6,    z: -36, segments: [{ w: 5, h: 10, d: 6 }, { w: 4, h: 4, d: 5, ox: -0.3 }], c: 5, r: 9 },
      // DIREITA — segundo plano (profundidade)
      { x: 9,    z: 4,   segments: [{ w: 4, h: 18, d: 5 }], c: 3, r: 11 },
      { x: 10,   z: -6,  segments: [{ w: 5, h: 22, d: 6 }, { w: 4, h: 6, d: 4.5, ox: -0.3 }], c: 4, r: 14 },
      { x: 9,    z: -18, segments: [{ w: 4.5, h: 12, d: 5.5 }], c: 4, r: 8 },
      { x: 10,   z: -30, segments: [{ w: 5, h: 26, d: 6 }, { w: 4, h: 7, d: 5, ox: -0.3 }, { w: 3, h: 4, d: 3.5, ox: -0.6 }], c: 5, r: 16 },
    ];

    return defs.map((def, i) => {
      // Calcula a altura total somando os segmentos
      const totalHeight = def.segments.reduce((sum, seg) => sum + seg.h, 0);
      // Gera a textura para o corpo principal
      const tex = createWindowTexture(def.c, def.r);
      return {
        id: i, def, totalHeight, tex,
        color: BUILDING_COLORS[i % BUILDING_COLORS.length],
      };
    });
  }, []);

  return (
    <group>
      {buildingData.map((b, i) => {
        const { def, totalHeight, tex, color } = b;
        let currentY = 0;

        return (
          <group key={b.id}>
            {/* Segmentos empilhados (setbacks) */}
            {def.segments.map((seg, si) => {
              const yPos = currentY + seg.h / 2;
              const xOffset = seg.ox || 0;
              currentY += seg.h;
              const isBase = si === 0;
              const segTex = isBase ? tex : createWindowTexture(Math.max(2, def.c - 1), Math.max(2, Math.floor(seg.h * 0.6)));

              return (
                <group key={si}>
                  {/* Corpo do segmento */}
                  <mesh position={[def.x + xOffset, yPos, def.z]}>
                    <boxGeometry args={[seg.w, seg.h, seg.d]} />
                    <meshStandardMaterial
                      ref={isBase ? (el) => { if (el && windowMatRefs.current) windowMatRefs.current[i] = el; } : undefined}
                      map={segTex}
                      emissiveMap={segTex}
                      emissive="#ffcc88"
                      emissiveIntensity={1.0}
                      roughness={0.78}
                      metalness={0.10}
                      color={color}
                    />
                  </mesh>

                  {/* Cornija/ledge no topo de cada segmento */}
                  <mesh position={[def.x + xOffset, currentY + 0.08, def.z]}>
                    <boxGeometry args={[seg.w + 0.3, 0.16, seg.d + 0.3]} />
                    <meshStandardMaterial color="#1a1a28" roughness={0.85} metalness={0.15} />
                  </mesh>

                  {/* Faixa decorativa horizontal no meio do segmento */}
                  {seg.h > 8 && (
                    <mesh position={[def.x + xOffset, yPos, def.z + seg.d / 2 + 0.01]}>
                      <planeGeometry args={[seg.w - 0.2, 0.12]} />
                      <meshBasicMaterial color="#3a3a50" />
                    </mesh>
                  )}
                </group>
              );
            })}

            {/* ── DETALHES DO TOPO ── */}
            {(() => {
              const topSeg = def.segments[def.segments.length - 1];
              const topOx = topSeg.ox || 0;
              const topW = topSeg.w;
              const topD = topSeg.d;

              return (
                <group>
                  {/* Casa de máquinas do elevador */}
                  {totalHeight > 12 && (
                    <mesh position={[def.x + topOx + topW * 0.15, totalHeight + 1, def.z - topD * 0.15]}>
                      <boxGeometry args={[1.4, 2, 1.6]} />
                      <meshStandardMaterial color="#1e1e30" roughness={0.90} metalness={0.1} />
                    </mesh>
                  )}

                  {/* Caixa d'água */}
                  {totalHeight > 10 && (
                    <group position={[def.x + topOx - topW * 0.2, totalHeight, def.z + topD * 0.15]}>
                      {/* Base/pernas da caixa d'água */}
                      <mesh position={[-0.3, 0.6, -0.3]}>
                        <cylinderGeometry args={[0.05, 0.05, 1.2, 4]} />
                        <meshStandardMaterial color="#444" metalness={0.7} roughness={0.4} />
                      </mesh>
                      <mesh position={[0.3, 0.6, -0.3]}>
                        <cylinderGeometry args={[0.05, 0.05, 1.2, 4]} />
                        <meshStandardMaterial color="#444" metalness={0.7} roughness={0.4} />
                      </mesh>
                      <mesh position={[-0.3, 0.6, 0.3]}>
                        <cylinderGeometry args={[0.05, 0.05, 1.2, 4]} />
                        <meshStandardMaterial color="#444" metalness={0.7} roughness={0.4} />
                      </mesh>
                      <mesh position={[0.3, 0.6, 0.3]}>
                        <cylinderGeometry args={[0.05, 0.05, 1.2, 4]} />
                        <meshStandardMaterial color="#444" metalness={0.7} roughness={0.4} />
                      </mesh>
                      {/* Tanque */}
                      <mesh position={[0, 1.5, 0]}>
                        <cylinderGeometry args={[0.5, 0.5, 0.8, 8]} />
                        <meshStandardMaterial color="#2a3040" roughness={0.85} metalness={0.2} />
                      </mesh>
                    </group>
                  )}

                  {/* Antena com luz vermelha */}
                  {totalHeight >= 16 && (
                    <group position={[def.x + topOx, totalHeight, def.z]}>
                      <mesh position={[0, 1.5, 0]}>
                        <cylinderGeometry args={[0.03, 0.05, 3, 6]} />
                        <meshStandardMaterial color="#333" metalness={0.8} roughness={0.3} />
                      </mesh>
                      <mesh position={[0, 3.1, 0]}>
                        <sphereGeometry args={[0.08, 8, 8]} />
                        <meshBasicMaterial color="#ff0000" />
                      </mesh>
                      <mesh position={[0, 3.1, 0]}>
                        <sphereGeometry args={[0.4, 8, 8]} />
                        <meshBasicMaterial color="#ff0000" transparent opacity={0.12} blending={THREE.AdditiveBlending} />
                      </mesh>
                    </group>
                  )}

                  {/* Grades de ventilação no topo */}
                  {totalHeight > 8 && i % 2 === 0 && (
                    <mesh position={[def.x + topOx + topW * 0.25, totalHeight + 0.2, def.z + topD * 0.25]}>
                      <boxGeometry args={[0.6, 0.4, 0.6]} />
                      <meshStandardMaterial color="#2a2a35" roughness={0.95} metalness={0.3} />
                    </mesh>
                  )}
                </group>
              );
            })()}

            {/* Unidades de ar-condicionado na fachada */}
            {totalHeight > 8 && (
              <>
                {[0.25, 0.45, 0.65, 0.85].map((pct, ai) => {
                  if (Math.random() > 0.5) return null;
                  const seg0 = def.segments[0];
                  const side = def.x < 0 ? seg0.w / 2 + 0.22 : -(seg0.w / 2 + 0.22);
                  return (
                    <mesh key={ai} position={[def.x + side, totalHeight * pct, def.z + (ai % 2 - 0.5) * seg0.d * 0.5]}>
                      <boxGeometry args={[0.4, 0.3, 0.5]} />
                      <meshStandardMaterial color="#2a2a32" roughness={0.95} metalness={0.15} />
                    </mesh>
                  );
                })}
              </>
            )}
          </group>
        );
      })}

      {/* ── RUA ── */}
      {/* Calçadas elevadas */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-4.2, 0.08, -10]}>
        <planeGeometry args={[3.5, 90]} />
        <meshStandardMaterial color="#252525" roughness={0.90} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[4.2, 0.08, -10]}>
        <planeGeometry args={[3.5, 90]} />
        <meshStandardMaterial color="#252525" roughness={0.90} />
      </mesh>

      {/* Meio-fio */}
      <mesh position={[-2.45, 0.06, -10]}>
        <boxGeometry args={[0.14, 0.14, 90]} />
        <meshStandardMaterial color="#3a3a3a" roughness={0.85} />
      </mesh>
      <mesh position={[2.45, 0.06, -10]}>
        <boxGeometry args={[0.14, 0.14, 90]} />
        <meshStandardMaterial color="#3a3a3a" roughness={0.85} />
      </mesh>

      {/* Asfalto */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, -10]}>
        <planeGeometry args={[4.9, 90]} />
        <meshStandardMaterial color="#1c1c1c" roughness={0.92} />
      </mesh>

      {/* Faixas da rua */}
      {[-6, 0, 6, 12, 18, 24, 30, 36].map((z, i) => (
        <mesh key={`line-${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, -z]}>
          <planeGeometry args={[0.15, 2.5]} />
          <meshBasicMaterial color="#555555" />
        </mesh>
      ))}

      {/* Postes de luz na rua */}
      {[8, 0, -10, -20, -30].map((z, i) => (
        <group key={`post-${i}`}>
          {/* Poste esquerdo */}
          <mesh position={[-2.6, 2.5, z]}>
            <cylinderGeometry args={[0.04, 0.06, 5, 6]} />
            <meshStandardMaterial color="#333" metalness={0.7} roughness={0.4} />
          </mesh>
          <mesh position={[-2.6, 5.1, z]}>
            <sphereGeometry args={[0.12, 8, 8]} />
            <meshBasicMaterial color="#ffdd88" />
          </mesh>
          {/* Poste direito */}
          <mesh position={[2.6, 2.5, z]}>
            <cylinderGeometry args={[0.04, 0.06, 5, 6]} />
            <meshStandardMaterial color="#333" metalness={0.7} roughness={0.4} />
          </mesh>
          <mesh position={[2.6, 5.1, z]}>
            <sphereGeometry args={[0.12, 8, 8]} />
            <meshBasicMaterial color="#ffdd88" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// ─── LUA DE SANGUE (HD + HALOS MAIORES) ──────────────────────────────────────
function BloodMoon({ matRef, glow1Ref, glow2Ref, glow3Ref }) {
  const moonMesh = useRef();
  const ringRef = useRef();

  const tex = useMemo(() => {
    const s = 1024;
    const c = document.createElement('canvas');
    c.width = s; c.height = s;
    const ctx = c.getContext('2d');

    // Base mais vibrante
    ctx.fillStyle = '#5a0000';
    ctx.fillRect(0, 0, s, s);

    // Camadas de crateras com mais contraste
    for (let i = 0; i < 500; i++) {
      const x = Math.random() * s, y = Math.random() * s;
      const r = Math.random() * 25 + 2;
      const a = Math.random() * 0.40 + 0.08;
      const dk = Math.random() > 0.4;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      if (dk) {
        g.addColorStop(0, `rgba(0,0,0,${a + 0.25})`);
        g.addColorStop(0.5, `rgba(20,0,0,${a})`);
      } else {
        g.addColorStop(0, `rgba(220,20,0,${a})`);
        g.addColorStop(0.5, `rgba(140,0,0,${a * 0.6})`);
      }
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = g; ctx.fill();
    }

    // Veios de lava (linhas vermelhas brilhantes)
    ctx.strokeStyle = 'rgba(255, 40, 0, 0.08)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 15; i++) {
      ctx.beginPath();
      let px = Math.random() * s, py = Math.random() * s;
      ctx.moveTo(px, py);
      for (let j = 0; j < 5; j++) {
        px += (Math.random() - 0.5) * 100;
        py += (Math.random() - 0.5) * 100;
        ctx.lineTo(px, py);
      }
      ctx.stroke();
    }

    return new THREE.CanvasTexture(c);
  }, []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (moonMesh.current) {
      moonMesh.current.scale.setScalar(1 + Math.sin(t * 0.6) * 0.018);
      moonMesh.current.rotation.y += 0.0008;
    }
    // Anel pulsante
    if (ringRef.current) {
      ringRef.current.material.opacity = 0.18 + Math.sin(t * 1.2) * 0.08;
    }
  });

  return (
    <group position={MOON_POS}>
      {/* Halo ultra-suave gigante (atmosfera) */}
      <mesh><sphereGeometry args={[18, 32, 32]} /><meshBasicMaterial ref={glow3Ref} color="#440000" transparent opacity={0} blending={THREE.AdditiveBlending} side={THREE.BackSide} /></mesh>
      {/* Halo externo */}
      <mesh><sphereGeometry args={[12, 32, 32]} /><meshBasicMaterial ref={glow2Ref} color="#770000" transparent opacity={0} blending={THREE.AdditiveBlending} side={THREE.BackSide} /></mesh>
      {/* Halo interno brilhante */}
      <mesh><sphereGeometry args={[8, 32, 32]} /><meshBasicMaterial ref={glow1Ref} color="#ff2200" transparent opacity={0} blending={THREE.AdditiveBlending} side={THREE.BackSide} /></mesh>
      {/* Anel da Lua (pulsante) */}
      <mesh ref={ringRef} rotation={[0.3, 0, 0]}><torusGeometry args={[6.2, 0.1, 8, 80]} /><meshBasicMaterial color="#ff2200" transparent opacity={0.25} /></mesh>
      {/* Segundo anel mais largo e sutil */}
      <mesh rotation={[-0.15, 0.4, 0.1]}><torusGeometry args={[8.0, 0.05, 8, 80]} /><meshBasicMaterial color="#ff4400" transparent opacity={0.06} /></mesh>
      {/* Corpo da Lua HD */}
      <mesh ref={moonMesh}><sphereGeometry args={[4.8, 64, 64]} /><meshStandardMaterial ref={matRef} map={tex} roughness={0.90} metalness={0.08} emissiveMap={tex} emissive="#cc0000" emissiveIntensity={0} /></mesh>
    </group>
  );
}

// ─── GOD RAYS (RAIOS DE LUZ DA LUA) ─────────────────────────────────────────
function GodRays({ matRef }) {
  const groupRef = useRef();

  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.rotation.z = Math.sin(clock.getElapsedTime() * 0.1) * 0.03;
    }
  });

  const rays = useMemo(() => {
    const r = [];
    const count = 6;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.3;
      const length = 18 + Math.random() * 10;
      const width = 0.4 + Math.random() * 0.5;
      r.push({ angle, length, width, key: i });
    }
    return r;
  }, []);

  return (
    <group ref={groupRef} position={MOON_POS}>
      {rays.map(ray => (
        <mesh key={ray.key} rotation={[0, 0, ray.angle]} position={[Math.cos(ray.angle) * ray.length / 2, Math.sin(ray.angle) * ray.length / 2, 0]}>
          <planeGeometry args={[ray.width, ray.length]} />
          <meshBasicMaterial ref={ray.key === 0 ? matRef : undefined} color="#ff1100" transparent opacity={0} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

// ─── CINZAS ──────────────────────────────────────────────────────────────────
function AshParticles({ count = 600, matRef }) {
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

// ─── POEIRA DA RUA ───────────────────────────────────────────────────────────
function StreetDust({ count = 200 }) {
  const pts = useRef();
  const positions = useMemo(() => {
    const p = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      p[i*3] = (Math.random() - 0.5) * 12;
      p[i*3+1] = Math.random() * 2 + 0.1;
      p[i*3+2] = Math.random() * 30 - 5;
    }
    return p;
  }, [count]);

  useFrame(({ clock }) => {
    const arr = pts.current.geometry.attributes.position.array;
    const t = clock.getElapsedTime();
    for (let i = 0; i < count; i++) {
      arr[i*3] += Math.sin(t * 0.3 + i) * 0.002;
      arr[i*3+1] += Math.sin(t * 0.5 + i * 0.7) * 0.001;
    }
    pts.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={pts}>
      <bufferGeometry><bufferAttribute attach="attributes-position" array={positions} count={count} itemSize={3} /></bufferGeometry>
      <pointsMaterial size={0.06} color="#886644" transparent opacity={0.15} sizeAttenuation blending={THREE.AdditiveBlending} />
    </points>
  );
}

// ─── LUZES DE ANTENA PISCANTES ───────────────────────────────────────────────
function AntennaLightsBlinker({ windowMats }) {
  const blinkerRef = useRef({ phase: 0 });

  useFrame(({ clock }) => {
    // Faz as luzes de antena piscarem suavemente a cada 2s
    blinkerRef.current.phase = clock.getElapsedTime();
  });

  return null; // Controle puramente via useFrame nos materiais do prédio
}

// ─── CONTROLADOR FLUIDO ──────────────────────────────────────────────────────
function Director({ isFinal, moonMat, particlesMat, glow1, glow2, glow3, godRaysMat, ambLight, windowMats, hasStarted, audioRef }) {
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
      startTime.current = null;
      return;
    }
    
    if (startTime.current === null) startTime.current = clock.getElapsedTime();
    let elapsed = clock.getElapsedTime() - startTime.current;

    // Sincronismo PERFEITO com a música, ancorado no audioRef
    if (audioRef && audioRef.current && audioRef.current.currentTime > 0) {
       elapsed = audioRef.current.currentTime;
    }

    // Progress contínuo de 0 a 1 usando a configuração de Drop da Música
    let progress = Math.min(elapsed / MUSIC_DROP_TIME, 1.0);

    // Se o botão final apareceu, fixa em 1.0
    if (isFinal) progress = 1.0;

    // Amostra o caminho contínuo
    const state = sampleJourney(progress);

    // Aplica posição da câmera diretamente
    const targetPos = new THREE.Vector3(...state.camPos);
    const targetLook = new THREE.Vector3(...state.lookAt);

    // Mouse parallax quando perto da lua
    if (progress > 0.75) {
      mLerp.current.x += (mouse.current.x - mLerp.current.x) * 0.04;
      mLerp.current.y += (mouse.current.y - mLerp.current.y) * 0.04;
      const strength = (progress - 0.75) / 0.25;
      targetPos.x += mLerp.current.x * 1.5 * strength;
      targetPos.y += mLerp.current.y * 0.8 * strength;
    }

    camera.position.copy(targetPos);
    camera.lookAt(targetLook);

    // Lua emissive
    if (moonMat.current) moonMat.current.emissiveIntensity = state.moonGlow;
    // Glows da lua (3 camadas agora)
    if (glow1.current) glow1.current.opacity = state.moonGlow * 0.6;
    if (glow2.current) glow2.current.opacity = state.moonGlow * 0.4;
    if (glow3.current) glow3.current.opacity = state.moonGlow * 0.2;
    // God Rays
    if (godRaysMat.current) godRaysMat.current.opacity = state.moonGlow * 0.06;
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
const CinematicScene = memo(function CinematicScene({ isFinal = false, hasStarted = false, audioRef }) {
  const moonMat = useRef(), particlesMat = useRef();
  const glow1 = useRef(), glow2 = useRef(), glow3 = useRef();
  const godRaysMat = useRef();
  const ambLight = useRef();
  const windowMats = useRef([]);

  return (
    <Canvas
      camera={{ position: [0, 2.5, 14], fov: 60, near: 0.1, far: 300 }}
      gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.4 }}
      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }}
    >
      <ambientLight ref={ambLight} intensity={0.65} color="#667" />

      {/* Postes de rua — mais intensos */}
      <pointLight position={[-3, 5, 10]}  color="#ffdd88" intensity={1.8} distance={25} />
      <pointLight position={[3,  5, 10]}  color="#ffdd88" intensity={1.8} distance={25} />
      <pointLight position={[-3, 5, 0]}   color="#ffcc66" intensity={1.3} distance={25} />
      <pointLight position={[3,  5, 0]}   color="#ffcc66" intensity={1.3} distance={25} />
      <pointLight position={[-3, 5, -12]} color="#ffaa44" intensity={0.8} distance={22} />
      <pointLight position={[3,  5, -12]} color="#ffaa44" intensity={0.8} distance={22} />
      {/* Postes extras mais atrás */}
      <pointLight position={[-3, 5, -24]} color="#ff8833" intensity={0.5} distance={20} />
      <pointLight position={[3,  5, -24]} color="#ff8833" intensity={0.5} distance={20} />

      {/* Luz da Lua — mais poderosa */}
      <pointLight position={MOON_POS} color="#ff2200" intensity={12} distance={120} />

      {/* Fog atmosférico — mais suave e roxo */}
      <fog attach="fog" color="#0a0018" near={55} far={140} />

      {/* Estrelas — mais numerosas e brilhantes */}
      <Stars radius={180} depth={80} count={4000} factor={4} saturation={0.3} fade speed={0.1} />

      <CityBuildings windowMatRefs={windowMats} />
      <BloodMoon matRef={moonMat} glow1Ref={glow1} glow2Ref={glow2} glow3Ref={glow3} />
      <GodRays matRef={godRaysMat} />
      <AshParticles count={600} matRef={particlesMat} />
      <StreetDust count={200} />

      <Director
        isFinal={isFinal}
        moonMat={moonMat}
        particlesMat={particlesMat}
        glow1={glow1}
        glow2={glow2}
        glow3={glow3}
        godRaysMat={godRaysMat}
        ambLight={ambLight}
        windowMats={windowMats}
        hasStarted={hasStarted}
        audioRef={audioRef}
      />
    </Canvas>
  );
});

export default CinematicScene;
