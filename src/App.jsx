import { useState } from 'react'
import MapComponent from './components/MapComponent'
import ExplorerTab from './components/ExplorerTab'
import InventoryTab from './components/InventoryTab'
import QRCodeOverlay from './components/QRCodeOverlay'
import CharacterCreation from './components/CharacterCreation'
import IntroScreen from './components/IntroScreen'
import './App.css'

function App() {
  const [currentTab, setCurrentTab] = useState('MAPA') // 'MAPA', 'COMBATE', 'INVENTARIO', 'ATUALIZACOES'
  const [isNightMode, setIsNightMode] = useState(false)
  const [diceRoll, setDiceRoll] = useState(null)
  const [isRolling, setIsRolling] = useState(false)
  const [log, setLog] = useState(["Você encontrou um Daemon de Baixo Nível!"])
  const [showQR, setShowQR] = useState(false)
  const [hasSeenIntro, setHasSeenIntro] = useState(false)
  const [hasCreatedCharacter, setHasCreatedCharacter] = useState(false)
  const [personalTragedy, setPersonalTragedy] = useState(null)
  
  // Immersive stats binding
  const [playerHp, setPlayerHp] = useState(70) // Start damaged so they can test healing!
  const maxHp = 100

  // Character Attributes (D&D Style)
  const playerStats = { FOR: 16, DES: 14, INT: 10 }

  const engageCombat = () => {
    setCurrentTab('COMBATE')
    setLog(["Um Daemon Sombrio te emboscou saindo da fenda!"])
  }

  const handleHeal = (amount) => {
    setPlayerHp(prev => Math.min(maxHp, prev + amount))
  }

  const rollDice = (modifierName, modifierValue) => {
    if (isRolling) return;
    setIsRolling(true)
    setDiceRoll(null)
    
    setTimeout(() => {
      const baseRoll = Math.floor(Math.random() * 20) + 1
      const total = baseRoll + modifierValue
      setDiceRoll(baseRoll) // Show raw roll on dice
      setIsRolling(false)
      
      let message = `Rolou um ${baseRoll} + ${modifierValue} (${modifierName}) = ${total}. `
      if (baseRoll === 20) {
        message += "ACERTO CRÍTICO! Dano Colossal!"
      } else if (baseRoll === 1) {
        message += "FALHA CRÍTICA! O Daemon te contra-atacou severamente."
        setPlayerHp(prev => Math.max(0, prev - 20))
      } else if (total >= 15) {
        message += "Acerto! Você causou dano no Daemon."
      } else {
        message += "Errou! Você levou um golpe rasante do monstro."
        setPlayerHp(prev => Math.max(0, prev - 10))
      }
      
      setLog(prev => [message, ...prev])
    }, 1000)
  }

  const handleCharacterCreation = (tragedyId) => {
    setPersonalTragedy(tragedyId)
    setHasCreatedCharacter(true)
    setLog([`Você despertou! Sua tragédia (${tragedyId}) moldará seu caminho. Uma fenda se abriu à sua frente!`])
  }

  if (!hasSeenIntro) {
    return <IntroScreen onFinishIntro={() => setHasSeenIntro(true)} />
  }

  if (!hasCreatedCharacter) {
    return <CharacterCreation onComplete={handleCharacterCreation} />
  }

  return (
    <div className={`app-container ${isNightMode ? 'night-mode' : 'day-mode'}`}>
      <header className="header">
        <div className="header-top">
          <h1>UMBRA</h1>
          <div style={{ display: 'flex', gap: 8 }}>
            <button 
              className="toggle-mode-btn" 
              onClick={() => setIsNightMode(!isNightMode)}
            >
              {isNightMode ? '☀️ Modo Dia' : '🌑 Modo Umbra'}
            </button>
            <button 
              className="toggle-mode-btn" 
              onClick={() => setShowQR(true)}
              title="Compartilhar"
            >
              📡 Compartilhar
            </button>
          </div>
        </div>
        <p className="subtitle">SANGUINE ECLIPSE</p>
      </header>

      <main className="main-content">
        {currentTab === 'MAPA' && (
          <MapComponent onEngageCombat={engageCombat} />
        )}

        {currentTab === 'COMBATE' && (
          <div className="combat-arena">
            <div className="party-stats">
              <span className="stat-badge">HP {playerHp}/{maxHp}</span>
              <span className="stat-badge font-red">FOR {playerStats.FOR} (+3)</span>
              <span className="stat-badge">DES {playerStats.DES} (+2)</span>
            </div>

            {playerHp <= 0 ? (
              <div className="defeat-screen">
                <h2>Você Desmaiou!</h2>
                <p>A força da Umbra foi maior. Use uma poção do seu inventário para se recuperar.</p>
                <button className="attack-button physical" onClick={() => setCurrentTab('INVENTARIO')}>
                  Abrir Inventário
                </button>
              </div>
            ) : (
              <>
                <div className="daemon-placeholder">
                  <h2>{isNightMode ? 'Daemon do Eclipse' : 'Goblin de Rua'}</h2>
                  <div className="hp-bar">
                    <div className="hp-fill" style={{ width: '80%' }}></div>
                  </div>
                </div>

                <div className="dice-area">
                  {isRolling ? (
                    <div className="dice rolling">...</div>
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
                    Ataque Brutal (FOR)
                  </button>
                  <button 
                    className="attack-button stealth"
                    onClick={() => rollDice('DES', 2)}
                    disabled={isRolling}
                  >
                    Ataque Furtivo (DES)
                  </button>
                </div>
              </>
            )}

            <div className="combat-log">
              {log.map((entry, idx) => (
                <p key={idx} className={idx === 0 ? 'log-new' : 'log-old'}>
                  {entry}
                </p>
              ))}
            </div>
            
            <button className="flee-button" onClick={() => setCurrentTab('MAPA')}>
              🏃 Voltar ao Mapa
            </button>
          </div>
        )}

        {currentTab === 'INVENTARIO' && (
          <InventoryTab 
            playerHp={playerHp}
            maxHp={maxHp}
            onHeal={handleHeal}
            playerStats={playerStats}
          />
        )}

        {currentTab === 'EXPLORAR' && (
          <ExplorerTab />
        )}

        {currentTab === 'ATUALIZACOES' && (
          <div className="updates-tab">
            <h2>📜 Diário de Desenvolvimento (Devlog)</h2>
            <p className="updates-subtitle">Registro de mudanças para jogadores e IAs</p>

            <div className="update-card">
              <h3>v0.3.0 - O Sistema de Inventário (Fase 3)</h3>
              <span className="update-date">Hoje</span>
              <ul>
                <li><strong>Mochila Desperta:</strong> Implementada aba funcional de inventário com grade clássica de 24 slots.</li>
                <li><strong>Consumíveis de HP:</strong> Poções agora são funcionais! Usar uma poção no inventário restaura seu HP.</li>
                <li><strong>Combate Letal:</strong> Goblins e Daemons agora causam dano real a você se você tirar números baixos ou Falhas Críticas.</li>
                <li><strong>Requisitos de Armas:</strong> Itens mostram detalhes técnicos e exigências de status inspirados em D&D.</li>
              </ul>
            </div>

            <div className="update-card">
              <h3>v0.2.0 - A Vibe GO (Integração GPS)</h3>
              <span className="update-date">Fase 2</span>
              <ul>
                <li><strong>Mundo Real:</strong> Adicionado mapa dinâmico via Leaflet (Dark Matter).</li>
                <li><strong>Ciclo Dia/Noite:</strong> Toggle para alternar interface entre o mundo ilusório e a Verdadeira Umbra.</li>
                <li><strong>Realidade Aumentada (WebXR):</strong> Equipe integrou suporte a Three.js e WebXR com fallback para visualização de câmera comum, renderizando um Goblin 3D sobre o ambiente.</li>
              </ul>
            </div>
          </div>
        )}
      </main>

      <nav className="bottom-nav">
        <button className={`nav-item ${currentTab === 'MAPA' ? 'active' : ''}`} onClick={() => setCurrentTab('MAPA')}>
          <span className="icon">🌍</span>
          <span>MAPA</span>
        </button>
        <button className={`nav-item ${currentTab === 'INVENTARIO' ? 'active' : ''}`} onClick={() => setCurrentTab('INVENTARIO')}>
          <span className="icon">🎒</span>
          <span>INVENTÁRIO</span>
        </button>
        <button className={`nav-item ${currentTab === 'EXPLORAR' ? 'active' : ''}`} onClick={() => setCurrentTab('EXPLORAR')}>
          <span className="icon">🔍</span>
          <span>EXPLORAR</span>
        </button>
        <button className="nav-item">
          <span className="icon">🛡️</span>
          <span>EQUIPE</span>
        </button>
        <button className={`nav-item ${currentTab === 'ATUALIZACOES' ? 'active' : ''}`} onClick={() => setCurrentTab('ATUALIZACOES')}>
          <span className="icon">📜</span>
          <span>DEVLOG</span>
        </button>
      </nav>

      <QRCodeOverlay isOpen={showQR} onClose={() => setShowQR(false)} />
    </div>
  )
}

export default App
