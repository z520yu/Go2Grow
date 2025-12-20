import React, { useRef, useMemo, useState, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Text, ScrollControls, useScroll, Float, RoundedBox, Sparkles, Image, useCursor } from '@react-three/drei';
import * as THREE from 'three';
import { MemoryEntry } from '../types';
import { BookOpen, RefreshCw } from 'lucide-react';
import { storage } from '../services/storage';

interface TimelineViewProps {
  entries: MemoryEntry[];
  onSelectEntry?: (entry: MemoryEntry) => void;
  goals?: any; 
}

// Error Boundary
class ImageErrorBoundary extends React.Component<{ fallback: React.ReactNode, children?: React.ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

const getMoodColor = (mood?: number) => {
    if (mood === undefined) return "#6366f1"; 
    if (mood >= 70) return "#f43f5e"; 
    if (mood <= 40) return "#3b82f6"; 
    return "#10b981"; 
};

// === COMPONENT: Spiral Chip ===
const SpiralChip = ({ entry, position, rotation, onClick }: { entry: MemoryEntry, position: [number, number, number], rotation: [number, number, number], onClick: (e: MemoryEntry) => void }) => {
  const ref = useRef<THREE.Group>(null);
  const [hovered, setHover] = useState(false);
  useCursor(hovered);

  useFrame((state, delta) => {
    if (ref.current) {
        const targetScale = hovered ? 1.15 : 1;
        ref.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), delta * 8);
    }
  });

  const baseColor = getMoodColor(entry.userMood);
  const isReport = entry.type === 'daily_report';
  const width = 1.2;
  const height = 1.6;

  return (
    <group 
        ref={ref} 
        position={position}
        rotation={rotation}
        onClick={(e) => { e.stopPropagation(); onClick(entry); }}
        onPointerOver={() => setHover(true)}
        onPointerOut={() => setHover(false)}
    >
      <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5} floatingRange={[-0.1, 0.1]}>
          <RoundedBox args={[width, height, 0.1]} radius={0.05} smoothness={4}>
             <meshPhysicalMaterial 
                color={isReport ? "#fbbf24" : "#1e293b"} 
                roughness={0.2}
                metalness={0.8}
                transparent
                opacity={0.85}
                emissive={baseColor}
                emissiveIntensity={hovered ? 0.3 : 0.1} 
             />
          </RoundedBox>

          {entry.generatedCardUrl && (
             <ImageErrorBoundary fallback={null}>
                 <Suspense fallback={null}>
                     <Image 
                        url={entry.generatedCardUrl}
                        position={[0, 0, 0.06]}
                        scale={[width * 0.9, height * 0.9]}
                        transparent
                        opacity={0.9}
                     />
                 </Suspense>
             </ImageErrorBoundary>
          )}

          {/* Date Label */}
          <Text
            position={[0, height/2 + 0.2, 0]}
            fontSize={0.12}
            color={baseColor}
            anchorX="center"
            anchorY="bottom"
          >
             {new Date(entry.timestamp).toLocaleDateString(undefined, {month:'numeric', day:'numeric'})}
          </Text>

          {/* Title Label */}
          <Text
            position={[0, -height/2 - 0.2, 0]}
            fontSize={0.15}
            color="white"
            anchorX="center"
            anchorY="top"
            maxWidth={2}
            textAlign="center"
          >
            {entry.title}
          </Text>
      </Float>
    </group>
  );
};

