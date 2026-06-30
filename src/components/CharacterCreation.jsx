import React, { useState } from 'react';
import './CharacterCreation.css';

const tragedies = [
  {
    id: 'traicao',
    title: 'Traído pela Ambição',
    description: 'Um aliado cedeu à corrupção da Lua Vermelha e se perdeu na névoa de Snikra.',
    bonus: 'Afinidade Sombria: +2 em rolagens de Inteligência (INT).'
  },
  {
    id: 'perda',
    title: 'Perda Inocente',
    description: 'Alguém puro que você amava foi levado pela Névoa. Você jurou proteger os que restam.',
    bonus: 'Instinto Protetor: +2 em rolagens de Constituição (CON).'
  },
  {
    id: 'maldicao',
    title: 'Maldito pelo Eclipse',
    description: 'Você olhou diretamente para o Eclipse Sanguíneo. As trevas marcaram seu corpo.',
    bonus: 'Poder Bruto: +2 em rolagens de Força (FOR), mas a luz te fere.'
  }
];

export default function CharacterCreation({ onComplete }) {
  const [selectedTragedy, setSelectedTragedy] = useState(null);

  const handleSelect = (id) => {
    setSelectedTragedy(id);
  };

  const handleConfirm = () => {
    if (selectedTragedy) {
      onComplete(selectedTragedy);
    }
  };

  return (
    <div className="creation-container">
      <div className="creation-content">
        <h1>O Despertar</h1>
        <p className="creation-subtitle">A fenda se abriu. O Eclipse Sanguíneo revelou a verdade.</p>
        
        <h2>Escolha sua Tragédia Pessoal</h2>
        <p className="creation-instruction">
          O que te motiva a lutar contra o Corvo e suas criaturas da Umbra?
        </p>

        <div className="tragedy-list">
          {tragedies.map((tragedy) => (
            <div 
              key={tragedy.id} 
              className={`tragedy-card ${selectedTragedy === tragedy.id ? 'selected' : ''}`}
              onClick={() => handleSelect(tragedy.id)}
            >
              <h3>{tragedy.title}</h3>
              <p>{tragedy.description}</p>
              <span className="tragedy-bonus">{tragedy.bonus}</span>
            </div>
          ))}
        </div>

        <button 
          className="confirm-button" 
          disabled={!selectedTragedy}
          onClick={handleConfirm}
        >
          Despertar para o Mundo Real
        </button>
      </div>
    </div>
  );
}
