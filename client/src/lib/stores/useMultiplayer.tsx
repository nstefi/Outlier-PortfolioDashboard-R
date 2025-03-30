import { create } from "zustand";
import { persist } from "zustand/middleware";
import { toast } from "sonner";
import { apiRequest } from "../queryClient";
import { getLocalStorage, setLocalStorage } from "../utils";

// Extend window interface for global game state handler
declare global {
  interface Window {
    updateGameState?: (gameState: any) => void;
  }
}

interface Game {
  id: string;
  host: string;
  status: "waiting" | "playing" | "ended";
}

interface MultiplayerState {
  username: string;
  isConnected: boolean;
  isConnecting: boolean;
  connectionError: string | null;
  
  // Game state
  opponentInfo: { username: string } | null;
  gameId: string | null;
  availableGames: Game[];
  
  // Actions
  setUsername: (username: string) => void;
  connect: () => Promise<void>;
  disconnect: () => void;
  createGame: () => Promise<void>;
  joinGame: (gameId: string) => Promise<void>;
  leaveGame: () => void;
  sendMove: (move: any) => void;
}

// Mock WebSocket for development - in production this would be a real WebSocket
const createMockWebSocket = () => {
  // Create a mock websocket object
  const ws = {
    send: (data: string) => {
      console.log("Sending data:", data);
      // Parse the message
      const message = JSON.parse(data);
      
      // Mock response based on message type
      if (message.type === "create_game") {
        setTimeout(() => {
          const mockGameId = "game_" + Math.random().toString(36).substring(2, 10);
          const mockResponse = {
            type: "game_created",
            gameId: mockGameId
          };
          mockMessageHandler(mockResponse);
        }, 500);
      } else if (message.type === "join_game") {
        setTimeout(() => {
          const mockResponse = {
            type: "game_joined",
            gameId: message.gameId,
            opponent: {
              username: "Opponent_" + Math.floor(Math.random() * 1000)
            }
          };
          mockMessageHandler(mockResponse);
        }, 500);
      } else if (message.type === "leave_game") {
        setTimeout(() => {
          const mockResponse = {
            type: "game_left"
          };
          mockMessageHandler(mockResponse);
        }, 200);
      }
    },
    close: () => {
      console.log("WebSocket closed");
    }
  };
  
  // Function to handle incoming mock messages
  const mockMessageHandler = (message: any) => {
    const event = { data: JSON.stringify(message) };
    if (onMessageCallback) {
      onMessageCallback(event);
    }
  };
  
  // Store the onmessage callback
  let onMessageCallback: ((event: any) => void) | null = null;
  
  // Define the onmessage setter
  Object.defineProperty(ws, 'onmessage', {
    set(callback) {
      onMessageCallback = callback;
    }
  });
  
  return ws as WebSocket;
};

// Mock available games
const mockGames: Game[] = [
  { id: "game_abc123", host: "Player213", status: "waiting" },
  { id: "game_def456", host: "CardMaster", status: "waiting" },
  { id: "game_ghi789", host: "LegendPlayer", status: "waiting" },
];

