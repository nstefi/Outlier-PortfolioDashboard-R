import { v4 as uuidv4 } from "uuid";
import { Card, GameState, Player, Game, CardOnBoard, GameResult } from "../../shared/types";
import { allCards } from "../../client/src/lib/cardData";

export class GameService {
  private games: Map<string, Game> = new Map();
  private playerToGames: Map<string, Set<string>> = new Map();

  constructor() {
    console.log("Game service initialized");
  }

  /**
   * Create a new game with the host player
   */
  createGame(hostId: string, hostUsername: string): string {
    const gameId = uuidv4();
    
    const game: Game = {
      id: gameId,
      hostId,
      hostUsername,
      state: "waiting",
      players: [{
        id: hostId,
        username: hostUsername,
        health: 30,
        mana: 0,
        deck: [],
        hand: [],
        board: []
      }],
      currentTurn: "",
      turnNumber: 0,
      createdAt: new Date().toISOString(),
      winner: null
    };
    
    this.games.set(gameId, game);
    
    // Associate player with this game
    if (!this.playerToGames.has(hostId)) {
      this.playerToGames.set(hostId, new Set());
    }
    this.playerToGames.get(hostId)?.add(gameId);
    
    return gameId;
  }

  /**
   * Get all available games that are waiting for players
   */
  getAvailableGames(): Array<{ id: string; host: string; status: string }> {
    const availableGames: Array<{ id: string; host: string; status: string }> = [];
    
    this.games.forEach((game, id) => {
      if (game.state === "waiting") {
        availableGames.push({
          id,
          host: game.hostUsername,
          status: game.state
        });
      }
    });
    
    return availableGames;
  }

  /**
   * Get games a player is part of
   */
  getGamesForPlayer(playerId: string): string[] {
    return Array.from(this.playerToGames.get(playerId) || []);
  }

  /**
   * Get a specific game by ID
   */
  getGame(gameId: string): Game | undefined {
    return this.games.get(gameId);
  }

  /**
   * Join an existing game
   */
  joinGame(gameId: string, playerId: string, username: string): GameResult {
    const game = this.games.get(gameId);
    
    if (!game) {
      return { success: false, message: "Game not found" };
    }
    
    if (game.state !== "waiting") {
      return { success: false, message: "Game is not available to join" };
    }
    
    if (game.players.length >= 2) {
      return { success: false, message: "Game is already full" };
    }
    
    if (game.players.some(p => p.id === playerId)) {
      return { success: false, message: "You are already in this game" };
    }
    
    // Add player to the game
    game.players.push({
      id: playerId,
      username,
      health: 30,
      mana: 0,
      deck: [],
      hand: [],
      board: []
    });
    
    // Associate player with this game
    if (!this.playerToGames.has(playerId)) {
      this.playerToGames.set(playerId, new Set());
    }
    this.playerToGames.get(playerId)?.add(gameId);
    
    return { success: true };
  }

  /**
   * Start a game when all players have joined
   */
  startGame(gameId: string): GameResult {
    const game = this.games.get(gameId);
    
    if (!game) {
      return { success: false, message: "Game not found" };
    }
    
    if (game.players.length < 2) {
      return { success: false, message: "Not enough players" };
    }
    
    if (game.state !== "waiting") {
      return { success: false, message: "Game already started" };
    }
    
    // Initialize game state
    game.state = "playing";
    game.turnNumber = 1;
    
    // Randomly decide who goes first
    const firstPlayerIndex = Math.floor(Math.random() * 2);
    game.currentTurn = game.players[firstPlayerIndex].id;
    
    // Initialize decks for both players
    game.players.forEach(player => {
      // Shuffle cards and create decks
      player.deck = [...allCards]
        .sort(() => Math.random() - 0.5)
        .slice(0, 30);
      
      // Set initial mana
      player.mana = 1;
      
      // Draw initial hand (3 cards)
      for (let i = 0; i < 3; i++) {
        this._drawCardForPlayer(game, player);
      }
    });
    
    return { success: true };
  }

