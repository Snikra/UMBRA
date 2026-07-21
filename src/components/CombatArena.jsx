import { useState, useCallback, memo } from 'react'

const CombatArena = memo(({ playerStats, onFlee }) => {
  const [diceRoll, setDiceRoll] = useState(null)
  const [isRolling, setIsRolling] = useState(false)
  const [log, setLog] = useState(['Você encontrou um Daemon de Baixo Nível!'])

  const rollDice = useCallback((modifierName, modifierValue) => {
    if (isRolling) return
    setIsRolling(true)
    setDiceRoll(null)

    setTimeout(() => {
      const baseRoll = Math.floor(Math.random() * 20) + 1
      const total = baseRoll + modifierValue
      setDiceRoll(baseRoll)
      setIsRolling(false)

      let message = `Rolou ${baseRoll} + ${modifierValue} (${modifierName}) = ${total}. `
      if (baseRoll === 20) message += 'ACERTO CRÍTICO! Dano Colossal!'
      else if (baseRoll === 1) message += 'FALHA CRÍTICA! Você tropeçou.'
      else if (total >= 15) message += 'Acerto! Causou dano ao Daemon.'
      else message += 'Errou! A armadura resistiu.'

      setLog(prev => [message, ...prev])
    }, 1000)
  }, [isRolling])

  return (
    <div className="combat-arena">
      <div className="party-stats">
        <div className="stat-badge">FOR {playerStats.FOR}</div>
        <div className="stat-badge">DES {playerStats.DES}</div>
        <div className="stat-badge">INT {playerStats.INT}</div>
      </div>

      <div className="daemon-placeholder">
        <h2>Daemon Sombrio</h2>
        <div className="hp-bar">
          <div className="hp-fill" style={{ width: '80%' }} />
        </div>
      </div>

      <div className="dice-area">
        {isRolling ? (
          <div className="dice rolling">⚔️</div>
        ) : diceRoll ? (
          <div className={`dice ${diceRoll === 20 ? 'crit-success' : diceRoll === 1 ? 'crit-fail' : ''}`}>
            {diceRoll}
          </div>
        ) : (
          <div className="dice-placeholder">D20</div>
        )}
      </div>

      <div className="action-buttons">
        <button
          className="attack-button physical"
          onClick={() => rollDice('FOR', 3)}
          disabled={isRolling}
        >
          Ataque Brutal
        </button>
        <button
          className="attack-button stealth"
          onClick={() => rollDice('DES', 2)}
          disabled={isRolling}
        >
          Ataque Furtivo
        </button>
      </div>

      <div className="combat-log">
        {log.map((entry, idx) => (
          <p key={idx} className={idx === 0 ? 'log-new' : 'log-old'}>
            {entry}
          </p>
        ))}
      </div>

      <button className="flee-button" onClick={onFlee}>
        Fugir da Batalha
      </button>
    </div>
  )
})

CombatArena.displayName = 'CombatArena'

export default CombatArena
