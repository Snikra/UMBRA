import { useState, useCallback } from 'react'
import MapScreen from './components/MapScreen'
import CombatArena from './components/CombatArena'
import BottomNav from './components/BottomNav'
import './App.css'

const PLAYER_STATS = { FOR: 16, DES: 14, INT: 10, HP: 85, MAX_HP: 100, MP: 42, MAX_MP: 60, XP: 340, NEXT_XP: 1000 }

function App() {
  const [currentTab, setCurrentTab] = useState('MAPA')

  const engageCombat = useCallback(() => {
    setCurrentTab('COMBATE')
  }, [])

  return (
    <div className="app-container">
      <main className="main-content">
        {currentTab === 'MAPA' && (
          <MapScreen
            onEngageCombat={engageCombat}
          />
        )}

        {currentTab === 'COMBATE' && (
          <CombatArena
            playerStats={PLAYER_STATS}
            onFlee={() => setCurrentTab('MAPA')}
          />
        )}

        {currentTab === 'INVENTARIO' && (
          <div className="placeholder-tab">
            <span className="placeholder-icon">🎒</span>
            <h2>Inventário</h2>
            <p>Seus itens e equipamentos serão exibidos aqui.</p>
          </div>
        )}

        {currentTab === 'DIARIO' && (
          <div className="updates-tab">
            <h2>Diário de Desenvolvimento</h2>
            <p className="updates-subtitle">Registro de mudanças — Era Sombria</p>

            <div className="update-card">
              <h3>v0.4.0 — Mapa Medieval Sombrio</h3>
              <span className="update-date">Era Sombria</span>
              <ul>
                <li><strong>12 POIs:</strong> Fendas, tavernas, dungeons e mais com marcadores coloridos.</li>
                <li><strong>HUD Reformulado:</strong> Retrato, barras de HP/MP, recursos e bússola.</li>
                <li><strong>Barra de Busca:</strong> Filtros por categoria com chips interativos.</li>
                <li><strong>Sidebar:</strong> Menu lateral deslizante com 6 ícones.</li>
                <li><strong>Partículas:</strong> Cinzas flutuantes e névoa ambiente.</li>
                <li><strong>Bússola:</strong> Rosa dos ventos decorativa.</li>
              </ul>
            </div>

            <div className="update-card">
              <h3>v0.3.0 — A Tela do Mapa Sombrio</h3>
              <span className="update-date">Era Sombria</span>
              <ul>
                <li><strong>Mapa Medieval:</strong> Visual completamente refeito no estilo Diablo II / Dark Souls.</li>
                <li><strong>Biomas:</strong> Terras Seguras, Floresta Sombria, Zona Vulcânica, Zona Corrompida e Docas Abandonadas.</li>
                <li><strong>HUD Épico:</strong> Retrato do personagem com moldura dourada, barras de HP/MP/XP.</li>
                <li><strong>Missões:</strong> Sistema de quest ativa visível no canto superior direito do mapa.</li>
              </ul>
            </div>

            <div className="update-card">
              <h3>v0.2.0 — A Vibe GO (Integração GPS)</h3>
              <span className="update-date">Era Anterior</span>
              <ul>
                <li><strong>Mundo Real:</strong> Mapa dinâmico via Leaflet com visual noturno.</li>
                <li><strong>Fendas Sombrias:</strong> Sistema spawna fendas aleatórias ao redor do jogador.</li>
                <li><strong>Combate D&D:</strong> Atributos da Party somados à rolagem do D20.</li>
              </ul>
            </div>

            <div className="update-card">
              <h3>v0.1.0 — Fundação Sombria</h3>
              <span className="update-date">Fase 1</span>
              <ul>
                <li>Inicialização do repositório React (Vite).</li>
                <li>Estética Sanguine Eclipse e navegação inferior.</li>
                <li>Rolagem 3D do D20 com acertos e falhas críticas.</li>
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
    </div>
  )
}

export default App
