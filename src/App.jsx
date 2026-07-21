import { useState, useCallback } from 'react'
import MapScreen from './components/MapScreen'
import CombatArena from './components/CombatArena'
import BottomNav from './components/BottomNav'
import InventoryTab from './components/InventoryTab'
import ExplorerTab from './components/ExplorerTab'
import IntroScreen from './components/IntroScreen'
import CharacterCreation from './components/CharacterCreation'
import QRCodeOverlay from './components/QRCodeOverlay'
import './App.css'

const PLAYER_STATS = { FOR: 16, DES: 14, INT: 10, HP: 70, MAX_HP: 100, MP: 42, MAX_MP: 60, XP: 340, NEXT_XP: 1000 }

function App() {
  const [currentTab, setCurrentTab] = useState('MAPA')
  const [hasSeenIntro, setHasSeenIntro] = useState(false)
  const [hasCreatedCharacter, setHasCreatedCharacter] = useState(false)
  const [personalTragedy, setPersonalTragedy] = useState(null)
  const [showQR, setShowQR] = useState(false)
  const [log, setLog] = useState([])
  
  // Immersive stats binding
  const [playerHp, setPlayerHp] = useState(70) // Start damaged so they can test healing!
  const maxHp = 100
  const playerStats = { FOR: 16, DES: 14, INT: 10 } // Simplified for inventory tab

  const engageCombat = useCallback(() => {
    setCurrentTab('COMBATE')
  }, [])

  const handleHeal = (amount) => {
    setPlayerHp(prev => Math.min(maxHp, prev + amount))
  }

  const handleCharacterCreation = (tragedyId) => {
    setPersonalTragedy(tragedyId)
    setHasCreatedCharacter(true)
    setLog([`Você despertou! Sua tragédia (${tragedyId}) moldará seu caminho. Uma fenda se abriu à sua frente!`])
  }

  // 1) Tela 3D do UMBRA
  if (!hasSeenIntro) {
    return <IntroScreen onFinishIntro={() => setHasSeenIntro(true)} />
  }

  // 2) Criação de Personagem
  if (!hasCreatedCharacter) {
    return <CharacterCreation onComplete={handleCharacterCreation} />
  }

  // 3) Jogo Sombrio Medieval
  return (
    <div className="app-container">
      {/* Botão de Compartilhar solto caso precise */}
      <button 
        style={{ position: 'absolute', top: 15, right: 15, zIndex: 99 }}
        className="toggle-mode-btn" 
        onClick={() => setShowQR(true)}
        title="Compartilhar"
      >
        📡
      </button>

      <main className="main-content">
        {currentTab === 'MAPA' && (
          <MapScreen
            onEngageCombat={engageCombat}
          />
        )}

        {currentTab === 'COMBATE' && (
          <CombatArena
            playerStats={{...PLAYER_STATS, HP: playerHp}}
            onFlee={() => setCurrentTab('MAPA')}
          />
        )}

        {currentTab === 'INVENTARIO' && (
          <InventoryTab 
            playerHp={playerHp}
            maxHp={maxHp}
            onHeal={handleHeal}
            playerStats={playerStats}
          />
        )}

        {currentTab === 'DIARIO' && (
          <div className="updates-tab">
            <h2>Diário de Desenvolvimento</h2>
            <p className="updates-subtitle">Registro de mudanças — Mescla de Eras</p>

            <div className="update-card">
              <h3>v0.4.0 — Mapa Medieval Sombrio</h3>
              <span className="update-date">Hoje</span>
              <ul>
                <li><strong>12 POIs:</strong> Fendas, cavernas, e marcadores no mapa medieval.</li>
                <li><strong>HUD Reformulado:</strong> Bússola e minimapa.</li>
                <li><strong>Inventário Mantido:</strong> Mochila Desperta com sistema D&D (da nossa branch).</li>
              </ul>
            </div>
          </div>
        )}

        {currentTab === 'CONFIG' && (
          <div className="placeholder-tab">
            <span className="placeholder-icon">⚙️</span>
            <h2>Configurações</h2>
            <p>Preferências e ajustes do jogo.</p>
          </div>
        )}
      </main>

      <BottomNav activeTab={currentTab} onTabChange={setCurrentTab} />
      <QRCodeOverlay isOpen={showQR} onClose={() => setShowQR(false)} />
    </div>
  )
}

export default App