export const useMultiplayer = create<MultiplayerState>()(
  persist(
    (set, get) => {
      // Connection object
      let connection: WebSocket | null = null;
      
      return {
        username: getLocalStorage("username") || "Player" + Math.floor(Math.random() * 1000),
        isConnected: false,
        isConnecting: false,
        connectionError: null,
        
        // Game state
        opponentInfo: null,
        gameId: null,
        availableGames: [],
        
        // Actions
        setUsername: (username) => {
          set({ username });
          setLocalStorage("username", username);
        },
        
        connect: async () => {
          const { username } = get();
          
          if (!username) {
            toast.error("Please enter a username");
            return Promise.reject(new Error("No username provided"));
          }
          
          set({ isConnecting: true, connectionError: null });
          
          try {
            // Connect to our real WebSocket server
            // Determine the WebSocket URL based on the current environment
            let wsUrl: string;
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const hostname = window.location.hostname;
            
            if (hostname.includes('.replit.dev') || hostname.includes('.replit.app')) {
              // Replit environment - special handling for WebSocket
              wsUrl = `${protocol}//${hostname}/ws`;
            } else if (hostname === 'localhost' || hostname === '127.0.0.1') {
              // Local development
              wsUrl = `${protocol}//${hostname}:5000/ws`;
            } else {
              // Default fallback
              wsUrl = `${protocol}//${hostname}/ws`;
            }
            
            console.log(`Connecting to WebSocket at ${wsUrl}`);
            connection = new WebSocket(wsUrl);
            
            // Set up message handler
            connection.onmessage = (event) => {
              try {
                const message = JSON.parse(event.data);
                console.log("Received message:", message);
                
                // Handle different message types
                switch (message.type) {
                  case "game_created":
                    set({ gameId: message.gameId });
                    toast.success("Game created successfully");
                    break;
                    
                  case "game_joined":
                    set({
                      gameId: message.gameId,
                      opponentInfo: message.opponent
                    });
                    toast.success(`Joined game with ${message.opponent.username}`);
                    break;
                    
                  case "game_left":
                    set({
                      gameId: null,
                      opponentInfo: null
                    });
                    toast.info("Left the game");
                    break;
                    
                  case "game_state":
                    // Update the game state in useCardGame store
                    console.log("Received game state:", message);
                    // Pass the game state to useCardGame
                    if (window.updateGameState) {
                      window.updateGameState(message);
                    }
                    break;
                    
                  case "game_ended":
                    set({
                      gameId: null
                    });
                    toast.info(`Game ended: ${message.winner}`);
                    break;
                    
                  case "games_list":
                    set({
                      availableGames: message.games
                    });
                    console.log("Received games list:", message.games);
                    break;
                    
                  case "error":
                    toast.error(message.message);
                    console.error("Server error:", message.message);
                    break;
                    
                  case "connected":
                    console.log("Connected with clientId:", message.clientId);
                    // Request games list
                    if (connection) {
                      connection.send(JSON.stringify({
                        type: "get_games"
                      }));
                    }
                    break;
                }
              } catch (error) {
                console.error("Error handling message:", error);
              }
            };
            
            // Handle connection open event
            connection.onopen = () => {
              console.log("WebSocket connection established");
              set({ isConnected: true, isConnecting: false });
              toast.success("Connected to game server");
              
              // Send set_username message
              if (connection) {
                connection.send(JSON.stringify({
                  type: "set_username",
                  username: username
                }));
              }
            };
            
            // Handle connection errors
            connection.onerror = (error) => {
              console.error("WebSocket error:", error);
              set({
                isConnecting: false,
                isConnected: false,
                connectionError: "Connection error"
              });
              toast.error("WebSocket connection error");
            };
            
            // Handle connection close
            connection.onclose = () => {
              console.log("WebSocket connection closed");
              set({
                isConnected: false,
                isConnecting: false
              });
              toast.info("Disconnected from game server");
            };
            
            return Promise.resolve();
          } catch (error) {
            set({
              isConnecting: false,
              isConnected: false,
              connectionError: (error as Error).message
            });
            toast.error("Failed to connect: " + (error as Error).message);
            return Promise.reject(error);
          }
        },
        
        disconnect: () => {
          if (connection) {
            connection.close();
            connection = null;
          }
          
          set({
            isConnected: false,
            isConnecting: false,
            gameId: null,
            opponentInfo: null
          });
          
          toast.info("Disconnected from game server");
        },
        
        createGame: async () => {
          const { isConnected, username } = get();
          
          if (!isConnected) {
            await get().connect();
          }
          
          if (!connection) {
            toast.error("Not connected to server");
            return Promise.reject(new Error("Not connected"));
          }
          
          try {
            connection.send(JSON.stringify({
              type: "create_game",
              username
            }));
            
            // Return a promise that resolves when the game is created
            // This would normally wait for the server response, but for mock purposes
            // we'll just wait a short time
            return new Promise((resolve) => {
              setTimeout(resolve, 1000);
            });
          } catch (error) {
            toast.error("Failed to create game: " + (error as Error).message);
            return Promise.reject(error);
          }
        },
        
        joinGame: async (gameId) => {
          const { isConnected, username } = get();
          
          if (!isConnected) {
            await get().connect();
          }
          
          if (!connection) {
            toast.error("Not connected to server");
            return Promise.reject(new Error("Not connected"));
          }
          
          try {
            connection.send(JSON.stringify({
              type: "join_game",
              gameId,
              username
            }));
            
            // Return a promise that resolves when the game is joined
            return new Promise((resolve) => {
              setTimeout(resolve, 1000);
            });
          } catch (error) {
            toast.error("Failed to join game: " + (error as Error).message);
            return Promise.reject(error);
          }
        },
        
        leaveGame: () => {
          const { gameId } = get();
          
          if (!connection || !gameId) {
            return;
          }
          
          try {
            connection.send(JSON.stringify({
              type: "leave_game",
              gameId
            }));
          } catch (error) {
            console.error("Error leaving game:", error);
          }
        },
        
        sendMove: (move) => {
          const { gameId } = get();
          
          if (!connection || !gameId) {
            return;
          }
          
          try {
            connection.send(JSON.stringify({
              type: "game_move",
              gameId,
              move
            }));
          } catch (error) {
            console.error("Error sending move:", error);
          }
        }
      };
    },
    {
      name: "multiplayer-storage",
      partialize: (state) => ({
        username: state.username
      })
    }
  )
);
