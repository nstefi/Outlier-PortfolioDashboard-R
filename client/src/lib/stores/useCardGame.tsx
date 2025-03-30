import { create } from "zustand";
import { persist } from "zustand/middleware";
import { allCards } from "../cardData";
import { toast } from "sonner";

export type CardType = "attack" | "defense" | "magic" | "creature";

export interface Card {
  id: number;
  name: string;
  type: CardType;
  cost: number;
  attack: number;
  defense: number;
  description: string;
  effects?: { type: string; value: number }[];
}

export interface Deck {
  id: number;
  name: string;
  cards: Card[];
}

export type GameState = "loading" | "playing" | "ended";

interface CardGameState {
  // Collections
  allCards: Card[];
  playerDecks: Deck[];
  activeDeckId: number | null;
  
  // Game state
  gameState: GameState;
  playerHand: Card[];
  opponentHand: Card[];
  playerDeck: Card[];
  opponentDeck: Card[];
  playerHealth: number;
  opponentHealth: number;
  playerMana: number;
  opponentMana: number;
  currentTurn: "player" | "opponent";
  turnNumber: number;
  boardCards: {
    player: { card: Card; position: { x: number, y: number, z: number } }[];
    opponent: { card: Card; position: { x: number, y: number, z: number } }[];
  };
  
  // Actions
  setActiveDeck: (deckId: number) => void;
  saveDeck: (deck: Deck) => void;
  initializeGame: () => void;
  drawCard: (player?: "player" | "opponent") => void;
  playCard: (cardId: number, position: { x: number, y: number, z: number }) => void;
  endTurn: () => void;
  attackWithCard: (attackingCardId: number, targetCardId: number) => void;
  attackPlayer: (attackingCardId: number) => void;
}

