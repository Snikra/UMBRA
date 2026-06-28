import { useState, useRef, useEffect, useCallback } from 'react'

const CameraView = () => {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const [facingMode, setFacingMode] = useState('environment')
  const [error, setError] = useState(null)
  const [permission, setPermission] = useState(null)

  const startCamera = useCallback(async () => {
    setError(null)
    setPermission(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      setPermission('granted')
    } catch (err) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setPermission('denied')
      } else if (err.name === 'NotFoundError') {
        setPermission('unavailable')
      } else {
        setPermission('error')
        setError(err.message)
      }
    }
  }, [facingMode])

  useEffect(() => {
    startCamera()
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop())
      }
    }
  }, [startCamera])

  const toggleCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
    }
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment')
  }

  if (permission === 'denied') {
    return (
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', padding: 32, textAlign: 'center', gap: 16,
      }}>
        <span style={{ fontSize: '3rem' }}>🚫</span>
        <h2 style={{ color: '#fff', fontFamily: 'Cinzel, serif' }}>ACESSO NEGADO</h2>
        <p style={{ color: '#aaa', fontSize: '0.9rem' }}>
          Permissão da câmera foi bloqueada. Acesse as configurações do seu navegador e permita o acesso à câmera.
        </p>
        <button
          onClick={() => setPermission(null)}
          style={{
            marginTop: 8, backgroundColor: '#8B0000', color: '#fff',
            border: 'none', padding: '10px 24px', borderRadius: 6, cursor: 'pointer',
          }}
        >
          Tentar Novamente
        </button>
      </div>
    )
  }

  if (permission === 'unavailable') {
    return (
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', padding: 32, textAlign: 'center', gap: 16,
      }}>
        <span style={{ fontSize: '3rem' }}>📷</span>
        <h2 style={{ color: '#fff', fontFamily: 'Cinzel, serif' }}>CÂMERA NÃO ENCONTRADA</h2>
        <p style={{ color: '#aaa', fontSize: '0.9rem' }}>
          Nenhuma câmera foi detectada neste dispositivo.
        </p>
      </div>
    )
  }

  if (permission === 'error') {
    return (
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', padding: 32, textAlign: 'center', gap: 16,
      }}>
        <span style={{ fontSize: '3rem' }}>⚠️</span>
        <h2 style={{ color: '#fff', fontFamily: 'Cinzel, serif' }}>ERRO NA CÂMERA</h2>
        <p style={{ color: '#aaa', fontSize: '0.9rem' }}>{error}</p>
        <button
          onClick={() => { setError(null); setPermission(null); startCamera() }}
          style={{
            marginTop: 8, backgroundColor: '#8B0000', color: '#fff',
            border: 'none', padding: '10px 24px', borderRadius: 6, cursor: 'pointer',
          }}
        >
          Tentar Novamente
        </button>
      </div>
    )
  }

  if (permission !== 'granted') {
    return (
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', padding: 32, textAlign: 'center', gap: 16,
      }}>
        <span style={{ fontSize: '3rem' }}>📸</span>
        <h2 style={{ color: '#fff', fontFamily: 'Cinzel, serif' }}>REALIDADE AUMENTADA</h2>
        <p style={{ color: '#aaa', fontSize: '0.9rem' }}>
          Ative a câmera para usar recursos de RA.
        </p>
        <button
          onClick={startCamera}
          style={{
            marginTop: 8, backgroundColor: '#8B0000', color: '#fff',
            border: 'none', padding: '10px 24px', borderRadius: 6, cursor: 'pointer',
          }}
        >
          Ativar Câmera
        </button>
      </div>
    )
  }

  return (
    <div style={{ flex: 1, position: 'relative', backgroundColor: '#000', overflow: 'hidden' }}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />

      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        padding: '1rem', textAlign: 'center',
        background: 'linear-gradient(180deg, rgba(0,0,0,0.6) 0%, transparent 100%)',
      }}>
        <span style={{
          fontFamily: 'Cinzel, serif', color: '#fff', fontSize: '0.9rem',
          textShadow: '0 0 10px rgba(139,0,0,0.8)',
        }}>
          MODO RA
        </span>
      </div>

      <div style={{
        position: 'absolute', bottom: 32, left: 0, right: 0,
        display: 'flex', justifyContent: 'center', gap: 16,
      }}>
        <button
          onClick={toggleCamera}
          style={{
            backgroundColor: 'rgba(0,0,0,0.6)', color: '#fff',
            border: '2px solid #8B0000', borderRadius: '50%',
            width: 56, height: 56, fontSize: '1.5rem', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          🔄
        </button>
      </div>

      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 4,
        background: 'linear-gradient(90deg, transparent, #8B0000, transparent)',
        boxShadow: '0 0 15px rgba(139,0,0,0.6)',
      }} />
    </div>
  )
}

export default CameraView
