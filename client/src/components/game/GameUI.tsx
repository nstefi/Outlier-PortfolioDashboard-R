import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAudio } from "@/lib/stores/useAudio";
import CardsHand from "./CardsHand";
import { Card } from "@/lib/stores/useCardGame";

interface GameUIProps {
  playerHealth: number;
  opponentHealth: number;
  playerMana: number;
  opponentMana: number;
  gameState: "loading" | "playing" | "ended";
  currentTurn: "player" | "opponent";
  playerHand: Card[];
  opponentInfo?: { username: string };
  onDrawCard: () => void;
  onEndTurn: () => void;
}

const GameUI = ({
  playerHealth,
  opponentHealth,
  playerMana,
  opponentMana,
  gameState,
  currentTurn,
  playerHand,
  opponentInfo,
  onDrawCard,
  onEndTurn
}: GameUIProps) => {
  const [turnMessage, setTurnMessage] = useState("");
  const [showGameEnd, setShowGameEnd] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const { playSuccess } = useAudio();
  
  // Update turn message when turn changes
  useEffect(() => {
    if (gameState === "playing") {
      setTurnMessage(currentTurn === "player" ? "Your Turn" : "Opponent's Turn");
      
      if (currentTurn === "player") {
        playSuccess();
        toast.info("Your turn");
      }
    }
  }, [currentTurn, gameState, playSuccess]);
  
  // Show game end screen
  useEffect(() => {
    if (gameState === "ended") {
      if (playerHealth <= 0) {
        setWinner("Opponent");
      } else if (opponentHealth <= 0) {
        setWinner("You");
        playSuccess();
      } else {
        setWinner("Draw");
      }
      setShowGameEnd(true);
    }
  }, [gameState, opponentHealth, playerHealth, playSuccess]);
  
  const handleEndTurn = () => {
    if (currentTurn === "player") {
      onEndTurn();
    }
  };
  
  const handleDrawCard = () => {
    if (currentTurn === "player") {
      onDrawCard();
    }
  };
  
  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Top opponent info bar */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center pointer-events-auto">
        <div className="bg-black/50 backdrop-blur-sm p-2 rounded-lg text-white">
          <div className="font-bold">{opponentInfo?.username || "Opponent"}</div>
          <div className="flex items-center gap-2">
            <span>HP:</span>
            <Progress value={opponentHealth} max={30} className="h-2 w-24" />
            <span>{opponentHealth}/30</span>
          </div>
          <div className="flex items-center gap-2">
            <span>Mana:</span>
            <Progress value={opponentMana} max={10} className="h-2 w-24 bg-blue-950">
              <div 
                className="h-full bg-blue-500 transition-all duration-300" 
                style={{ width: `${(opponentMana / 10) * 100}%` }}
              />
            </Progress>
            <span>{opponentMana}/10</span>
          </div>
        </div>
        
        <Badge variant="outline" className="bg-black/50 text-white px-3 py-1">
          {turnMessage}
        </Badge>
      </div>
      
      {/* Bottom player info bar */}
      <div className="absolute bottom-40 left-0 right-0 p-4 flex justify-between items-center pointer-events-auto">
        <div className="bg-black/50 backdrop-blur-sm p-2 rounded-lg text-white">
          <div className="font-bold">You</div>
          <div className="flex items-center gap-2">
            <span>HP:</span>
            <Progress value={playerHealth} max={30} className="h-2 w-24" />
            <span>{playerHealth}/30</span>
          </div>
          <div className="flex items-center gap-2">
            <span>Mana:</span>
            <Progress value={playerMana} max={10} className="h-2 w-24 bg-blue-950">
              <div 
                className="h-full bg-blue-500 transition-all duration-300" 
                style={{ width: `${(playerMana / 10) * 100}%` }}
              />
            </Progress>
            <span>{playerMana}/10</span>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button 
            onClick={handleDrawCard}
            disabled={currentTurn !== "player"}
            className="pointer-events-auto"
          >
            Draw Card
          </Button>
          <Button 
            onClick={handleEndTurn}
            disabled={currentTurn !== "player"}
            className="pointer-events-auto"
          >
            End Turn
          </Button>
        </div>
      </div>
      
      {/* Player hand */}
      <CardsHand 
        cards={playerHand}
        playerMana={playerMana}
        isPlayerTurn={currentTurn === "player"}
        onPlayCard={() => {}}
      />
      
      {/* Game end screen */}
      <AnimatePresence>
        {showGameEnd && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 flex items-center justify-center pointer-events-auto"
          >
            <div className="bg-white rounded-lg p-8 text-center max-w-md">
              <h1 className="text-3xl font-bold mb-4">Game Over</h1>
              <h2 className="text-2xl mb-6">{winner === "You" ? "You Won!" : winner === "Opponent" ? "You Lost!" : "It's a Draw!"}</h2>
              <p className="mb-6">Returning to lobby in a few seconds...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GameUI;
