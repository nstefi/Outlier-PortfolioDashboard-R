import { useState, useRef, useEffect } from "react";
import { useSpring, animated } from "@react-spring/three";
import { useTexture, Text } from "@react-three/drei";
import { useFrame, ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import { useAudio } from "@/lib/stores/useAudio";
import { Card } from "@/lib/stores/useCardGame";

interface Card3DProps {
  card: Card;
  position: THREE.Vector3;
  rotation?: THREE.Euler | [number, number, number];
  scale?: THREE.Vector3 | [number, number, number];
  isPlayerCard: boolean;
  isPlayable: boolean;
  faceDown?: boolean;
  onSelect?: () => void;
}

const Card3D = ({
  card,
  position,
  rotation = [0, 0, 0],
  scale = [1, 1, 1],
  isPlayerCard,
  isPlayable,
  faceDown = false,
  onSelect
}: Card3DProps) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const [selected, setSelected] = useState(false);
  const { playHit } = useAudio();
  
  // Load textures
  const woodTexture = useTexture("/textures/wood.jpg");
  
  // Animation springs
  const { cardPosition, cardRotation, cardScale } = useSpring({
    from: {
      cardPosition: [position.x, position.y - 1, position.z],
      cardRotation: [rotation instanceof THREE.Euler ? rotation.x : rotation[0], 
                    rotation instanceof THREE.Euler ? rotation.y : rotation[1], 
                    rotation instanceof THREE.Euler ? rotation.z : rotation[2]],
      cardScale: [scale instanceof THREE.Vector3 ? scale.x : scale[0], 
                 scale instanceof THREE.Vector3 ? scale.y : scale[1], 
                 scale instanceof THREE.Vector3 ? scale.z : scale[2]]
    },
    to: {
      cardPosition: [position.x, position.y, position.z],
      cardRotation: [rotation instanceof THREE.Euler ? rotation.x : rotation[0], 
                    rotation instanceof THREE.Euler ? rotation.y : rotation[1], 
                    rotation instanceof THREE.Euler ? rotation.z : rotation[2]],
      cardScale: [scale instanceof THREE.Vector3 ? scale.x : scale[0], 
                 scale instanceof THREE.Vector3 ? scale.y : scale[1], 
                 scale instanceof THREE.Vector3 ? scale.z : scale[2]]
    },
    config: { mass: 1, tension: 280, friction: 60 }
  });
  
  // Hover effect
  const hoverProps = useSpring({
    hoverY: hovered && isPlayerCard ? 0.3 : 0,
    hoverScale: hovered && isPlayerCard ? 1.1 : 1,
    hoverRotX: hovered && isPlayerCard ? -0.2 : 0,
    config: { mass: 1, tension: 280, friction: 60 }
  });

  // Card color based on type
  const getCardColor = () => {
    switch (card.type) {
      case "attack": return "#cf3030";
      case "defense": return "#3057cf";
      case "magic": return "#9930cf";
      case "creature": return "#30cf57";
      default: return "#7a7a7a";
    }
  };

  // Handle card interaction
  const handlePointerDown = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    if (isPlayable && isPlayerCard && onSelect) {
      setSelected(true);
      playHit();
      onSelect();
    }
  };
  
  const handlePointerOver = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    if (isPlayerCard) {
      setHovered(true);
      document.body.style.cursor = isPlayable ? "pointer" : "default";
    }
  };
  
  const handlePointerOut = () => {
    setHovered(false);
    document.body.style.cursor = "default";
  };
  
  // Reset selected state after animation
  useEffect(() => {
    if (selected) {
      const timer = setTimeout(() => setSelected(false), 300);
      return () => clearTimeout(timer);
    }
  }, [selected]);
  
  // Floating animation
  useFrame((_, delta) => {
    if (meshRef.current && !selected) {
      meshRef.current.position.y += Math.sin(Date.now() * 0.003) * 0.0005;
    }
  });
  
  return (
    <animated.group
      position={cardPosition as any}
      rotation={cardRotation as any}
      scale={cardScale as any}
    >
      <animated.mesh
        ref={meshRef}
        castShadow
        position-y={hoverProps.hoverY}
        rotation-x={hoverProps.hoverRotX}
        scale-x={hoverProps.hoverScale}
        scale-y={hoverProps.hoverScale}
        scale-z={hoverProps.hoverScale}
        onPointerDown={handlePointerDown}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        {/* Card base */}
        <boxGeometry args={[1, 0.05, 1.5]} />
        <meshStandardMaterial color={faceDown ? "#2a3b4c" : "#f5f5f5"} />
        
        {/* Card border */}
        <mesh position={[0, 0.03, 0]}>
          <boxGeometry args={[0.95, 0.02, 1.45]} />
          <meshStandardMaterial color={faceDown ? "#1a2536" : getCardColor()} />
        </mesh>
        
        {!faceDown && (
          <>
            {/* Card name */}
            <Text
              position={[0, 0.04, 0.6]}
              rotation={[0, 0, 0]}
              fontSize={0.13}
              maxWidth={0.9}
              textAlign="center"
              color="#000000"
            >
              {card.name}
            </Text>
            
            {/* Card image area */}
            <mesh position={[0, 0.04, 0.1]}>
              <boxGeometry args={[0.8, 0.02, 0.8]} />
              <meshStandardMaterial map={woodTexture} color={getCardColor()} opacity={0.7} transparent />
            </mesh>
            
            {/* Card stats */}
            <Text
              position={[-0.35, 0.04, -0.5]}
              rotation={[0, 0, 0]}
              fontSize={0.15}
              maxWidth={0.4}
              textAlign="center"
              color="#cc0000"
            >
              {card.attack}
            </Text>
            
            <Text
              position={[0.35, 0.04, -0.5]}
              rotation={[0, 0, 0]}
              fontSize={0.15}
              maxWidth={0.4}
              textAlign="center"
              color="#0066cc"
            >
              {card.defense}
            </Text>
            
            {/* Card cost */}
            <mesh position={[0.4, 0.04, 0.6]} rotation={[0, 0, 0]}>
              <circleGeometry args={[0.15, 32]} />
              <meshStandardMaterial color="#4a90e2" />
            </mesh>
            
            <Text
              position={[0.4, 0.06, 0.6]}
              rotation={[0, 0, 0]}
              fontSize={0.15}
              maxWidth={0.2}
              textAlign="center"
              color="#ffffff"
            >
              {card.cost}
            </Text>
          </>
        )}
      </animated.mesh>
    </animated.group>
  );
};

export default Card3D;
