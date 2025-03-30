import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stats } from "@react-three/drei";
import { Suspense, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useCardGame } from "@/lib/stores/useCardGame";
import { useMultiplayer } from "@/lib/stores/useMultiplayer";
import { useAudio } from "@/lib/stores/useAudio";
import GameBoard from "./GameBoard";
import GameUI from "./GameUI";

const Game = () => {
  const navigate = useNavigate();
  const { 
    gameState, 
    playerHand, 
    opponentHand, 
    playerDeck, 
    opponentDeck,
    playerHealth,
    opponentHealth,
    playerMana,
    opponentMana,
    currentTurn,
    playCard,
    drawCard,
    endTurn,
    initializeGame
  } = useCardGame();
  
  const { 
    connection, 
    isConnected, 
    gameId, 
    opponentInfo 
  } = useMultiplayer();
  
  const { backgroundMusic, toggleMute, isMuted } = useAudio();

  // Initialize the game
  useEffect(() => {
    // Start background music
    if (backgroundMusic && !backgroundMusic.paused) {
      backgroundMusic.play().catch(err => console.log("Autoplay prevented:", err));
    }
    
    // Initialize game state
    initializeGame();
    
    // Clean up when leaving the game
    return () => {
      if (backgroundMusic) {
        backgroundMusic.pause();
      }
    };
  }, [backgroundMusic, initializeGame]);

  // Handle game end
  useEffect(() => {
    if (gameState === "ended") {
      const timeout = setTimeout(() => {
        navigate('/');
      }, 5000);
      
      return () => clearTimeout(timeout);
    }
  }, [gameState, navigate]);

  // Handle disconnection
  useEffect(() => {
    if (!isConnected && gameState !== "loading") {
      navigate('/lobby');
    }
  }, [isConnected, gameState, navigate]);

  return (
    <div className="w-full h-full relative overflow-hidden">
      <Canvas
        shadows
        camera={{
          position: [0, 10, 10],
          fov: 45,
          near: 0.1,
          far: 100
        }}
        gl={{
          antialias: true,
          powerPreference: "default"
        }}
      >
        <color attach="background" args={["#1a1a2e"]} />
        
        {/* Add ambient light and directional light for shadows */}
        <ambientLight intensity={0.4} />
        <directionalLight 
          position={[5, 10, 5]} 
          intensity={0.8} 
          castShadow 
          shadow-mapSize-width={1024} 
          shadow-mapSize-height={1024} 
        />
        
        <Suspense fallback={null}>
          <GameBoard 
            playerCards={playerHand}
            opponentCards={opponentHand}
            playerDeck={playerDeck}
            opponentDeck={opponentDeck}
            currentTurn={currentTurn}
            onPlayCard={playCard}
          />
        </Suspense>
        
        <OrbitControls 
          enablePan={false} 
          enableZoom={true} 
          maxPolarAngle={Math.PI / 2.5} 
          minPolarAngle={Math.PI / 4}
        />
        
        {process.env.NODE_ENV === 'development' && <Stats />}
      </Canvas>
      
      <GameUI 
        playerHealth={playerHealth}
        opponentHealth={opponentHealth}
        playerMana={playerMana}
        opponentMana={opponentMana}
        gameState={gameState}
        currentTurn={currentTurn}
        playerHand={playerHand}
        opponentInfo={opponentInfo}
        onDrawCard={drawCard}
        onEndTurn={endTurn}
      />
      
      {/* Sound toggle button */}
      <Button 
        variant="ghost" 
        size="icon"
        className="absolute top-4 right-4 z-50"
        onClick={toggleMute}
      >
        {isMuted ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path></svg>
        )}
      </Button>
      
      {/* Return to lobby button */}
      <Button 
        variant="outline" 
        className="absolute top-4 left-4 z-50"
        onClick={() => navigate('/lobby')}
      >
        Leave Game
      </Button>
    </div>
  );
};

export default Game;
