
import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';

// 解决环境缺少 R3F 内置 JSX 元素类型定义的问题
const Group = 'group' as any;
const Color = 'color' as any;
const Fog = 'fog' as any;
const AmbientLight = 'ambientLight' as any;

const ParticleField = ({ count = 3000 }) => {
  const points = useRef<THREE.Points>(null!);
  
  // Generate random points in a sphere/cloud
  const positions = useMemo(() => {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 20 * Math.cbrt(Math.random()); // Cube root for even distribution in sphere
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos(2 * Math.random() - 1);
      
      let x = r * Math.sin(phi) * Math.cos(theta);
      let y = r * Math.sin(phi) * Math.sin(theta);
      let z = r * Math.cos(phi);
      
      // Flatten slightly to make a galaxy shape
      y = y * 0.6;
      
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
    }
    return positions;
  }, [count]);

  useFrame((state, delta) => {
    // Rotation
    if (points.current) {
      points.current.rotation.x += delta * 0.02;
      points.current.rotation.y += delta * 0.03;
      
      // Breathing effect
      const time = state.clock.getElapsedTime();
      const scale = 1 + Math.sin(time * 0.5) * 0.05;
      points.current.scale.set(scale, scale, scale);

      // Subtle mouse interaction (Parallax/Magnetic)
      const mouseX = state.pointer.x;
      const mouseY = state.pointer.y;
      
      points.current.rotation.x += (mouseY * 0.2 - points.current.rotation.x) * delta * 0.5;
      points.current.rotation.y += (mouseX * 0.2 - points.current.rotation.y) * delta * 0.5;
    }
  });

  return (
    <Group rotation={[0, 0, Math.PI / 4]}>
      <Points ref={points} positions={positions} stride={3} frustumCulled={false}>
        <PointMaterial
          transparent
          color="#6366f1" // Indigo-500
          size={0.06}
          sizeAttenuation={true}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          opacity={0.6}
        />
      </Points>
    </Group>
  );
};

export const Background3D = () => {
  return (
    <div className="fixed inset-0 z-0 bg-[#050505]">
      <Canvas
        camera={{ position: [0, 0, 15], fov: 60 }}
        dpr={[1, 2]} // Support high DPI screens
        gl={{ antialias: true, alpha: false }}
      >
        <Color attach="background" args={['#050505']} />
        <Fog attach="fog" args={['#050505', 10, 25]} />
        <ParticleField />
        {/* Ambient glow */}
        <AmbientLight intensity={0.5} />
      </Canvas>
      {/* Vignette overlay for focus */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#000000_100%)] opacity-80 pointer-events-none"></div>
    </div>
  );
};
