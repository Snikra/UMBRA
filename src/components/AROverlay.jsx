import { Suspense, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'

function GoblinModel() {
  const groupRef = useRef()

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.5
    }
  })

  return (
    <group ref={groupRef} position={[0, -0.5, 0]}>
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

function Scene() {
  return (
    <>
      <ambientLight intensity={0.8} />
      <directionalLight position={[5, 10, 5]} intensity={1.2} />
      <directionalLight position={[-3, 5, -3]} intensity={0.4} />
      <GoblinModel />
    </>
  )
}

const AROverlay = () => {
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 5 }}>
      <Canvas
        camera={{ position: [0, 1, 3], fov: 50 }}
        gl={{ alpha: true, antialias: true }}
        style={{ background: 'transparent' }}
      >
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>
    </div>
  )
}

export default AROverlay
