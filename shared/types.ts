// Game Types

export interface Card {
  id: number;
  name: string;
  type: "attack" | "defense" | "magic" | "creature";
  cost: number;
  attack: number;
  defense: number;
  description: string;
  effects?: { type: string; value: number }[];
}

export interface CardOnBoard {
  card: Card;
  position: { x: number; y: number; z: number };
  canAttack: boolean;
}

export interface Player {
  id: string;
  username: string;
  health: number;
  mana: number;
  deck: Card[];
  hand: Card[];
  board: CardOnBoard[];
}

export interface Game {
  id: string;
  hostId: string;
  hostUsername: string;
  state: "waiting" | "playing" | "ended";
  players: Player[];
  currentTurn: string;
  turnNumber: number;
  createdAt: string;
  winner: string | null;
}

export interface GameResult {
  success: boolean;
  message?: string;
}

// Client Message Types
export type ClientMessage =
  | { type: "set_username"; username: string }
  | { type: "create_game"; username: string }
  | { type: "join_game"; gameId: string; username: string }
  | { type: "leave_game"; gameId: string }
  | { type: "get_games" }
  | {
      type: "play_card";
      gameId: string;
      cardId: number;
      position: { x: number; y: number; z: number };
    }
  | { type: "draw_card"; gameId: string }
  | { type: "end_turn"; gameId: string }
  | {
      type: "attack";
      gameId: string;
      attackingCardId: number;
      targetCardId: number;
    }
  | { type: "attack_player"; gameId: string; attackingCardId: number }
  | { type: "game_move"; gameId: string; move: any };

// Server Message Types
export type ServerMessage =
  | { type: "connected"; clientId: string }
  | { type: "error"; message: string }
  | { type: "username_set"; username: string }
  | { type: "game_created"; gameId: string }
  | {
      type: "game_joined";
      gameId: string;
      opponent: { username: string };
      youAreHost: boolean;
    }
  | { type: "opponent_joined"; gameId: string; opponent: { username: string } }
  | { type: "game_left"; gameId: string }
  | { type: "opponent_left"; gameId: string }
  | {
      type: "games_list";
      games: Array<{ id: string; host: string; status: string }>;
    }
  | {
      type: "game_state";
      gameId: string;
      state: "waiting" | "playing" | "ended";
      currentTurn: "player" | "opponent";
      playerHealth: number;
      opponentHealth: number;
      playerMana: number;
      opponentMana: number;
      playerHand: Card[];
      playerDeck: number;
      opponentHand: number;
      opponentDeck: number;
      playerBoard: CardOnBoard[];
      opponentBoard: CardOnBoard[];
      turnNumber: number;
    }
  | {
      type: "game_ended";
      gameId: string;
      winner: "you" | "opponent";
    };