export const useCardGame = create<CardGameState>()(
  persist(
    (set, get) => ({
      // Collections
      allCards: allCards,
      playerDecks: [],
      activeDeckId: null,
      
      // Game state
      gameState: "loading",
      playerHand: [],
      opponentHand: [],
      playerDeck: [],
      opponentDeck: [],
      playerHealth: 30,
      opponentHealth: 30,
      playerMana: 0,
      opponentMana: 0,
      currentTurn: "player",
      turnNumber: 0,
      boardCards: {
        player: [],
        opponent: []
      },
      
      // Actions
      setActiveDeck: (deckId) => {
        if (get().playerDecks.find(deck => deck.id === deckId)) {
          set({ activeDeckId: deckId });
        }
      },
      
      saveDeck: (deck) => {
        set((state) => {
          // Check if we're updating an existing deck
          const existingDeckIndex = state.playerDecks.findIndex(d => d.id === deck.id);
          
          if (existingDeckIndex !== -1) {
            const updatedDecks = [...state.playerDecks];
            updatedDecks[existingDeckIndex] = deck;
            return { playerDecks: updatedDecks };
          } else {
            return { playerDecks: [...state.playerDecks, deck] };
          }
        });
      },
      
      initializeGame: () => {
        const { activeDeckId, playerDecks, allCards } = get();
        
        // Get the active deck or use a default one
        const activeDeck = activeDeckId 
          ? playerDecks.find(deck => deck.id === activeDeckId)
          : null;
        
        // Create a copy of the deck cards for this game
        const playerDeckCards = activeDeck 
          ? [...activeDeck.cards] 
          : [...allCards].filter(card => card.id < 30).slice(0, 30);
        
        // Create a random opponent deck
        const opponentDeckCards = [...allCards]
          .sort(() => Math.random() - 0.5)
          .slice(0, 30);
        
        // Shuffle both decks
        const shuffledPlayerDeck = playerDeckCards.sort(() => Math.random() - 0.5);
        const shuffledOpponentDeck = opponentDeckCards.sort(() => Math.random() - 0.5);
        
        // Initialize game state
        set({
          gameState: "playing",
          playerHand: [],
          opponentHand: [],
          playerDeck: shuffledPlayerDeck,
          opponentDeck: shuffledOpponentDeck,
          playerHealth: 30,
          opponentHealth: 30,
          playerMana: 1,
          opponentMana: 1,
          currentTurn: "player",
          turnNumber: 1,
          boardCards: {
            player: [],
            opponent: []
          }
        });
        
        // Draw initial hands (3 cards each)
        for (let i = 0; i < 3; i++) {
          get().drawCard("player");
          get().drawCard("opponent");
        }
      },
      
      drawCard: (player = "player") => {
        set((state) => {
          if (player === "player") {
            if (state.playerDeck.length === 0) {
              // Player loses if they can't draw a card
              toast.error("You have no cards left to draw!");
              return { playerHealth: 0, gameState: "ended" };
            }
            
            // Draw a card from the player's deck
            const [drawnCard, ...remainingDeck] = state.playerDeck;
            return {
              playerHand: [...state.playerHand, drawnCard],
              playerDeck: remainingDeck
            };
          } else {
            if (state.opponentDeck.length === 0) {
              // Opponent loses if they can't draw a card
              toast.success("Opponent has no cards left to draw!");
              return { opponentHealth: 0, gameState: "ended" };
            }
            
            // Draw a card from the opponent's deck
            const [drawnCard, ...remainingDeck] = state.opponentDeck;
            return {
              opponentHand: [...state.opponentHand, drawnCard],
              opponentDeck: remainingDeck
            };
          }
        });
      },
      
      playCard: (cardId, position) => {
        set((state) => {
          // Find the card in the player's hand
          const cardIndex = state.playerHand.findIndex(card => card.id === cardId);
          
          if (cardIndex === -1) return {}; // Card not found
          
          const cardToPlay = state.playerHand[cardIndex];
          
          // Check if player has enough mana
          if (cardToPlay.cost > state.playerMana) {
            toast.error("Not enough mana to play this card");
            return {};
          }
          
          // Remove the card from hand and add to board
          const newHand = [...state.playerHand];
          newHand.splice(cardIndex, 1);
          
          const newBoardCards = {
            ...state.boardCards,
            player: [
              ...state.boardCards.player,
              { card: cardToPlay, position }
            ]
          };
          
          // Deduct the mana cost
          const newMana = state.playerMana - cardToPlay.cost;
          
          return {
            playerHand: newHand,
            boardCards: newBoardCards,
            playerMana: newMana
          };
        });
      },
      
      endTurn: () => {
        set((state) => {
          // If the game is over, do nothing
          if (state.gameState === "ended") return {};
          
          // If it's the player's turn, switch to opponent's turn
          if (state.currentTurn === "player") {
            // Simulate opponent's turn
            setTimeout(() => {
              // Draw a card for the opponent
              get().drawCard("opponent");
              
              // Increment opponent's mana (max 10)
              set(state => ({
                opponentMana: Math.min(state.turnNumber + 1, 10)
              }));
              
              // Simple AI: Play a random card if possible
              const { opponentHand, opponentMana } = get();
              const playableCards = opponentHand.filter(card => card.cost <= opponentMana);
              
              if (playableCards.length > 0) {
                // Play a random card
                const cardToPlay = playableCards[Math.floor(Math.random() * playableCards.length)];
                const cardIndex = opponentHand.findIndex(card => card.id === cardToPlay.id);
                
                // Remove card from hand and add to board
                const newHand = [...opponentHand];
                newHand.splice(cardIndex, 1);
                
                const position = {
                  x: Math.random() * 3 - 1.5,
                  y: 0.02,
                  z: -2 + Math.random() * 1 - 0.5
                };
                
                set(state => ({
                  opponentHand: newHand,
                  opponentMana: state.opponentMana - cardToPlay.cost,
                  boardCards: {
                    ...state.boardCards,
                    opponent: [
                      ...state.boardCards.opponent,
                      { card: cardToPlay, position }
                    ]
                  }
                }));
              }
              
              // End opponent's turn
              setTimeout(() => {
                set(state => ({
                  currentTurn: "player",
                  turnNumber: state.turnNumber + 1,
                  playerMana: Math.min(state.turnNumber + 1, 10)
                }));
                
                // Draw a card for the player
                get().drawCard("player");
              }, 1000);
            }, 1000);
            
            return { currentTurn: "opponent" };
          }
          
          return {};
        });
      },
      
      attackWithCard: (attackingCardId, targetCardId) => {
        set((state) => {
          // Find the attacking card on the player's board
          const attackingCardIndex = state.boardCards.player.findIndex(
            item => item.card.id === attackingCardId
          );
          
          if (attackingCardIndex === -1) return {}; // Card not found
          
          // Find the target card on the opponent's board
          const targetCardIndex = state.boardCards.opponent.findIndex(
            item => item.card.id === targetCardId
          );
          
          if (targetCardIndex === -1) return {}; // Target not found
          
          const attackingCard = state.boardCards.player[attackingCardIndex].card;
          const targetCard = state.boardCards.opponent[targetCardIndex].card;
          
          // Calculate damage
          const newTargetDefense = targetCard.defense - attackingCard.attack;
          const newAttackerDefense = attackingCard.defense - targetCard.attack;
          
          // Update the cards
          const newOpponentBoard = [...state.boardCards.opponent];
          const newPlayerBoard = [...state.boardCards.player];
          
          // Remove destroyed cards
          if (newTargetDefense <= 0) {
            newOpponentBoard.splice(targetCardIndex, 1);
          } else {
            newOpponentBoard[targetCardIndex] = {
              ...newOpponentBoard[targetCardIndex],
              card: {
                ...targetCard,
                defense: newTargetDefense
              }
            };
          }
          
          if (newAttackerDefense <= 0) {
            newPlayerBoard.splice(attackingCardIndex, 1);
          } else {
            newPlayerBoard[attackingCardIndex] = {
              ...newPlayerBoard[attackingCardIndex],
              card: {
                ...attackingCard,
                defense: newAttackerDefense
              }
            };
          }
          
          return {
            boardCards: {
              player: newPlayerBoard,
              opponent: newOpponentBoard
            }
          };
        });
      },
      
      attackPlayer: (attackingCardId) => {
        set((state) => {
          // Find the attacking card on the player's board
          const attackingCardIndex = state.boardCards.player.findIndex(
            item => item.card.id === attackingCardId
          );
          
          if (attackingCardIndex === -1) return {}; // Card not found
          
          const attackingCard = state.boardCards.player[attackingCardIndex].card;
          
          // Deal damage to opponent
          const newOpponentHealth = state.opponentHealth - attackingCard.attack;
          
          // Check if the game is over
          const gameState = newOpponentHealth <= 0 ? "ended" : state.gameState;
          
          return {
            opponentHealth: newOpponentHealth,
            gameState
          };
        });
      }
    }),
    {
      name: "card-game-storage",
      partialize: (state) => ({
        playerDecks: state.playerDecks,
        activeDeckId: state.activeDeckId
      })
    }
  )
);