// === SCENE: Spiral Logic ===
const SpiralScene = ({ entries, onSelect }: { entries: MemoryEntry[], onSelect: (e: MemoryEntry) => void }) => {
  const scroll = useScroll();
  const groupRef = useRef<THREE.Group>(null);

  const { cards, pathPoints } = useMemo(() => {
    const _cards = [];
    const _points = [];
    const radius = 2.2;
    const ySpacing = 1.2;
    const angleStep = 0.8;

    for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];
        const angle = i * angleStep;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        const z = -i * ySpacing;

        const pos = new THREE.Vector3(x, y, z);
        const dummy = new THREE.Object3D();
        dummy.position.copy(pos);
        dummy.lookAt(0, 0, z + 2); // Look slightly ahead center

        _cards.push({
            entry,
            pos: [x, y, z] as [number, number, number],
            rot: [dummy.rotation.x, dummy.rotation.y, dummy.rotation.z] as [number, number, number],
        });
        _points.push(pos);
    }
    return { cards: _cards, pathPoints: _points };
  }, [entries]);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const scrollOffset = scroll ? scroll.offset : 0;
    
    // Vertical Movement
    const totalDepth = entries.length * 1.2;
    const targetZ = scrollOffset * (totalDepth - 2) + 1;

    // Spiral Rotation
    const targetRot = scrollOffset * Math.PI * 0.5;

    groupRef.current.position.z = THREE.MathUtils.damp(groupRef.current.position.z, targetZ, 6, delta);
    groupRef.current.rotation.z = THREE.MathUtils.damp(groupRef.current.rotation.z, targetRot, 4, delta);
  });

  // Curve Line
  const curve = useMemo(() => pathPoints.length > 1 ? new THREE.CatmullRomCurve3(pathPoints) : null, [pathPoints]);

  return (
    <group ref={groupRef}>
      {curve && (
         <mesh>
            <tubeGeometry args={[curve, pathPoints.length * 8, 0.02, 8, false]} />
            <meshBasicMaterial color="#4f46e5" transparent opacity={0.2} />
         </mesh>
      )}
      
      {cards.map((c) => (
        <SpiralChip 
            key={c.entry.id} 
            entry={c.entry} 
            position={c.pos} 
            rotation={c.rot}
            onClick={onSelect}
        />
      ))}
      
      <Sparkles 
         count={Math.min(entries.length * 15, 300)}
         scale={[6, 6, entries.length * 1.5 + 5]} 
         position={[0, 0, -entries.length * 0.6]} 
         size={2}
         speed={0.2}
         opacity={0.3}
         color="#818cf8"
      />
    </group>
  );
};

export const TimelineView: React.FC<TimelineViewProps> = ({ entries, onSelectEntry }) => {
  const handleSeed = async () => {
      if (confirm("是否生成演示数据？")) {
          await storage.clearDatabase();
          await storage.seedMockData();
          window.location.reload();
      }
  }

  if (!entries || entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-slate-500 gap-4">
        <BookOpen size={40} />
        <p>时间轴为空</p>
        <button onClick={handleSeed} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 rounded-full text-white text-sm">
            <RefreshCw size={14} /> 生成测试数据
        </button>
      </div>
    );
  }

  const sortedEntries = [...entries].sort((a, b) => b.timestamp - a.timestamp);
  const totalPages = Math.max(2, sortedEntries.length * 0.25);

  return (
    <div className="w-full h-[75vh] bg-black/60 rounded-3xl border border-white/10 overflow-hidden relative shadow-2xl transition-all duration-500">
      
      <div className="absolute top-6 left-6 z-10 pointer-events-none mix-blend-screen hidden md:block">
         <p className="text-[10px] text-indigo-400 font-mono uppercase tracking-[0.4em] animate-pulse">Neural Archives</p>
      </div>
      
      <div className="absolute bottom-6 left-0 right-0 text-center z-10 pointer-events-none">
         <p className="text-[9px] text-slate-600 font-mono">SCROLL TO DIVE</p>
      </div>
      
      <Canvas camera={{ position: [0, 0, 6], fov: 45 }} dpr={[1, 2]}>
        <ambientLight intensity={0.2} />
        <pointLight position={[10, 10, 10]} intensity={1} color="#818cf8" />
        <pointLight position={[-10, -10, 5]} intensity={0.5} color="#f43f5e" />
        <fog attach="fog" args={['#000000', 5, 25]} />

        <Suspense fallback={null}>
            <ScrollControls pages={totalPages} damping={0.2} distance={1}>
                <SpiralScene entries={sortedEntries} onSelect={onSelectEntry || (() => {})} />
            </ScrollControls>
        </Suspense>
      </Canvas>
    </div>
  );
};
