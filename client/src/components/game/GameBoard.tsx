import { useRef, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import { Card } from "@/lib/stores/useCardGame";
import Card3D from "./Card3D";

interface GameBoardProps {
  playerCards: Card[];
  opponentCards: Card[];
  playerDeck: Card[];
  opponentDeck: Card[];
  currentTurn: "player" | "opponent";
  onPlayCard: (cardId: number, position: { x: number, y: number, z: number }) => void;
}

const GameBoard = ({ 
  playerCards, 
  opponentCards, 
  playerDeck, 
  opponentDeck, 
  currentTurn, 
  onPlayCard 
}: GameBoardProps) => {
  const { scene } = useThree();
  
  // Refs
  const boardRef = useRef<THREE.Group>(null);
  const fieldRef = useRef<THREE.Mesh>(null);
  
  // Load textures
  const woodTexture = useTexture("/textures/wood.jpg");
  woodTexture.wrapS = THREE.RepeatWrapping;
  woodTexture.wrapT = THREE.RepeatWrapping;
  woodTexture.repeat.set(4, 4);
  
  // Set up play areas
  const playerFieldPosition = useMemo(() => new THREE.Vector3(0, 0.02, 2), []);
  const opponentFieldPosition = useMemo(() => new THREE.Vector3(0, 0.02, -2), []);
  const playerDeckPosition = useMemo(() => new THREE.Vector3(-4, 0.1, 3), []);
  const opponentDeckPosition = useMemo(() => new THREE.Vector3(4, 0.1, -3), []);
  
  // Card positions
  const getPlayerCardPosition = (index: number, total: number) => {
    const spacing = Math.min(1.2, 5 / total);
    const width = total * spacing;
    const startX = -width / 2 + spacing / 2;
    
    return new THREE.Vector3(
      startX + index * spacing,
      0.1,
      4
    );
  };
  
  const getOpponentCardPosition = (index: number, total: number) => {
    const spacing = Math.min(1.2, 5 / total);
    const width = total * spacing;
    const startX = -width / 2 + spacing / 2;
    
    return new THREE.Vector3(
      startX + index * spacing,
      0.1,
      -4
    );
  };
  
  // Handle playing a card
  const handlePlayCard = (cardId: number) => {
    // Find an empty spot in the player's field area
    const position = {
      x: Math.random() * 3 - 1.5,
      y: 0.02,
      z: playerFieldPosition.z + Math.random() * 1 - 0.5
    };
    
    onPlayCard(cardId, position);
  };
  
  // Animation
  useFrame((_, delta) => {
    if (boardRef.current) {
      // Subtle board movement
      boardRef.current.rotation.y = Math.sin(Date.now() * 0.0005) * 0.02;
    }
  });
  
  // Raycaster for card selection
  const handlePointerDown = (cardId: number) => {
    if (currentTurn === "player") {
      handlePlayCard(cardId);
    }
  };
  
  return (
    <group ref={boardRef}>
      {/* Table surface */}
      <mesh 
        receiveShadow 
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[0, -0.1, 0]}
      >
        <planeGeometry args={[12, 12]} />
        <meshStandardMaterial map={woodTexture} color="#5a3e2a" />
      </mesh>
      
      {/* Player's field */}
      <mesh 
        ref={fieldRef}
        receiveShadow 
        position={playerFieldPosition} 
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[6, 3]} />
        <meshStandardMaterial color="#2a623d" transparent opacity={0.7} />
      </mesh>
      
      {/* Opponent's field */}
      <mesh 
        receiveShadow 
        position={opponentFieldPosition} 
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[6, 3]} />
        <meshStandardMaterial color="#622a2a" transparent opacity={0.7} />
      </mesh>
      
      {/* Player's deck */}
      <group position={playerDeckPosition}>
        {playerDeck.length > 0 && (
          Array.from({ length: Math.min(playerDeck.length, 10) }).map((_, i) => (
            <mesh 
              key={`player-deck-${i}`} 
              position={[0, i * 0.01, 0]} 
              rotation={[0, Math.PI, 0]}
              castShadow
            >
              <boxGeometry args={[1, 0.01, 1.5]} />
              <meshStandardMaterial color="#162447" />
            </mesh>
          ))
        )}
        <mesh position={[0, 0.15, 0]}>
          <textGeometry args={["Deck", { size: 0.2, height: 0.05 }]} />
          <meshStandardMaterial color="white" />
        </mesh>
        <mesh position={[0, 0, 0]}>
          <textGeometry args={[playerDeck.length.toString(), { size: 0.3, height: 0.05 }]} />
          <meshStandardMaterial color="white" />
        </mesh>
      </group>
      
      {/* Opponent's deck */}
      <group position={opponentDeckPosition}>
        {opponentDeck.length > 0 && (
          Array.from({ length: Math.min(opponentDeck.length, 10) }).map((_, i) => (
            <mesh 
              key={`opponent-deck-${i}`} 
              position={[0, i * 0.01, 0]}
              castShadow
            >
              <boxGeometry args={[1, 0.01, 1.5]} />
              <meshStandardMaterial color="#461220" />
            </mesh>
          ))
        )}
        <mesh position={[0, 0.15, 0]}>
          <textGeometry args={["Deck", { size: 0.2, height: 0.05 }]} />
          <meshStandardMaterial color="white" />
        </mesh>
        <mesh position={[0, 0, 0]}>
          <textGeometry args={[opponentDeck.length.toString(), { size: 0.3, height: 0.05 }]} />
          <meshStandardMaterial color="white" />
        </mesh>
      </group>
      
      {/* Player cards */}
      {playerCards.map((card, index) => (
        <Card3D
          key={`player-card-${card.id}`}
          card={card}
          position={getPlayerCardPosition(index, playerCards.length)}
          rotation={[0, 0, 0]}
          isPlayerCard={true}
          isPlayable={currentTurn === "player"}
          onSelect={() => handlePointerDown(card.id)}
        />
      ))}
      
      {/* Opponent cards (face down) */}
      {opponentCards.map((card, index) => (
        <Card3D
          key={`opponent-card-${card.id}`}
          card={card}
          position={getOpponentCardPosition(index, opponentCards.length)}
          rotation={[0, Math.PI, 0]}
          isPlayerCard={false}
          isPlayable={false}
          faceDown={true}
        />
      ))}
    </group>
  );
};

export default GameBoard;
