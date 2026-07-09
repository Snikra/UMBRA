import React, { useState, useEffect, Suspense, useRef } from 'react';
import './IntroScreen.css';
import themeAudio from '../assets/theme.mp3';

const storyLines = [
  "O tempo é uma prisão frágil...",
  "Por eras, a humanidade caminhou cega. Construímos cidades de concreto e asfalto, acreditando que éramos os donos do mundo.",
  "Mas nas sombras além do Véu, ele esperava. Um homem consumido pela própria ambição, que sacrificou a inocência para abrir as portas de uma Era de Demônios.",
  "A Deusa Crona o isolou em uma linha do tempo morta. Sob um céu envelhecido, ele aguardou o Alinhamento das Esferas...",
  "Hoje, o ciclo de dez mil anos se completa.\nO Eclipse Sanguíneo rasgou o Véu.\nO Corvo está livre. E suas marionetes já caminham entre nós.",
  "A maioria continua cega, ignorando a fenda e os monstros que espreitam nas esquinas da nossa cidade.\nMas a luz vermelha tocou você."
];

import { MUSIC_DROP_TIME } from '../config.js';

// Lazy load da cena 3D para não bloquear a intro
const CinematicScene = React.lazy(() => import('./CinematicScene'));

export default function IntroScreen({ onFinishIntro }) {
  const [currentLine, setCurrentLine] = useState(0);
  const [fadeState, setFadeState] = useState('fade-in');
  const [showButton, setShowButton] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const audioRef = useRef(null);

  const handleStart = () => {
    setHasStarted(true);
    if (audioRef.current) {
      audioRef.current.volume = 0.5;
      audioRef.current.play().catch(err => {
        console.warn("Erro no play da tag principal, tentando fallback de Audio JS puro:", err);
        const fallbackAudio = new Audio(themeAudio);
        fallbackAudio.volume = 0.5;
        fallbackAudio.play().catch(e => console.error("Fallback também falhou:", e));
      });
    }
  };

  useEffect(() => {
    if (!hasStarted) return;
    
    // Quando os textos acabam, seguramos o suspense até o drop da música!
    if (currentLine >= storyLines.length) {
      const checkAudioInterval = setInterval(() => {
        if (audioRef.current && audioRef.current.currentTime >= MUSIC_DROP_TIME) {
          setShowButton(true);
          clearInterval(checkAudioInterval);
        }
      }, 100);
      return () => clearInterval(checkAudioInterval);
    }

    const fadeInTimeout = setTimeout(() => {
      setFadeState('visible');
    }, 500);

    const visibleTime = storyLines[currentLine].length > 60 ? 5500 : 3500;

    const fadeOutTimeout = setTimeout(() => {
      setFadeState('fade-out');
    }, 500 + visibleTime);

    const nextLineTimeout = setTimeout(() => {
      setCurrentLine(prev => prev + 1);
      setFadeState('fade-in');
    }, 500 + visibleTime + 1500);

    return () => {
      clearTimeout(fadeInTimeout);
      clearTimeout(fadeOutTimeout);
      clearTimeout(nextLineTimeout);
    };
  }, [currentLine, hasStarted]);

  return (
    <div className="intro-container">
      {/* Áudio da Cinematic em MP3 puro via import direto (para bypass de cache) */}
      <audio ref={audioRef} src={themeAudio} preload="auto" />
      {/* Cena 3D de fundo */}
      <Suspense fallback={<div className="intro-bg-fallback" />}>
        <CinematicScene isFinal={showButton} hasStarted={hasStarted} audioRef={audioRef} />
      </Suspense>

      {/* Overlay escuro para legibilidade do texto */}
      <div className="intro-overlay" />

      {/* Conteúdo textual ou Botão Iniciar */}
      <div className="intro-content-wrapper">
        {!hasStarted ? (
          <div className="intro-start-screen fade-in">
            <h1>A Queda do Véu</h1>
            <button className="wake-up-button" onClick={handleStart}>
              INICIAR JORNADA
            </button>
          </div>
        ) : !showButton ? (
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

      {hasStarted && !showButton && (
        <button className="skip-intro" onClick={onFinishIntro}>
          Pular Introdução &gt;&gt;
        </button>
      )}
    </div>
  );
}
