import { useState, useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'

function QRCodeOverlay({ isOpen, onClose }) {
  const [currentUrl, setCurrentUrl] = useState('')

  useEffect(() => {
    if (isOpen) {
      setCurrentUrl(window.location.href)
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 1000,
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{
        backgroundColor: '#fff',
        padding: '2rem',
        borderRadius: 12,
        textAlign: 'center',
        maxWidth: 320,
        width: '90%',
      }}>
        <h3 style={{ color: '#121212', marginBottom: '1rem', fontFamily: 'Cinzel, serif' }}>
          COMPARTILHAR
        </h3>
        <p style={{ color: '#555', fontSize: '0.85rem', marginBottom: '1rem' }}>
          Escaneie o QR Code com seu celular
        </p>
        <QRCodeSVG value={currentUrl} size={200} />
        <p style={{
          color: '#333',
          fontSize: '0.75rem',
          marginTop: '1rem',
          wordBreak: 'break-all',
          fontFamily: 'monospace',
        }}>
          {currentUrl}
        </p>
        <button
          onClick={onClose}
          style={{
            marginTop: '1.5rem',
            backgroundColor: '#8B0000',
            color: '#fff',
            border: 'none',
            padding: '10px 30px',
            borderRadius: 6,
            fontSize: '1rem',
            cursor: 'pointer',
          }}
        >
          Fechar
        </button>
      </div>
    </div>
  )
}

export default QRCodeOverlay