  /**
   * Process a player leaving a game
   */
  leaveGame(gameId: string, playerId: string): GameResult & { opponentId?: string } {
    const game = this.games.get(gameId);
    
    if (!game) {
      return { success: false, message: "Game not found" };
    }
    
    const playerIndex = game.players.findIndex(p => p.id === playerId);
    if (playerIndex === -1) {
      return { success: false, message: "Player not in this game" };
    }
    
    // If there's an opponent, they win by forfeit
    let opponentId: string | undefined;
    if (game.state === "playing" && game.players.length > 1) {
      opponentId = game.players.find(p => p.id !== playerId)?.id;
      if (opponentId) {
        game.state = "ended";
        game.winner = opponentId;
      }
    }
    
    // Remove the game if it's just waiting or the host left while waiting
    if (game.state === "waiting" || (game.hostId === playerId && game.state === "waiting")) {
      this.games.delete(gameId);
    } else {
      // Remove player from the game
      game.players = game.players.filter(p => p.id !== playerId);
      
      // If no players left, remove the game
      if (game.players.length === 0) {
        this.games.delete(gameId);
      }
    }
    
    // Remove game from player's game list
    this.playerToGames.get(playerId)?.delete(gameId);
    
    return { success: true, opponentId };
  }

  /**
   * End the current player's turn
   */
  endTurn(gameId: string, playerId: string): GameResult {
    const game = this.games.get(gameId);
    
    if (!game) {
      return { success: false, message: "Game not found" };
    }
    
    if (game.state !== "playing") {
      return { success: false, message: "Game is not in progress" };
    }
    
    if (game.currentTurn !== playerId) {
      return { success: false, message: "Not your turn" };
    }
    
    // Switch to the other player's turn
    const nextPlayer = game.players.find(p => p.id !== playerId);
    if (!nextPlayer) {
      return { success: false, message: "Opponent not found" };
    }
    
    game.currentTurn = nextPlayer.id;
    game.turnNumber += 1;
    
    // Increment next player's mana (max 10)
    nextPlayer.mana = Math.min(game.turnNumber, 10);
    
    // Draw a card for the next player
    this._drawCardForPlayer(game, nextPlayer);
    
    return { success: true };
  }

  /**
   * Play a card from hand to board
   */
  playCard(
    gameId: string, 
    playerId: string, 
    cardId: number, 
    position: { x: number; y: number; z: number }
  ): GameResult {
    const game = this.games.get(gameId);
    
    if (!game) {
      return { success: false, message: "Game not found" };
    }
    
    if (game.state !== "playing") {
      return { success: false, message: "Game is not in progress" };
    }
    
    if (game.currentTurn !== playerId) {
      return { success: false, message: "Not your turn" };
    }
    
    const player = game.players.find(p => p.id === playerId);
    if (!player) {
      return { success: false, message: "Player not found" };
    }
    
    // Find the card in player's hand
    const cardIndex = player.hand.findIndex(card => card.id === cardId);
    if (cardIndex === -1) {
      return { success: false, message: "Card not in hand" };
    }
    
    const card = player.hand[cardIndex];
    
    // Check if player has enough mana
    if (card.cost > player.mana) {
      return { success: false, message: "Not enough mana" };
    }
    
    // Check if board is full (max 7 cards)
    if (player.board.length >= 7) {
      return { success: false, message: "Board is full" };
    }
    
    // Remove card from hand
    player.hand.splice(cardIndex, 1);
    
    // Add card to board
    const boardCard: CardOnBoard = {
      card,
      position,
      canAttack: false, // Can't attack on the turn it's played
    };
    player.board.push(boardCard);
    
    // Deduct mana cost
    player.mana -= card.cost;
    
    return { success: true };
  }

  /**
   * Draw a card from deck to hand
   */
  drawCard(gameId: string, playerId: string): GameResult {
    const game = this.games.get(gameId);
    
    if (!game) {
      return { success: false, message: "Game not found" };
    }
    
    if (game.state !== "playing") {
      return { success: false, message: "Game is not in progress" };
    }
    
    if (game.currentTurn !== playerId) {
      return { success: false, message: "Not your turn" };
    }
    
    const player = game.players.find(p => p.id === playerId);
    if (!player) {
      return { success: false, message: "Player not found" };
    }
    
    // Check if hand is full (max 10 cards)
    if (player.hand.length >= 10) {
      return { success: false, message: "Hand is full" };
    }
    
    // Draw a card
    const success = this._drawCardForPlayer(game, player);
    if (!success) {
      return { success: false, message: "No cards left in deck" };
    }
    
    return { success: true };
  }

