import { memo, useState } from 'react'

const HudBar = memo(({ playerStats, heading }) => {
  const [imgError, setImgError] = useState(false)
  const hpPercent = (playerStats.HP / playerStats.MAX_HP) * 100
  const mpPercent = (playerStats.MP / playerStats.MAX_MP) * 100
  const lowHp = hpPercent < 25

  return (
    <div className="hud-bar">
      <div className="hud-left">
        <div className="hud-portrait">
          <div className="portrait-circle">
            {imgError ? (
              <div className="portrait-fallback">⚔️</div>
            ) : (
              <img
                src="/hero.png"
                alt="Personagem"
                onError={() => setImgError(true)}
              />
            )}
          </div>
          <span className="level-badge">8</span>
        </div>

        <div className="hud-bars-group">
          <div className="hud-bar-row">
            <div className={`hud-bar-track hp-track ${lowHp ? 'low-hp' : ''}`}>
              <div className="hud-bar-fill hp-fill" style={{ width: `${hpPercent}%` }} />
              <span className="hud-bar-text">{playerStats.HP}/{playerStats.MAX_HP}</span>
            </div>
          </div>
          <div className="hud-bar-row">
            <div className="hud-bar-track mp-track">
              <div className="hud-bar-fill mp-fill" style={{ width: `${mpPercent}%` }} />
              <span className="hud-bar-text mp-text">{playerStats.MP}/{playerStats.MAX_MP}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="hud-right">
        <div className="resource-item">
          <span className="resource-icon">🪙</span>
          <span className="resource-value">1,250</span>
        </div>
        <div className="resource-item">
          <span className="resource-icon">🔮</span>
          <span className="resource-value soul-value">47</span>
        </div>
        <div className="compass-indicator" style={{ transform: `rotate(${heading || 0}deg)` }}>
          🧭
        </div>
      </div>
    </div>
  )
})

HudBar.displayName = 'HudBar'

export default HudBar
