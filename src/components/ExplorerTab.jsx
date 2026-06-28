import { useState, useEffect } from 'react'
import ARView from './ARView'
import CameraView from './CameraView'

const ExplorerTab = () => {
  const [webxrSupported, setWebxrSupported] = useState(null)

  useEffect(() => {
    if ('xr' in navigator) {
      navigator.xr.isSessionSupported('immersive-ar').then(
        supported => setWebxrSupported(supported),
        () => setWebxrSupported(false)
      )
    } else {
      setWebxrSupported(false)
    }
  }, [])

  if (webxrSupported === null) {
    return (
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          width: 40, height: 40,
          border: '3px solid #8B0000', borderTopColor: 'transparent',
          borderRadius: '50%',
          animation: 'camera-spin 0.6s linear infinite',
        }} />
      </div>
    )
  }

  if (webxrSupported) {
    return <ARView />
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <div style={{
        padding: '0.8rem 1rem', textAlign: 'center',
        backgroundColor: 'rgba(139,0,0,0.15)',
        borderBottom: '1px solid rgba(139,0,0,0.3)',
      }}>
        <span style={{ color: '#aaa', fontSize: '0.8rem' }}>
          AR não disponível neste dispositivo. Mostrando câmera simples.
        </span>
      </div>
      <CameraView />
    </div>
  )
}

export default ExplorerTab
