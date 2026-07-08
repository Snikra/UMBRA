import React, { useState, useEffect } from 'react';
import './IntroScreen.css';
import scene1 from '../assets/cinematic/scene1.png';
import scene2 from '../assets/cinematic/scene2.png';
import scene3 from '../assets/cinematic/scene3.png';

const storyLines = [
  "O tempo é uma prisão frágil...",
  "Por eras, a humanidade caminhou cega. Construímos cidades de concreto e asfalto, acreditando que éramos os donos do mundo.",
  "Mas nas sombras além do Véu, ele esperava. Um homem consumido pela própria ambição, que sacrificou a inocência para abrir as portas de uma Era de Demônios.",
  "A Deusa Crona o isolou em uma linha do tempo morta. Sob um céu envelhecido, ele aguardou o Alinhamento das Esferas...",
  "Hoje, o ciclo de dez mil anos se completa.\nO Eclipse Sanguíneo rasgou o Véu.\nO Corvo está livre. E suas marionetes já caminham entre nós.",
  "A maioria continua cega, ignorando a fenda e os monstros que espreitam nas esquinas da nossa cidade.\nMas a luz vermelha tocou você."
];

// Mapeia o índice do texto para a imagem de fundo correspondente
const getSceneForLine = (index) => {
  if (index <= 2) return scene1; // O passado / Ambição sombria
  if (index === 3) return scene2; // Prisão do tempo de Crona
  return scene3; // O presente / Eclipse
};

export default function IntroScreen({ onFinishIntro }) {
  const [currentLine, setCurrentLine] = useState(0);
  const [fadeState, setFadeState] = useState('fade-in'); // 'fade-in', 'visible', 'fade-out'
  const [showButton, setShowButton] = useState(false);
  const [currentBg, setCurrentBg] = useState(scene1);
  const [bgFade, setBgFade] = useState('bg-visible');

  useEffect(() => {
    if (currentLine >= storyLines.length) {
      setShowButton(true);
      return;
    }

    // Change background image if it's different
    const nextBg = getSceneForLine(currentLine);
    if (nextBg !== currentBg) {
      setBgFade('bg-fade-out');
      setTimeout(() => {
        setCurrentBg(nextBg);
        setBgFade('bg-fade-in');
        setTimeout(() => setBgFade('bg-visible'), 1500); // 1.5s bg transition
      }, 1500);
    }

    const fadeInTimeout = setTimeout(() => {
      setFadeState('visible');
    }, 500);

    const visibleTime = storyLines[currentLine].length > 60 ? 5500 : 3500;

    const fadeOutTimeout = setTimeout(() => {
      setFadeState('fade-out');
    }, fadeInTimeout + visibleTime);

    const nextLineTimeout = setTimeout(() => {
      setCurrentLine(prev => prev + 1);
      setFadeState('fade-in');
    }, fadeOutTimeout + 1500); 

    return () => {
      clearTimeout(fadeInTimeout);
      clearTimeout(fadeOutTimeout);
      clearTimeout(nextLineTimeout);
    };
  }, [currentLine, currentBg]);

  return (
    <div className="intro-container">
      {/* Background Cinematográfico */}
      <div 
        className={`intro-background ${bgFade}`} 
        style={{ backgroundImage: `url(${currentBg})` }}
      />
      <div className="intro-overlay" />

      {/* Conteúdo Textual */}
      <div className="intro-content-wrapper">
        {!showButton ? (
          <div className={`intro-text ${fadeState}`}>
            {storyLines[currentLine] && storyLines[currentLine].split('\n').map((line, i) => (
               <p key={i}>{line}</p>
            ))}
          </div>
        ) : (
          <div className="intro-final fade-in">
            <h1>A Queda do Véu</h1>
            <button className="wake-up-button" onClick={onFinishIntro}>
              ABRIR OS OLHOS
            </button>
          </div>
        )}
      </div>
      
      {!showButton && (
        <button className="skip-intro" onClick={onFinishIntro}>
          Pular Introdução &gt;&gt;
        </button>
      )}
    </div>
  );
}
