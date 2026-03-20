import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { GameState, Player, GuessData, GamePhase } from '../types/game';
import { useSound } from './useSound';

const createEmptyGameState = (): GameState => ({
  gameId: null,
  players: [],
  currentTurn: null,
  gameStarted: false,
  gameEnded: false,
  winner: null,
  allGuesses: [],
  gameNumber: 1
});

export const useSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const { playConnect, playDisconnect, playSuccess, playError, playNotification, playWarning, playDraw, playGameStart, playGameWin, playGameLose } = useSound();
  
  const [sessionId, setSessionId] = useState<string | null>(() => {
    // Generate a unique session ID for this browser tab/window
    const existingSessionId = sessionStorage.getItem('gameSessionId');
    return existingSessionId || `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  });
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [gameState, setGameState] = useState<GameState>(createEmptyGameState);
  const [gamePhase, setGamePhase] = useState<GamePhase>(() => {
    // Determine initial game phase based on saved state
    const savedGameState = sessionStorage.getItem('gameState');
    const savedSessionId = sessionStorage.getItem('gameSessionId');
    
    if (savedSessionId && savedGameState) {
      try {
        const parsedGameState = JSON.parse(savedGameState);
        if (parsedGameState.gameEnded) {
          return GamePhase.ENDED;
        } else if (parsedGameState.gameStarted) {
          return GamePhase.PLAYING;
        } else if (parsedGameState.gameId) {
          return GamePhase.SETUP;
        }
      } catch (e) {
        console.error('Failed to parse saved game state:', e);
      }
    }
    return GamePhase.LOBBY;
  });
  
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [playerName, setPlayerName] = useState(() => {
    return sessionStorage.getItem('playerName') || '';
  });
  const [myNumber, setMyNumber] = useState(() => {
    return sessionStorage.getItem('myNumber') || '';
  });
  const [error, setError] = useState('');
  const [rematchState, setRematchState] = useState({
    requested: false,
    opponentRequested: false
  });
  const [opponentStatus, setOpponentStatus] = useState<'connected' | 'disconnected' | 'reconnecting'>('connected');
  const gameStateRef = useRef(gameState);
  const playerNameRef = useRef(playerName);
  const soundRef = useRef({
    playConnect,
    playDisconnect,
    playSuccess,
    playError,
    playNotification,
    playWarning,
    playDraw,
    playGameStart,
    playGameWin,
    playGameLose
  });

  const shouldPlayTurnNotification = (
    players: Player[],
    currentPlayerName: string,
    nextTurn: string | null,
    previousTurn: string | null
  ) => {
    const myId = players.find(player => player.name === currentPlayerName)?.id;
    return Boolean(myId && nextTurn === myId && nextTurn !== previousTurn);
  };

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
    playerNameRef.current = playerName;
  }, [playerName]);

  useEffect(() => {
    soundRef.current = {
      playConnect,
      playDisconnect,
      playSuccess,
      playError,
      playNotification,
      playWarning,
      playDraw,
      playGameStart,
      playGameWin,
      playGameLose
    };
  }, [playConnect, playDisconnect, playSuccess, playError, playNotification, playWarning, playDraw, playGameStart, playGameWin, playGameLose]);

  useEffect(() => {
    // Check for existing session in sessionStorage (per tab)
    const savedSessionId = sessionStorage.getItem('gameSessionId');
    const savedPlayerName = sessionStorage.getItem('playerName');
    const savedGameState = sessionStorage.getItem('gameState');
    
    if (savedSessionId && savedPlayerName) {
      setIsReconnecting(true);
      setPlayerName(savedPlayerName);
      if (savedGameState) {
        try {
          const parsedGameState = JSON.parse(savedGameState);
          setGameState(parsedGameState);
        } catch (e) {
          console.error('Failed to parse saved game state:', e);
        }
      }
    }
    
    const newSocket = io({
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      timeout: 20000,
    });
    setSocket(newSocket);
    socketRef.current = newSocket;

    // Try to reconnect to existing session
    if (savedSessionId && savedPlayerName && !newSocket.recovered) {
      newSocket.emit('reconnectToSession', { sessionId: savedSessionId, playerName: savedPlayerName });
    }

    setupSocketListeners(newSocket);

    // Handle page visibility change (for mobile sleep/wake)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && socketRef.current) {
        const currentSessionId = sessionStorage.getItem('gameSessionId');
        const currentPlayerName = sessionStorage.getItem('playerName');
        
        if (currentSessionId && currentPlayerName && !socketRef.current.connected) {
          setIsReconnecting(true);
          socketRef.current.connect();
          
          setTimeout(() => {
            if (socketRef.current && socketRef.current.connected) {
              socketRef.current.emit('reconnectToSession', { 
                sessionId: currentSessionId, 
                playerName: currentPlayerName 
              });
            }
          }, 500);
        }
      }
    };

    // Handle page focus (for desktop/mobile focus events)
    const handleFocus = () => {
      const currentSessionId = sessionStorage.getItem('gameSessionId');
      const currentPlayerName = sessionStorage.getItem('playerName');
      
      if (currentSessionId && currentPlayerName && socketRef.current && !socketRef.current.connected) {
        setIsReconnecting(true);
        socketRef.current.connect();
        
        setTimeout(() => {
          if (socketRef.current && socketRef.current.connected) {
            socketRef.current.emit('reconnectToSession', { 
              sessionId: currentSessionId, 
              playerName: currentPlayerName 
            });
          }
        }, 500);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      newSocket.close();
      socketRef.current = null;
    };
  }, []);

  const resetToLobby = () => {
    const clearedGameState = createEmptyGameState();

    // Clear session storage for this tab
    sessionStorage.removeItem('gameSessionId');
    sessionStorage.removeItem('playerName');
    sessionStorage.removeItem('gameState');
    sessionStorage.removeItem('myNumber');
    setSessionId(null);
    setIsReconnecting(false);
    setOpponentStatus('connected');
    
    // Disconnect current socket to release name on server
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    
    // Reset all state
    gameStateRef.current = clearedGameState;
    setGameState(clearedGameState);
    setGamePhase(GamePhase.LOBBY);
    setPlayerName('');
    setMyNumber('');
    setError('');
    setRematchState({ requested: false, opponentRequested: false });
    
    // Create new socket connection after a brief delay to ensure server cleanup
    setTimeout(() => {
      const newSocket = io({
        autoConnect: true,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
        timeout: 20000,
      });
      setSocket(newSocket);
      socketRef.current = newSocket;
      setupSocketListeners(newSocket);
    }, 100);
  };

  const setupSocketListeners = (socketInstance: Socket) => {
    // Handle connection events
    socketInstance.on('connect', () => {
      console.log('Socket connected');
      setIsReconnecting(false);
      soundRef.current.playConnect();
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      // Only show reconnecting if we have a session to reconnect to
      const currentSessionId = sessionStorage.getItem('gameSessionId');
      if (currentSessionId && reason !== 'io client disconnect') {
        setIsReconnecting(true);
        soundRef.current.playDisconnect();
      }
    });

    socketInstance.on('reconnect', (attemptNumber) => {
      console.log('Socket reconnected after', attemptNumber, 'attempts');
      setIsReconnecting(false);
      
      // Try to rejoin session after automatic reconnection
      const currentSessionId = sessionStorage.getItem('gameSessionId');
      const currentPlayerName = sessionStorage.getItem('playerName');
      
      if (currentSessionId && currentPlayerName) {
        socketInstance.emit('reconnectToSession', { 
          sessionId: currentSessionId, 
          playerName: currentPlayerName 
        });
      }
    });

    socketInstance.on('reconnect_attempt', (attemptNumber) => {
      console.log('Attempting to reconnect... attempt', attemptNumber);
      setIsReconnecting(true);
    });

    socketInstance.on('reconnect_failed', () => {
      console.log('Failed to reconnect');
      setIsReconnecting(false);
      setError('Connection failed. Please refresh the page to continue.');
    });

    socketInstance.on('sessionNotFound', () => {
      const clearedGameState = createEmptyGameState();

      console.log('Session not found, clearing storage and returning to lobby');
      sessionStorage.removeItem('gameSessionId');
      sessionStorage.removeItem('playerName');
      sessionStorage.removeItem('gameState');
      sessionStorage.removeItem('myNumber');
      setSessionId(null);
      setIsReconnecting(false);
      gameStateRef.current = clearedGameState;
      setGameState(clearedGameState);
      setGamePhase(GamePhase.LOBBY);
      setPlayerName('');
      setMyNumber('');
      setError('');
      setOpponentStatus('connected');
      setRematchState({ requested: false, opponentRequested: false });
    });
    
    socketInstance.on('sessionReconnected', (data) => {
      console.log('Session reconnected successfully:', data);
      setGameState(data.gameState);
      setIsReconnecting(false);
      
      // DON'T update player name from server - keep our saved name
      // setPlayerName(data.playerName);
      // sessionStorage.setItem('playerName', data.playerName);
      sessionStorage.setItem('gameSessionId', data.sessionId);
      sessionStorage.setItem('gameState', JSON.stringify(data.gameState));
      
      // Update game phase based on current game state
      if (data.gameState.gameEnded) {
        setGamePhase(GamePhase.ENDED);
      } else if (data.gameState.gameStarted) {
        setGamePhase(GamePhase.PLAYING);
      } else if (data.gameState.gameId) {
        setGamePhase(GamePhase.SETUP);
      } else {
        setGamePhase(GamePhase.WAITING);
      }
      
      setOpponentStatus('connected');
      setError('');
    });
    
    socketInstance.on('waitingForPlayer', (data) => {
      const clearedGameState = createEmptyGameState();

      if (data?.sessionId) {
        setSessionId(data.sessionId);
        sessionStorage.setItem('gameSessionId', data.sessionId);
      }

      gameStateRef.current = clearedGameState;
      setGameState(clearedGameState);
      setMyNumber('');
      setOpponentStatus('connected');
      setRematchState({ requested: false, opponentRequested: false });
      sessionStorage.removeItem('gameState');
      sessionStorage.removeItem('myNumber');
      
      setIsTransitioning(true);
      setTimeout(() => {
        setGamePhase(GamePhase.WAITING);
        setError('');
        setIsTransitioning(false);
      }, 150);
    });

    socketInstance.on('gameFound', (data) => {
      const newGameState = {
        gameId: data.gameId,
        players: data.players,
        currentTurn: data.currentTurn,
        gameStarted: false,
        gameEnded: false,
        winner: null,
        allGuesses: [],
        gameNumber: 1
      };
      gameStateRef.current = newGameState;
      setGameState(newGameState);
      setMyNumber('');
      setOpponentStatus('connected');
      setRematchState({ requested: false, opponentRequested: false });
      sessionStorage.removeItem('myNumber');
      
      soundRef.current.playNotification();
      
      setIsTransitioning(true);
      setTimeout(() => {
        setGamePhase(GamePhase.SETUP);
        setError('');
        setIsTransitioning(false);
      }, 150);
      
      sessionStorage.setItem('gameState', JSON.stringify(newGameState));
    });

    socketInstance.on('opponentReconnected', (data) => {
      setOpponentStatus('connected');
      setError('');
    });
    
    socketInstance.on('playerReady', (data) => {
      setGameState(prev => ({
        ...prev,
        players: data.players
      }));
    });

    socketInstance.on('gameStarted', (data) => {
      setGameState(prev => {
        const newGameState = {
          ...prev,
          currentTurn: data.currentTurn,
          players: data.players.map((p: any) => ({
            ...prev.players.find(pp => pp.id === p.id),
            ...p
          })),
          gameStarted: true
        };
        sessionStorage.setItem('gameState', JSON.stringify(newGameState));
        return newGameState;
      });
      setOpponentStatus('connected');
      
      soundRef.current.playGameStart();
      
      setIsTransitioning(true);
      setTimeout(() => {
        setGamePhase(GamePhase.PLAYING);
        setError('');
        setIsTransitioning(false);
      }, 200);
    });

    socketInstance.on('guessMade', (data) => {
      const previousGameState = gameStateRef.current;
      const nextGameState = {
        ...previousGameState,
        currentTurn: data.currentTurn,
        allGuesses: data.allGuesses
      };

      gameStateRef.current = nextGameState;
      setGameState(nextGameState);

      if (shouldPlayTurnNotification(previousGameState.players, playerNameRef.current, data.currentTurn, previousGameState.currentTurn)) {
        soundRef.current.playNotification();
      }
    });

    socketInstance.on('playerWonButGameContinues', (data) => {
      const previousGameState = gameStateRef.current;
      const nextGameState = {
        ...previousGameState,
        currentTurn: data.currentTurn,
        allGuesses: data.allGuesses,
        potentialWinner: data.winnerName
      };
      const myId = previousGameState.players.find(player => player.name === playerNameRef.current)?.id;
      const isDangerState = Boolean(
        myId &&
        nextGameState.currentTurn === myId &&
        nextGameState.potentialWinner &&
        nextGameState.potentialWinner !== playerNameRef.current
      );

      gameStateRef.current = nextGameState;
      setGameState(nextGameState);

      if (isDangerState) {
        soundRef.current.playWarning();
      }
    });

    socketInstance.on('gameEnded', (data) => {
      const previousGameState = gameStateRef.current;
      const newGameState = {
        ...previousGameState,
        gameEnded: true,
        winner: data.winner,
        isDraw: data.isDraw || false,
        players: data.players.map((p: any) => ({
          ...previousGameState.players.find(pp => pp.id === p.id),
          ...p
        }))
      };

      gameStateRef.current = newGameState;
      setGameState(newGameState);
      sessionStorage.setItem('gameState', JSON.stringify(newGameState));
      
      const me = newGameState.players.find(p => p.name === playerNameRef.current);
      const isWinner = data.winner === me?.name;
      if (data.isDraw) {
        soundRef.current.playDraw();
      } else if (isWinner) {
        soundRef.current.playGameWin();
      } else {
        soundRef.current.playGameLose();
      }
      
      setIsTransitioning(true);
      setTimeout(() => {
        setGamePhase(GamePhase.ENDED);
        setIsTransitioning(false);
      }, 300);
    });

    socketInstance.on('newGameStarted', (data) => {
      soundRef.current.playSuccess();

      setGameState(prev => {
        const newGameState = {
          ...prev,
          currentTurn: data.currentTurn,
          gameStarted: false,
          gameEnded: false,
          winner: null,
          allGuesses: [],
          gameNumber: data.gameNumber,
          players: data.players.map((p: any) => ({
            ...prev.players.find(pp => pp.id === p.id),
            ...p
          })),
          potentialWinner: null,
          isDraw: false
        };
        gameStateRef.current = newGameState;
        sessionStorage.setItem('gameState', JSON.stringify(newGameState));
        return newGameState;
      });
      setOpponentStatus('connected');
      
      setIsTransitioning(true);
      setTimeout(() => {
        setGamePhase(GamePhase.SETUP);
        setMyNumber('');
        sessionStorage.removeItem('myNumber');
        setError('');
        setRematchState({ requested: false, opponentRequested: false });
        setIsTransitioning(false);
      }, 250);
    });

    socketInstance.on('numberGenerated', (number) => {
      setMyNumber(number);
      sessionStorage.setItem('myNumber', number);
    });

    socketInstance.on('numberError', (message) => {
      setError(message);
      soundRef.current.playError();
    });

    socketInstance.on('guessError', (message) => {
      setError(message);
      soundRef.current.playError();
    });

    socketInstance.on('opponentDisconnected', (data) => {
      setOpponentStatus('disconnected');
      if (data?.canReconnect) {
        setError(`${data.playerName} disconnected but can reconnect. Game paused.`);
      } else {
        setError('Your opponent has disconnected. Returning to lobby...');
        setTimeout(() => {
          resetToLobby();
        }, 3000);
      }
    });
    
    socketInstance.on('opponentDisconnectedWaiting', (data) => {
      if (data?.sessionId) {
        setSessionId(data.sessionId);
        sessionStorage.setItem('gameSessionId', data.sessionId);
      }
      setOpponentStatus('disconnected');
      setError('Your opponent disconnected. Waiting for them to reconnect or for a new opponent...');
    });
    
    socketInstance.on('opponentLeft', () => {
      setRematchState({ requested: false, opponentRequested: false });
      setOpponentStatus('disconnected');
    });

    socketInstance.on('rematchRequested', () => {
      soundRef.current.playNotification();
      setRematchState(prev => ({ ...prev, opponentRequested: true }));
    });

    socketInstance.on('rematchAccepted', () => {
      setRematchState({ requested: false, opponentRequested: false });
    });

    socketInstance.on('nameError', (message) => {
      const clearedGameState = createEmptyGameState();

      sessionStorage.removeItem('gameSessionId');
      sessionStorage.removeItem('gameState');
      sessionStorage.removeItem('myNumber');
      setSessionId(null);
      gameStateRef.current = clearedGameState;
      setGameState(clearedGameState);
      setOpponentStatus('connected');
      setRematchState({ requested: false, opponentRequested: false });
      setError(message);
      setGamePhase(GamePhase.LOBBY);
      soundRef.current.playError();
    });
  };

  const joinLobby = (name: string) => {
    // Generate new session ID for this game instance
    const newSessionId = `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setSessionId(newSessionId);
    
    if (socketRef.current && name.trim()) {
      setPlayerName(name.trim());
      sessionStorage.setItem('playerName', name.trim());
      sessionStorage.setItem('gameSessionId', newSessionId);
      sessionStorage.removeItem('gameState');
      sessionStorage.removeItem('myNumber');
      setError('');
      socketRef.current.emit('joinLobby', { playerName: name.trim(), sessionId: newSessionId });
    }
  };

  const setNumber = (number: string) => {
    if (socketRef.current && gameState.gameId) {
      setMyNumber(number);
      sessionStorage.setItem('myNumber', number);
      socketRef.current.emit('setNumber', { gameId: gameState.gameId, number });
    }
  };

  const makeGuess = (guess: string) => {
    if (socketRef.current && gameState.gameId) {
      socketRef.current.emit('makeGuess', { gameId: gameState.gameId, guess });
    }
  };

  const playAgain = () => {
    if (socketRef.current && gameState.gameId) {
      socketRef.current.emit('playAgain', { gameId: gameState.gameId });
    }
  };

  const generateRandomNumber = () => {
    if (socketRef.current) {
      socketRef.current.emit('generateNumber');
    }
  };

  const waitForOpponent = () => {
    if (socketRef.current && gameState.gameId) {
      socketRef.current.emit('waitForOpponent', { gameId: gameState.gameId });
    }
  };

  return {
    socket,
    socketRef,
    gameState,
    gamePhase,
    playerName,
    myNumber,
    error,
    rematchState,
    sessionId,
    isReconnecting,
    isTransitioning,
    opponentStatus,
    joinLobby,
    setNumber,
    makeGuess,
    playAgain,
    generateRandomNumber,
    setError,
    resetToLobby,
    waitForOpponent,
    requestRematch: () => {
      if (socketRef.current && gameState.gameId) {
        socketRef.current.emit('requestRematch', { gameId: gameState.gameId });
        setRematchState(prev => ({ ...prev, requested: true }));
        soundRef.current.playNotification();
      }
    },
    acceptRematch: () => {
      if (socketRef.current && gameState.gameId) {
        socketRef.current.emit('acceptRematch', { gameId: gameState.gameId });
        setRematchState({ requested: false, opponentRequested: false });
      }
    }
  };
};
