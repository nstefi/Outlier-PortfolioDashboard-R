import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useAudio } from "@/lib/stores/useAudio";

const MainMenu = () => {
  const navigate = useNavigate();
  const { toggleMute, isMuted, backgroundMusic } = useAudio();
  
  useEffect(() => {
    // Start background music when entering the main menu
    if (backgroundMusic) {
      backgroundMusic.currentTime = 0;
      backgroundMusic.play().catch(err => {
        console.log("Audio autoplay was prevented:", err);
      });
    }
    
    // Clean up on unmount
    return () => {
      if (backgroundMusic) {
        backgroundMusic.pause();
      }
    };
  }, [backgroundMusic]);
  
  return (
    <div className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden bg-gradient-to-b from-gray-900 to-blue-900">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-16 h-24 bg-blue-500/10 rounded-lg"
            initial={{ 
              x: Math.random() * window.innerWidth, 
              y: -100, 
              rotate: Math.random() * 180 
            }}
            animate={{ 
              y: window.innerHeight + 100,
              rotate: Math.random() * 360
            }}
            transition={{ 
              duration: Math.random() * 10 + 15,
              repeat: Infinity,
              ease: "linear",
              delay: Math.random() * 20
            }}
          />
        ))}
      </div>
      
      {/* Game title */}
      <motion.h1 
        className="text-6xl font-bold text-white mb-10 text-center"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, type: "spring" }}
      >
        <span className="text-blue-400">Card</span> Masters
      </motion.h1>
      
      {/* Card decoration */}
      <div className="relative mb-16 w-32 h-48">
        <motion.div 
          className="absolute top-0 left-0 w-full h-full bg-blue-600 rounded-lg shadow-lg"
          initial={{ rotate: -10, x: -30 }}
          animate={{ rotate: -15, x: -40 }}
          transition={{ duration: 2, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute top-0 left-0 w-full h-full bg-red-600 rounded-lg shadow-lg"
          initial={{ rotate: 5, x: 0 }}
          animate={{ rotate: 10, x: 10 }}
          transition={{ duration: 2, repeat: Infinity, repeatType: "reverse", ease: "easeInOut", delay: 0.3 }}
        />
        <motion.div 
          className="absolute top-0 left-0 w-full h-full bg-white rounded-lg shadow-lg flex items-center justify-center"
          initial={{ rotate: 0, y: 0 }}
          animate={{ rotate: 5, y: -5 }}
          transition={{ duration: 2, repeat: Infinity, repeatType: "reverse", ease: "easeInOut", delay: 0.6 }}
        >
          <span className="text-4xl text-gray-800">CM</span>
        </motion.div>
      </div>
      
      {/* Menu options */}
      <motion.div 
        className="flex flex-col gap-4 items-center w-64"
        variants={{
          hidden: { opacity: 0 },
          show: {
            opacity: 1,
            transition: {
              staggerChildren: 0.2
            }
          }
        }}
        initial="hidden"
        animate="show"
      >
        <motion.div 
          variants={{
            hidden: { y: 20, opacity: 0 },
            show: { y: 0, opacity: 1 }
          }}
          className="w-full"
        >
          <Button 
            variant="default" 
            size="lg" 
            className="w-full text-lg" 
            onClick={() => navigate("/lobby")}
          >
            Play
          </Button>
        </motion.div>
        
        <motion.div 
          variants={{
            hidden: { y: 20, opacity: 0 },
            show: { y: 0, opacity: 1 }
          }}
          className="w-full"
        >
          <Button 
            variant="outline" 
            size="lg" 
            className="w-full text-lg" 
            onClick={() => navigate("/deck-builder")}
          >
            Deck Builder
          </Button>
        </motion.div>
        
        <motion.div 
          variants={{
            hidden: { y: 20, opacity: 0 },
            show: { y: 0, opacity: 1 }
          }}
          className="w-full"
        >
          <Button 
            variant="outline" 
            size="lg" 
            className="w-full text-lg" 
            onClick={() => navigate("/card-library")}
          >
            Card Library
          </Button>
        </motion.div>
      </motion.div>
      
      {/* Sound toggle button */}
      <Button 
        variant="ghost" 
        size="icon"
        className="absolute top-4 right-4"
        onClick={toggleMute}
      >
        {isMuted ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path></svg>
        )}
      </Button>
      
      {/* Version number */}
      <div className="absolute bottom-4 left-4 text-white/50 text-sm">
        v1.0.0
      </div>
    </div>
  );
};

export default MainMenu;
