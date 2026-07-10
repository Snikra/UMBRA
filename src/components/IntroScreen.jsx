import React, { useState, useEffect, Suspense, useRef, useCallback } from 'react';
import './IntroScreen.css';
import themeAudio from '../assets/theme.mp3';
import narratorAudio from '../assets/narrator.mp3';
import { MUSIC_DROP_TIME } from '../config.js';

const storyLines = [
  { text: "O tempo é uma prisão frágil...", start: 0, end: 3.5 },
  { text: "Por eras, a humanidade caminhou cega. Construímos cidades de concreto e asfalto, acreditando que éramos os donos do mundo.", start: 4.5, end: 11.5 },
  { text: "Mas nas sombras além do Véu, ele esperava. Um homem consumido pela própria ambição, que sacrificou a inocência para abrir as portas de uma Era de Demônios.", start: 12.5, end: 21 },
  { text: "A Deusa Crona o isolou em uma linha do tempo morta. Sob um céu envelhecido, ele aguardou o Alinhamento das Esferas...", start: 22, end: 28 },
  { text: "Hoje, o ciclo de dez mil anos se completa.\nO Eclipse Sanguíneo rasgou o Véu.\nO Corvo está livre. E suas marionetes já caminham entre nós.", start: 29, end: 37 },
  { text: "A maioria continua cega, ignorando a fenda e os monstros que espreitam nas esquinas da nossa cidade.\nMas a luz vermelha tocou você.", start: 38, end: 46 }
];

// Lazy load da cena 3D para não bloquear a intro
const CinematicScene = React.lazy(() => import('./CinematicScene'));

export default function IntroScreen({ onFinishIntro }) {
  const [currentLine, setCurrentLine] = useState(-1);
  const [fadeState, setFadeState] = useState('fade-out');
  const [showButton, setShowButton] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const audioRef = useRef(null);
  const narratorRef = useRef(null);

  // Baixa ou aumenta suavemente o volume da música
  const setMusicVolume = useCallback((vol) => {
    if (audioRef.current) {
      const target = vol;
      const step = () => {
        if (!audioRef.current) return;
        const curr = audioRef.current.volume;
        const diff = target - curr;
        if (Math.abs(diff) < 0.01) {
          audioRef.current.volume = target;
          return;
        }
        audioRef.current.volume = curr + diff * 0.1;
        requestAnimationFrame(step);
      };
      step();
    }
  }, []);

  const handleStart = () => {
    setHasStarted(true);
    
    // Toca a música tema com volume mais baixo (ducking)
    if (audioRef.current) {
      audioRef.current.volume = 0.15;
      audioRef.current.play().catch(err => {
        console.warn("Erro no play da música:", err);
      });
    }

    // Toca a voz da narração no volume máximo
    if (narratorRef.current) {
      narratorRef.current.volume = 1.0;
      narratorRef.current.play().catch(err => {
        console.warn("Erro no play da narração:", err);
      });
    }
  };

  const handleTimeUpdate = () => {
    if (!narratorRef.current) return;
    const t = narratorRef.current.currentTime;
    
    // Procura qual frase deve estar ativa neste milissegundo exato
    const activeIndex = storyLines.findIndex(s => t >= s.start && t < s.end);
    
    if (activeIndex !== -1) {
      if (currentLine !== activeIndex) {
        setCurrentLine(activeIndex);
        setFadeState('fade-in');
      } else if (fadeState !== 'fade-in') {
        // Se a classe foi tirada por algum motivo, garante que está com fade-in
        setFadeState('fade-in');
      }
    } else {
      // Se não tem texto para esse milissegundo (pausas ou final), da um fade out no texto atual
      if (fadeState !== 'fade-out') {
        setFadeState('fade-out');
      }
    }
  };

  useEffect(() => {
    if (!hasStarted) return;
    
    // Mostra o botão final só quando o áudio principal atingir o Drop (ou no final da narração)
    const checkAudioInterval = setInterval(() => {
      if (audioRef.current && audioRef.current.currentTime >= MUSIC_DROP_TIME) {
        setShowButton(true);
        clearInterval(checkAudioInterval);
      }
    }, 100);
    return () => clearInterval(checkAudioInterval);
  }, [hasStarted]);

  return (
    <div className="intro-container">
      {/* Áudio da Cena */}
      <audio ref={audioRef} src={themeAudio} preload="auto" />
      {/* Áudio da Narração */}
      <audio 
        ref={narratorRef} 
        src={narratorAudio} 
        preload="auto" 
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => {
          // Quando a narração acabar, sobe o volume da música
          setMusicVolume(0.5);
        }}
      />
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
            <h1>UMBRA</h1>
            <button className="wake-up-button" onClick={handleStart}>
              INICIAR JORNADA
            </button>
          </div>
        ) : !showButton ? (
          <div className={`intro-text ${fadeState}`}>
            {storyLines[currentLine] && storyLines[currentLine].text.split('\n').map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
        ) : (
          <div className="intro-final fade-in">
            <h1>UMBRA</h1>
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
