import { useRef, useState, useCallback } from 'react'
import { Canvas } from '@react-three/fiber'
import { createXRStore, XR, IfInSessionMode, useXRRequestHitTest, XRDomOverlay } from '@react-three/xr'
import { Matrix4, Vector3 } from 'three'

const store = createXRStore({
  hand: false,
  controller: false,
  gaze: false,
  transientPointer: false,
  screenInput: false,
})

function GoblinModel({ position, scale = 0.25 }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 1.2, 0]}>
        <sphereGeometry args={[0.5, 8, 8]} />
        <meshStandardMaterial color="#6b8e23" flatShading />
      </mesh>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.8, 0.9, 0.5]} />
        <meshStandardMaterial color="#556b2f" flatShading />
      </mesh>
      <mesh position={[-0.4, -0.3, 0]}>
        <boxGeometry args={[0.3, 0.7, 0.3]} />
        <meshStandardMaterial color="#556b2f" flatShading />
      </mesh>
      <mesh position={[0.4, -0.3, 0]}>
        <boxGeometry args={[0.3, 0.7, 0.3]} />
        <meshStandardMaterial color="#556b2f" flatShading />
      </mesh>
      <mesh position={[0, 1.2, 0.5]}>
        <coneGeometry args={[0.1, 0.3, 6]} />
        <meshStandardMaterial color="#ff6347" flatShading />
      </mesh>
      <mesh position={[0.2, 1.35, 0.45]}>
        <sphereGeometry args={[0.08, 6, 6]} />
        <meshStandardMaterial color="#fff" flatShading />
      </mesh>
      <mesh position={[-0.2, 1.35, 0.45]}>
        <sphereGeometry args={[0.08, 6, 6]} />
        <meshStandardMaterial color="#fff" flatShading />
      </mesh>
      <mesh position={[0.2, 1.35, 0.55]}>
        <sphereGeometry args={[0.04, 6, 6]} />
        <meshStandardMaterial color="#111" flatShading />
      </mesh>
      <mesh position={[-0.2, 1.35, 0.55]}>
        <sphereGeometry args={[0.04, 6, 6]} />
        <meshStandardMaterial color="#111" flatShading />
      </mesh>
      <mesh position={[0, 0.95, 0.45]}>
        <sphereGeometry args={[0.04, 6, 6]} />
        <meshStandardMaterial color="#8B0000" flatShading />
      </mesh>
    </group>
  )
}

function ARScene() {
  const requestHitTest = useXRRequestHitTest()
  const [placedGoblins, setPlacedGoblins] = useState([])
  const [placing, setPlacing] = useState(false)
  const matrixHelper = useRef(new Matrix4())
  const posHelper = useRef(new Vector3())

  const handlePlace = useCallback(async () => {
    if (placing) return
    setPlacing(true)
    try {
      const result = await requestHitTest('viewer', ['plane', 'mesh', 'point'])
      if (result && result.results.length > 0) {
        result.getWorldMatrix(matrixHelper.current, result.results[0])
        posHelper.current.setFromMatrixPosition(matrixHelper.current)
        setPlacedGoblins(prev => [...prev, posHelper.current.clone()])
      }
    } finally {
      setPlacing(false)
    }
  }, [requestHitTest, placing])

  return (
    <>
      <ambientLight intensity={0.8} />
      <directionalLight position={[5, 10, 5]} intensity={1.2} />
      <directionalLight position={[-3, 5, -3]} intensity={0.4} />

      {placedGoblins.map((pos, i) => (
        <GoblinModel key={i} position={pos} />
      ))}

      <IfInSessionMode allow="immersive-ar">
        <XRDomOverlay>
          <div style={{
            position: 'fixed', bottom: 40, left: 0, right: 0,
            display: 'flex', justifyContent: 'center', gap: 12, padding: '0 20px',
            pointerEvents: 'auto', zIndex: 10,
          }}>
            <button
              onClick={handlePlace}
              disabled={placing}
              style={{
                backgroundColor: placing ? '#555' : '#8B0000',
                color: '#fff',
                border: 'none',
                padding: '14px 32px',
                borderRadius: 8,
                fontSize: '1rem',
                fontWeight: 'bold',
                cursor: placing ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 15px rgba(0,0,0,0.5)',
                fontFamily: 'Cinzel, serif',
                letterSpacing: 1,
              }}
            >
              {placing ? 'POSICIONANDO...' : `COLOCAR GOBLIN`}
            </button>
            <button
              onClick={() => store.exitXR()}
              style={{
                backgroundColor: 'rgba(0,0,0,0.6)',
                color: '#fff',
                border: '1px solid #666',
                padding: '14px 20px',
                borderRadius: 8,
                fontSize: '0.9rem',
                cursor: 'pointer',
              }}
            >
              SAIR
            </button>
          </div>
        </XRDomOverlay>
      </IfInSessionMode>
    </>
  )
}

const ARView = () => {
  return (
    <div style={{ flex: 1, position: 'relative' }}>
      <div style={{
        position: 'absolute', inset: 0, zIndex: 1,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 16, padding: 32,
        textAlign: 'center', pointerEvents: 'none',
      }}>
        <span style={{ fontSize: '4rem' }}>🥽</span>
        <h2 style={{ fontFamily: 'Cinzel, serif', color: '#fff', textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}>
          REALIDADE AUMENTADA
        </h2>
        <p style={{ color: '#ddd', fontSize: '0.9rem', maxWidth: 300, textShadow: '0 1px 5px rgba(0,0,0,0.8)' }}>
          Aponte a câmera para o chão ou uma mesa e toque em COLOCAR GOBLIN para posicionar o modelo no mundo real.
        </p>
        <button
          onClick={() => store.enterAR()}
          style={{
            backgroundColor: '#8B0000', color: '#fff',
            border: 'none', padding: '14px 40px', borderRadius: 8,
            fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer',
            fontFamily: 'Cinzel, serif', letterSpacing: 1,
            boxShadow: '0 4px 15px rgba(139,0,0,0.4)',
            pointerEvents: 'auto',
          }}
        >
          INICIAR AR
        </button>
      </div>

      <Canvas
        camera={{ position: [0, 1.6, 0], fov: 70 }}
        style={{ position: 'absolute', inset: 0, zIndex: 0 }}
      >
        <XR store={store}>
          <ARScene />
        </XR>
      </Canvas>
    </div>
  )
}

export default ARView
