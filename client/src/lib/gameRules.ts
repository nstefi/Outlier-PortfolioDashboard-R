// Game Constants
export const INITIAL_HAND_SIZE = 3;
export const MAX_HAND_SIZE = 7;
export const MAX_BOARD_SIZE = 7;
export const INITIAL_HEALTH = 30;
export const MAX_MANA = 10;

// Helper Functions
export const canPlayCard = (cardCost: number, currentMana: number): boolean => {
  return cardCost <= currentMana;
};

export const calculateDamage = (
  attackValue: number,
  defenseValue: number,
  isMagical: boolean = false
): number => {
  // For magical attacks, defense is less effective
  const effectiveDefense = isMagical ? Math.floor(defenseValue * 0.75) : defenseValue;
  
  // Damage is at least 1
  return Math.max(1, attackValue - effectiveDefense);
};

export const calculateManaCurve = (
  deckCards: Array<{ cost: number }>
): Record<number, number> => {
  const manaCurve: Record<number, number> = {};
  
  // Initialize counts for mana 0-7+
  for (let i = 0; i <= 7; i++) {
    manaCurve[i] = 0;
  }
  
  // Count cards by mana cost
  deckCards.forEach(card => {
    const cost = card.cost;
    const index = cost >= 7 ? 7 : cost;
    manaCurve[index]++;
  });
  
  return manaCurve;
};

export const isDeckValid = (
  deckCards: Array<{ id: number }>
): { valid: boolean; reason?: string } => {
  // Check minimum deck size
  if (deckCards.length < 20) {
    return { valid: false, reason: "Deck must contain at least 20 cards" };
  }
  
  // Check for maximum deck size
  if (deckCards.length > 30) {
    return { valid: false, reason: "Deck cannot contain more than 30 cards" };
  }
  
  // Check card limits (maximum 3 copies of each card)
  const cardCounts: Record<number, number> = {};
  
  for (const card of deckCards) {
    cardCounts[card.id] = (cardCounts[card.id] || 0) + 1;
    
    if (cardCounts[card.id] > 3) {
      return { 
        valid: false, 
        reason: "You can only have a maximum of 3 copies of any card" 
      };
    }
  }
  
  return { valid: true };
};

// Game Turn Phases
export enum TurnPhase {
  DRAW = "draw",
  MAIN = "main",
  COMBAT = "combat",
  END = "end"
}

// Game Events
export enum GameEvent {
  CARD_PLAYED = "card_played",
  CARD_DESTROYED = "card_destroyed",
  ATTACK = "attack",
  HEALTH_CHANGED = "health_changed",
  MANA_CHANGED = "mana_changed",
  TURN_CHANGED = "turn_changed",
  GAME_OVER = "game_over"
}
