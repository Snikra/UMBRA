import { useState } from 'react'
import MapComponent from './components/MapComponent'
import CameraView from './components/CameraView'
import QRCodeOverlay from './components/QRCodeOverlay'
import './App.css'

function App() {
  const [currentTab, setCurrentTab] = useState('MAPA') // 'MAPA', 'COMBATE', 'ATUALIZACOES'
  const [isNightMode, setIsNightMode] = useState(false)
  const [diceRoll, setDiceRoll] = useState(null)
  const [isRolling, setIsRolling] = useState(false)
  const [log, setLog] = useState(["Você encontrou um Daemon de Baixo Nível!"])
  const [showQR, setShowQR] = useState(false)

  // Character Attributes (D&D Style)
  const playerStats = { FOR: 16, DES: 14, INT: 10 }

  const engageCombat = () => {
    setCurrentTab('COMBATE')
    setLog(["Um Daemon Sombrio te emboscou saindo da fenda!"])
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
      if (baseRoll === 20) message += "ACERTO CRÍTICO! Dano Colossal!"
      else if (baseRoll === 1) message += "FALHA CRÍTICA! Você tropeçou."
      else if (total >= 15) message += "Acerto! Você causou dano."
      else message += "Errou! A armadura do Daemon resistiu."
      
      setLog(prev => [message, ...prev])
    }, 1000)
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
              <span className="stat-badge">FOR {playerStats.FOR} (+3)</span>
              <span className="stat-badge">DES {playerStats.DES} (+2)</span>
              <span className="stat-badge">INT {playerStats.INT} (+0)</span>
            </div>

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

            <div className="combat-log">
              {log.map((entry, idx) => (
                <p key={idx} className={idx === 0 ? 'log-new' : 'log-old'}>
                  {entry}
                </p>
              ))}
            </div>
            
            <button className="flee-button" onClick={() => setCurrentTab('MAPA')}>
              🏃 Fugir da Batalha
            </button>
          </div>
        )}

        {currentTab === 'EXPLORAR' && (
          <CameraView />
        )}

        {currentTab === 'ATUALIZACOES' && (
          <div className="updates-tab">
            <h2>📜 Diário de Desenvolvimento (Devlog)</h2>
            <p className="updates-subtitle">Registro de mudanças para jogadores e IAs</p>

            <div className="update-card">
              <h3>v0.2.0 - A Vibe GO (Integração GPS)</h3>
              <span className="update-date">Hoje</span>
              <ul>
                <li><strong>Mundo Real:</strong> Adicionado mapa dinâmico via Leaflet (Dark Matter).</li>
                <li><strong>Ciclo Dia/Noite:</strong> Toggle para alternar interface entre o mundo ilusório e a Verdadeira Umbra.</li>
                <li><strong>Fendas Sombrias:</strong> Sistema spawna fendas aleatórias ao redor do jogador baseadas em coordenadas de GPS reais.</li>
                <li><strong>Combate D&D:</strong> O combate agora utiliza atributos da Party (FOR e DES) somados à rolagem do D20.</li>
              </ul>
            </div>

            <div className="update-card">
              <h3>v0.1.0 - Fundação Sombria</h3>
              <span className="update-date">Fase 1</span>
              <ul>
                <li>Inicialização do repositório React (Vite).</li>
                <li>Estética Sanguine Eclipse (#121212 e Carmesim).</li>
                <li>Navegação inferior e Protótipo de rolagem 3D do D20 com acertos críticos (20) e falhas críticas (1).</li>
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
        <button className="nav-item">
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
