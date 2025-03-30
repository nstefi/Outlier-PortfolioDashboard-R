import { useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/lib/stores/useCardGame";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CardsHandProps {
  cards: Card[];
  playerMana: number;
  isPlayerTurn: boolean;
  onPlayCard: (cardId: number) => void;
}

const CardsHand = ({ cards, playerMana, isPlayerTurn, onPlayCard }: CardsHandProps) => {
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);
  
  const handleCardClick = (card: Card) => {
    if (!isPlayerTurn || card.cost > playerMana) return;
    
    setSelectedCardId(card.id);
    onPlayCard(card.id);
    
    // Reset selection after a delay
    setTimeout(() => setSelectedCardId(null), 300);
  };

  return (
    <div className="absolute bottom-0 left-0 right-0 p-4 flex justify-center items-end">
      <div className="bg-black/40 rounded-lg p-2 backdrop-blur-sm">
        <div className="flex gap-2 items-end justify-center">
          {cards.map((card, index) => {
            const isPlayable = isPlayerTurn && card.cost <= playerMana;
            const isSelected = selectedCardId === card.id;
            
            return (
              <motion.div
                key={card.id}
                className={cn(
                  "relative bg-white rounded-lg shadow-lg h-32 w-24 cursor-pointer transition-all duration-200",
                  !isPlayable && "opacity-60 grayscale",
                  isSelected && "ring-2 ring-yellow-400"
                )}
                whileHover={isPlayable ? { y: -20, zIndex: 10 } : {}}
                animate={isSelected ? { y: -40, opacity: 0 } : {}}
                onClick={() => isPlayable && handleCardClick(card)}
              >
                <div className="flex flex-col h-full w-full p-1">
                  {/* Card Header with Name and Cost */}
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-semibold truncate max-w-[65%]">{card.name}</span>
                    <div className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                      {card.cost}
                    </div>
                  </div>
                  
                  {/* Card Type Indicator */}
                  <div className={cn(
                    "text-[9px] px-1 rounded mb-1 text-white text-center",
                    card.type === "attack" && "bg-red-500",
                    card.type === "defense" && "bg-blue-500",
                    card.type === "magic" && "bg-purple-500",
                    card.type === "creature" && "bg-green-500"
                  )}>
                    {card.type.toUpperCase()}
                  </div>
                  
                  {/* Card Image Placeholder */}
                  <div className={cn(
                    "flex-grow rounded-sm mb-1",
                    card.type === "attack" && "bg-red-100",
                    card.type === "defense" && "bg-blue-100",
                    card.type === "magic" && "bg-purple-100",
                    card.type === "creature" && "bg-green-100"
                  )}></div>
                  
                  {/* Card Stats */}
                  <div className="flex justify-between text-xs">
                    <div className="text-red-600 font-bold">{card.attack}</div>
                    <div className="text-blue-600 font-bold">{card.defense}</div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CardsHand;
