const PARTICLES = Array.from({ length: 7 }, (_, i) => ({
  id: i,
  left: `${Math.random() * 100}%`,
  delay: `${Math.random() * 5}s`,
  duration: `${3 + Math.random() * 2}s`,
  size: `${2 + Math.random() * 3}px`,
  xDrift: `${(Math.random() - 0.5) * 60}px`,
}))

const FOG_WISPS = Array.from({ length: 3 }, (_, i) => ({
  id: i,
  top: `${20 + Math.random() * 60}%`,
  delay: `${Math.random() * 8}s`,
  duration: `${8 + Math.random() * 4}s`,
  width: `${40 + Math.random() * 40}px`,
}))

import { memo } from 'react'

const ParticleLayer = memo(() => {
  return (
    <div className="particle-layer" aria-hidden="true">
      {PARTICLES.map((p) => (
        <div
          key={p.id}
          className="ash-particle"
          style={{
            left: p.left,
            width: p.size,
            height: p.size,
            animationDelay: p.delay,
            animationDuration: p.duration,
            '--x-drift': p.xDrift,
          }}
        />
      ))}
      {FOG_WISPS.map((f) => (
        <div
          key={f.id}
          className="fog-wisp"
          style={{
            top: f.top,
            width: f.width,
            animationDelay: f.delay,
            animationDuration: f.duration,
          }}
        />
      ))}
    </div>
  )
})

ParticleLayer.displayName = 'ParticleLayer'

export default ParticleLayer
