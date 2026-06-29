import { useState } from 'react'

export default function InventoryTab({ playerHp, maxHp, onHeal, playerStats }) {
  const [selectedItem, setSelectedItem] = useState(null)
  
  // Starting items in inventory
  const [items, setItems] = useState([
    {
      id: 'potion_hp',
      name: 'Poção de HP Menor',
      icon: '🧪',
      type: 'consumable',
      qty: 3,
      description: 'Uma poção brilhante fervida com flores do Alvorecer. Cura 30 de HP do personagem.',
      effect: { type: 'heal', value: 30 }
    },
    {
      id: 'iron_sword',
      name: 'Espada de Ferro Curta',
      icon: '🗡️',
      type: 'weapon',
      qty: 1,
      description: 'Uma lâmina de ferro padrão. Útil para desferir ataques brutais contra daemons fracos.',
      stats: 'Dano: +5 Físico',
      requirements: 'Requer: FOR 12 (Você tem: ' + playerStats.FOR + ')'
    },
    {
      id: 'daemon_tooth',
      name: 'Dente de Daemon',
      icon: '🦷',
      type: 'material',
      qty: 5,
      description: 'Um dente pontiagudo e corrompido coletado de um Daemon de baixo nível. Pode ser vendido a ferreiros no mapa.'
    },
    {
      id: 'sanguine_crystal',
      name: 'Cristal Sanguíneo',
      icon: '💎',
      type: 'currency',
      qty: 12,
      description: 'Um fragmento de cristal puro carregado com a energia do Eclipse. Altamente valorizado pela facção Filhos do Eclipse.'
    },
    {
      id: 'shadow_scroll',
      name: 'Pergaminho de Ilusão',
      icon: '📜',
      type: 'scroll',
      qty: 1,
      description: 'Um pergaminho escrito no dialeto da Umbra. Pode ser vendido para Corretores de Informação por moedas.'
    }
  ])

  // Create an array of 24 slots for the classic RPG grid feel
  const totalSlots = 24;
  const gridSlots = Array(totalSlots).fill(null);
  
  // Place items into slots
  items.forEach((item, index) => {
    if (index < totalSlots) {
      gridSlots[index] = item;
    }
  })

  const handleUseItem = (item) => {
    if (item.id === 'potion_hp') {
      if (playerHp >= maxHp) {
        alert('Seu HP já está no máximo!');
        return;
      }
      
      // Execute healing
      onHeal(item.effect.value);
      
      // Decrease quantity
      setItems(prevItems => 
        prevItems.map(i => {
          if (i.id === item.id) {
            const newQty = i.qty - 1;
            // Update selected item detail view
            if (newQty <= 0) {
              setSelectedItem(null);
              return null; // will be filtered out
            }
            const updatedItem = { ...i, qty: newQty };
            setSelectedItem(updatedItem);
            return updatedItem;
          }
          return i;
        }).filter(Boolean)
      );
    }
  }

  return (
    <div className="inventory-container">
      <div className="inventory-header">
        <h2>🎒 Mochila Desperta</h2>
        <div className="hp-indicator">
          <span>HP: {playerHp}/{maxHp}</span>
          <div className="hp-mini-bar">
            <div className="hp-mini-fill" style={{ width: `${(playerHp / maxHp) * 100}%` }}></div>
          </div>
        </div>
      </div>

      <div className="inventory-grid">
        {gridSlots.map((item, idx) => (
          <div 
            key={idx} 
            className={`inventory-slot ${selectedItem?.id === item?.id && item ? 'selected-slot' : ''}`}
            onClick={() => item && setSelectedItem(item)}
          >
            {item ? (
              <div className="item-wrapper">
                <span className="item-icon">{item.icon}</span>
                {item.qty > 1 && <span className="item-qty">{item.qty}</span>}
              </div>
            ) : (
              <div className="empty-slot-dot"></div>
            )}
          </div>
        ))}
      </div>

      <div className="item-detail-panel">
        {selectedItem ? (
          <div className="detail-content">
            <div className="detail-header">
              <span className="detail-icon">{selectedItem.icon}</span>
              <div>
                <h3>{selectedItem.name}</h3>
                <span className={`detail-type type-${selectedItem.type}`}>
                  {selectedItem.type.toUpperCase()}
                </span>
              </div>
            </div>
            
            <p className="detail-description">{selectedItem.description}</p>
            
            {selectedItem.stats && <p className="detail-stats">{selectedItem.stats}</p>}
            {selectedItem.requirements && <p className="detail-reqs">{selectedItem.requirements}</p>}

            {selectedItem.type === 'consumable' && (
              <button 
                className="use-item-btn"
                onClick={() => handleUseItem(selectedItem)}
              >
                USAR CONSUMÍVEL
              </button>
            )}
          </div>
        ) : (
          <div className="no-item-selected">
            <p>Selecione um item da mochila para ver detalhes, usar ou equipar.</p>
          </div>
        )}
      </div>
    </div>
  )
}
