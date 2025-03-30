import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useCardGame } from "@/lib/stores/useCardGame";
import { useMultiplayer } from "@/lib/stores/useMultiplayer";
import { useAudio } from "@/lib/stores/useAudio";

const Lobby = () => {
  const navigate = useNavigate();
  const { playerDecks, activeDeckId, setActiveDeck } = useCardGame();
  const { 
    username, 
    setUsername, 
    connect, 
    disconnect, 
    createGame, 
    joinGame, 
    isConnected,
    availableGames
  } = useMultiplayer();
  
  const [isJoining, setIsJoining] = useState(false);
  const [gameIdToJoin, setGameIdToJoin] = useState("");
  const { toggleMute, isMuted } = useAudio();
  
  // Check if we have any decks
  useEffect(() => {
    if (playerDecks.length === 0) {
      toast.info("You don't have any decks yet. Create one to play!", {
        duration: 5000,
        action: {
          label: "Create Deck",
          onClick: () => navigate("/deck-builder")
        }
      });
    }
  }, [playerDecks, navigate]);
  
  const handleCreateGame = () => {
    if (!activeDeckId) {
      toast.error("Please select a deck first");
      return;
    }
    
    createGame().then(() => {
      navigate("/game");
    }).catch(error => {
      toast.error(`Failed to create game: ${error.message}`);
    });
  };
  
  const handleJoinGame = () => {
    if (!activeDeckId) {
      toast.error("Please select a deck first");
      return;
    }
    
    joinGame(gameIdToJoin).then(() => {
      navigate("/game");
    }).catch(error => {
      toast.error(`Failed to join game: ${error.message}`);
    });
  };
  
  return (
    <div className="w-full h-full flex flex-col bg-gray-900 text-white">
      <div className="p-4 bg-gray-800 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Game Lobby</h1>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={toggleMute}>
            {isMuted ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path></svg>
            )}
          </Button>
          <Button variant="outline" onClick={() => navigate("/")}>
            Main Menu
          </Button>
        </div>
      </div>
      
      <div className="flex flex-1 p-4 gap-4 overflow-hidden">
        <div className="w-1/3 flex flex-col gap-4">
          {/* User Info */}
          <Card>
            <CardHeader>
              <CardTitle>Your Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-lg font-bold">
                  {username ? username.charAt(0).toUpperCase() : "?"}
                </div>
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  maxLength={15}
                />
              </div>
              
              <div className="flex justify-between">
                <div>
                  <div className="text-sm text-gray-400">Status</div>
                  <div className="flex items-center">
                    <div className={`w-2 h-2 rounded-full mr-2 ${isConnected ? "bg-green-500" : "bg-red-500"}`}></div>
                    {isConnected ? "Connected" : "Disconnected"}
                  </div>
                </div>
                
                <Button
                  variant={isConnected ? "destructive" : "default"}
                  onClick={() => isConnected ? disconnect() : connect()}
                >
                  {isConnected ? "Disconnect" : "Connect"}
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {/* Active Deck Selector */}
          <Card>
            <CardHeader>
              <CardTitle>Active Deck</CardTitle>
              <CardDescription>Select a deck to play with</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-48">
                {playerDecks.length > 0 ? (
                  <div className="space-y-2">
                    {playerDecks.map(deck => (
                      <div
                        key={deck.id}
                        className={`p-2 rounded flex justify-between items-center cursor-pointer hover:bg-gray-700 ${activeDeckId === deck.id ? "bg-primary text-primary-foreground" : "bg-gray-800"}`}
                        onClick={() => setActiveDeck(deck.id)}
                      >
                        <div>
                          <div className="font-medium">{deck.name}</div>
                          <div className="text-xs">{deck.cards.length} cards</div>
                        </div>
                        {activeDeckId === deck.id && (
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full">
                    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-2 text-gray-400"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
                    <p className="text-center text-gray-400">No decks available</p>
                    <Button 
                      variant="outline" 
                      className="mt-2"
                      onClick={() => navigate("/deck-builder")}
                    >
                      Create Deck
                    </Button>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button 
                variant="outline" 
                onClick={() => navigate("/deck-builder")}
              >
                Create New Deck
              </Button>
              <Button 
                variant="outline" 
                onClick={() => navigate("/card-library")}
              >
                View Card Library
              </Button>
            </CardFooter>
          </Card>
        </div>
        
        <div className="w-2/3">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Games</CardTitle>
            </CardHeader>
            <CardContent className="flex-1">
              <Tabs defaultValue="join">
                <TabsList className="w-full mb-4">
                  <TabsTrigger value="join" className="flex-1">Join Game</TabsTrigger>
                  <TabsTrigger value="create" className="flex-1">Create Game</TabsTrigger>
                </TabsList>
                
                <TabsContent value="join" className="h-[calc(100%-48px)]">
                  {isJoining ? (
                    <div className="flex flex-col h-full">
                      <div className="mb-4">
                        <label className="block text-sm mb-1">Game ID</label>
                        <div className="flex">
                          <Input
                            value={gameIdToJoin}
                            onChange={(e) => setGameIdToJoin(e.target.value)}
                            placeholder="Enter game ID"
                            className="flex-1 mr-2"
                          />
                          <Button 
                            onClick={handleJoinGame}
                            disabled={!gameIdToJoin || !isConnected || !activeDeckId}
                          >
                            Join
                          </Button>
                        </div>
                      </div>
                      
                      <Button 
                        variant="outline" 
                        className="mb-4"
                        onClick={() => setIsJoining(false)}
                      >
                        Back to Game List
                      </Button>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col">
                      <ScrollArea className="flex-1 mb-4">
                        {availableGames.length > 0 ? (
                          <div className="grid grid-cols-2 gap-4">
                            {availableGames.map(game => (
                              <motion.div
                                key={game.id}
                                whileHover={{ scale: 1.02 }}
                                className="bg-gray-800 rounded-lg p-4 cursor-pointer"
                                onClick={() => {
                                  setGameIdToJoin(game.id);
                                  setIsJoining(true);
                                }}
                              >
                                <div className="font-medium mb-1">Game #{game.id.substring(0, 8)}</div>
                                <div className="text-sm text-gray-400 mb-2">Host: {game.host}</div>
                                <div className="flex justify-between text-xs">
                                  <span>1/2 Players</span>
                                  <span>Waiting...</span>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center h-full">
                            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-2 text-gray-400"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                            <p className="text-center text-gray-400">No games available</p>
                            <p className="text-center text-sm text-gray-500 mt-1">Create a new game or try again later</p>
                          </div>
                        )}
                      </ScrollArea>
                      
                      <div className="flex justify-between">
                        <Button 
                          variant="outline" 
                          onClick={() => setIsJoining(true)}
                        >
                          Join with Game ID
                        </Button>
                        <Button 
                          onClick={() => {
                            // Refresh the list
                          }}
                        >
                          Refresh List
                        </Button>
                      </div>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="create" className="h-[calc(100%-48px)]">
                  <div className="flex flex-col items-center justify-center h-full">
                    <div className="bg-gray-800 p-6 rounded-lg max-w-md w-full">
                      <h3 className="text-xl font-semibold mb-4 text-center">Create New Game</h3>
                      <p className="text-gray-400 text-center mb-6">
                        You'll create a new game and get a game ID that others can use to join.
                      </p>
                      
                      <div className="mb-6">
                        <div className="flex items-center justify-between mb-2">
                          <span>Selected Deck:</span>
                          <span className="font-medium">
                            {activeDeckId 
                              ? playerDecks.find(d => d.id === activeDeckId)?.name || "Unknown Deck"
                              : "No deck selected"}
                          </span>
                        </div>
                        
                        {!activeDeckId && (
                          <p className="text-red-400 text-sm">Please select a deck to play with</p>
                        )}
                      </div>
                      
                      <Button 
                        className="w-full" 
                        onClick={handleCreateGame}
                        disabled={!isConnected || !activeDeckId}
                      >
                        Create Game
                      </Button>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Lobby;