  /**
   * Attack an opponent's card
   */
  attackCard(
    gameId: string,
    playerId: string,
    attackingCardId: number,
    targetCardId: number
  ): GameResult {
    const game = this.games.get(gameId);
    
    if (!game) {
      return { success: false, message: "Game not found" };
    }
    
    if (game.state !== "playing") {
      return { success: false, message: "Game is not in progress" };
    }
    
    if (game.currentTurn !== playerId) {
      return { success: false, message: "Not your turn" };
    }
    
    const attacker = game.players.find(p => p.id === playerId);
    if (!attacker) {
      return { success: false, message: "Player not found" };
    }
    
    const defender = game.players.find(p => p.id !== playerId);
    if (!defender) {
      return { success: false, message: "Opponent not found" };
    }
    
    // Find the attacking card
    const attackingCardIndex = attacker.board.findIndex(
      item => item.card.id === attackingCardId
    );
    if (attackingCardIndex === -1) {
      return { success: false, message: "Attacking card not found" };
    }
    
    // Find the target card
    const targetCardIndex = defender.board.findIndex(
      item => item.card.id === targetCardId
    );
    if (targetCardIndex === -1) {
      return { success: false, message: "Target card not found" };
    }
    
    const attackingCard = attacker.board[attackingCardIndex];
    const targetCard = defender.board[targetCardIndex];
    
    // Check if card can attack
    if (!attackingCard.canAttack) {
      return { success: false, message: "Card cannot attack yet" };
    }
    
    // Calculate damage and update stats
    targetCard.card.defense -= attackingCard.card.attack;
    attackingCard.card.defense -= targetCard.card.attack;
    
    // Remove destroyed cards
    if (targetCard.card.defense <= 0) {
      defender.board.splice(targetCardIndex, 1);
    }
    
    if (attackingCard.card.defense <= 0) {
      attacker.board.splice(attackingCardIndex, 1);
    } else {
      // Card has attacked, can't attack again this turn
      attackingCard.canAttack = false;
    }
    
    return { success: true };
  }

  /**
   * Attack the opponent player directly
   */
  attackPlayer(
    gameId: string,
    playerId: string,
    attackingCardId: number
  ): GameResult {
    const game = this.games.get(gameId);
    
    if (!game) {
      return { success: false, message: "Game not found" };
    }
    
    if (game.state !== "playing") {
      return { success: false, message: "Game is not in progress" };
    }
    
    if (game.currentTurn !== playerId) {
      return { success: false, message: "Not your turn" };
    }
    
    const attacker = game.players.find(p => p.id === playerId);
    if (!attacker) {
      return { success: false, message: "Player not found" };
    }
    
    const defender = game.players.find(p => p.id !== playerId);
    if (!defender) {
      return { success: false, message: "Opponent not found" };
    }
    
    // Find the attacking card
    const attackingCardIndex = attacker.board.findIndex(
      item => item.card.id === attackingCardId
    );
    if (attackingCardIndex === -1) {
      return { success: false, message: "Attacking card not found" };
    }
    
    const attackingCard = attacker.board[attackingCardIndex];
    
    // Check if card can attack
    if (!attackingCard.canAttack) {
      return { success: false, message: "Card cannot attack yet" };
    }
    
    // Deal damage to opponent
    defender.health -= attackingCard.card.attack;
    
    // Card has attacked, can't attack again this turn
    attackingCard.canAttack = false;
    
    // Check if game is over
    if (defender.health <= 0) {
      game.state = "ended";
      game.winner = playerId;
    }
    
    return { success: true };
  }

  /**
   * Process a generic game move
   */
  processMove(gameId: string, playerId: string, move: any): GameResult {
    // Generic move processing logic
    return { success: true };
  }

  /**
   * Helper function to draw a card for a player
   */
  private _drawCardForPlayer(game: Game, player: Player): boolean {
    if (player.deck.length === 0) {
      // Player loses health if they can't draw
      player.health -= 1;
      
      // Check if the player is defeated
      if (player.health <= 0) {
        game.state = "ended";
        game.winner = game.players.find(p => p.id !== player.id)?.id || null;
      }
      
      return false;
    }
    
    // Draw a card from the deck
    const drawnCard = player.deck.shift();
    if (drawnCard) {
      player.hand.push(drawnCard);
    }
    
    return true;
  }
}
