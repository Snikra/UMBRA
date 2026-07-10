import React, { useState, useEffect, Suspense, useRef, useCallback } from 'react';
import './IntroScreen.css';
import themeAudio from '../assets/theme.mp3';
import { MUSIC_DROP_TIME } from '../config.js';

const storyLines = [
  "O tempo é uma prisão frágil...",
  "Por eras, a humanidade caminhou cega. Construímos cidades de concreto e asfalto, acreditando que éramos os donos do mundo.",
  "Mas nas sombras além do Véu, ele esperava. Um homem consumido pela própria ambição, que sacrificou a inocência para abrir as portas de uma Era de Demônios.",
  "A Deusa Crona o isolou em uma linha do tempo morta. Sob um céu envelhecido, ele aguardou o Alinhamento das Esferas...",
  "Hoje, o ciclo de dez mil anos se completa.\nO Eclipse Sanguíneo rasgou o Véu.\nO Corvo está livre. E suas marionetes já caminham entre nós.",
  "A maioria continua cega, ignorando a fenda e os monstros que espreitam nas esquinas da nossa cidade.\nMas a luz vermelha tocou você."
];

// Lazy load da cena 3D para não bloquear a intro
const CinematicScene = React.lazy(() => import('./CinematicScene'));

// ─── NARRADOR (Web Speech API) ───────────────────────────────────────────────
function speakLine(text, onEnd) {
  // Remove quebras de linha para a voz soar contínua
  const cleanText = text.replace(/\n/g, '. ');
  const utterance = new SpeechSynthesisUtterance(cleanText);
  utterance.lang = 'pt-BR';
  utterance.rate = 0.88;  // Um pouco mais lento para tom dramático
  utterance.pitch = 0.85; // Tom mais grave e sombrio
  utterance.volume = 1.0;

  // Tenta encontrar uma voz masculina em PT-BR
  const voices = speechSynthesis.getVoices();
  const ptVoice = voices.find(v => v.lang.startsWith('pt') && v.name.toLowerCase().includes('male'))
    || voices.find(v => v.lang.startsWith('pt-BR'))
    || voices.find(v => v.lang.startsWith('pt'))
    || null;
  if (ptVoice) utterance.voice = ptVoice;

  utterance.onend = onEnd;
  utterance.onerror = onEnd; // Se falhar, continua mesmo assim
  speechSynthesis.speak(utterance);
}

export default function IntroScreen({ onFinishIntro }) {
  const [currentLine, setCurrentLine] = useState(0);
  const [fadeState, setFadeState] = useState('fade-in');
  const [showButton, setShowButton] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const audioRef = useRef(null);
  const isNarrating = useRef(false);

  // Baixa o volume da música durante a narração
  const setMusicVolume = useCallback((vol) => {
    if (audioRef.current) {
      // Transição suave de volume
      const target = vol;
      const step = () => {
        if (!audioRef.current) return;
        const curr = audioRef.current.volume;
        const diff = target - curr;
        if (Math.abs(diff) < 0.02) {
          audioRef.current.volume = target;
          return;
        }
        audioRef.current.volume = curr + diff * 0.15;
        requestAnimationFrame(step);
      };
      step();
    }
  }, []);

  const handleStart = () => {
    setHasStarted(true);
    if (audioRef.current) {
      audioRef.current.volume = 0.5;
      audioRef.current.play().catch(err => {
        console.warn("Erro no play da tag principal, tentando fallback:", err);
        const fallbackAudio = new Audio(themeAudio);
        fallbackAudio.volume = 0.5;
        fallbackAudio.play().catch(e => console.error("Fallback também falhou:", e));
      });
    }
    // Carrega as vozes do sistema (necessário em alguns navegadores)
    speechSynthesis.getVoices();
  };

  useEffect(() => {
    if (!hasStarted) return;
    
    // Quando os textos acabam, seguramos o suspense até o drop da música!
    if (currentLine >= storyLines.length) {
      // Restaura o volume da música para o clímax
      setMusicVolume(0.5);
      isNarrating.current = false;

      const checkAudioInterval = setInterval(() => {
        if (audioRef.current && audioRef.current.currentTime >= MUSIC_DROP_TIME) {
          setShowButton(true);
          clearInterval(checkAudioInterval);
        }
      }, 100);
      return () => clearInterval(checkAudioInterval);
    }

    // Fase 1: Fade in do texto
    const fadeInTimeout = setTimeout(() => {
      setFadeState('visible');

      // Fase 2: Inicia a narração e baixa a música
      setTimeout(() => {
        setMusicVolume(0.12); // Baixa a música bastante
        isNarrating.current = true;
        speakLine(storyLines[currentLine], () => {
          // Narração terminou — restaura música e faz fade out
          isNarrating.current = false;
          setMusicVolume(0.5);
        });
      }, 300);
    }, 500);

    const visibleTime = storyLines[currentLine].length > 60 ? 6500 : 4000;

    const fadeOutTimeout = setTimeout(() => {
      setFadeState('fade-out');
      // Se ainda estiver narrando, cancela para não sobrepor
      if (isNarrating.current) {
        speechSynthesis.cancel();
        isNarrating.current = false;
        setMusicVolume(0.5);
      }
    }, 500 + visibleTime);

    const nextLineTimeout = setTimeout(() => {
      setCurrentLine(prev => prev + 1);
      setFadeState('fade-in');
    }, 500 + visibleTime + 1500);

    return () => {
      clearTimeout(fadeInTimeout);
      clearTimeout(fadeOutTimeout);
      clearTimeout(nextLineTimeout);
      speechSynthesis.cancel(); // Limpa narração pendente
    };
  }, [currentLine, hasStarted, setMusicVolume]);

  return (
    <div className="intro-container">
      {/* Áudio da Cinematic */}
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
            <h1>UMBRA</h1>
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
