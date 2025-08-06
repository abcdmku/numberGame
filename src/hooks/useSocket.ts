import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { GameState, Player, GuessData, GamePhase } from '../types/game';

export const useSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(() => {
    // Generate a unique session ID for this browser tab/window
    const existingSessionId = sessionStorage.getItem('gameSessionId');
    return existingSessionId || `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  });
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [gameState, setGameState] = useState<GameState>({
    gameId: null,
    players: [],
    currentTurn: null,
    gameStarted: false,
    gameEnded: false,
    winner: null,
    allGuesses: [],
    gameNumber: 1
  });
  const [gamePhase, setGamePhase] = useState<GamePhase>(GamePhase.LOBBY);
  const [playerName, setPlayerName] = useState('');
  const [myNumber, setMyNumber] = useState('');
  const [error, setError] = useState('');
  const [rematchState, setRematchState] = useState({
    requested: false,
    opponentRequested: false
  });
  const [opponentStatus, setOpponentStatus] = useState<'connected' | 'disconnected' | 'reconnecting'>('connected');

  useEffect(() => {
    // Check for existing session in sessionStorage (per tab)
    const savedSessionId = sessionStorage.getItem('gameSessionId');
    const savedPlayerName = sessionStorage.getItem('playerName');
    const savedGameState = sessionStorage.getItem('gameState');
    
    if (savedSessionId && savedPlayerName && savedGameState) {
      setIsReconnecting(true);
      setPlayerName(savedPlayerName);
      try {
        const parsedGameState = JSON.parse(savedGameState);
        setGameState(parsedGameState);
      } catch (e) {
        console.error('Failed to parse saved game state:', e);
      }
    }
    
    const newSocket = io();
    setSocket(newSocket);
    socketRef.current = newSocket;

    // Try to reconnect to existing session
    if (savedSessionId && savedPlayerName) {
      newSocket.emit('reconnectToSession', { sessionId: savedSessionId, playerName: savedPlayerName });
    }

    setupSocketListeners(newSocket);

    return () => {
      newSocket.close();
      socketRef.current = null;
    };
  }, []);

  const resetToLobby = () => {
    // Clear session storage for this tab
    sessionStorage.removeItem('gameSessionId');
    sessionStorage.removeItem('playerName');
    sessionStorage.removeItem('gameState');
    setSessionId(null);
    setIsReconnecting(false);
    setOpponentStatus('connected');
    
    // Disconnect current socket to release name on server
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    
    // Reset all state
    setGameState({
      gameId: null,
      players: [],
      currentTurn: null,
      gameStarted: false,
      gameEnded: false,
      winner: null,
      allGuesses: [],
      gameNumber: 1
    });
    setGamePhase(GamePhase.LOBBY);
    setPlayerName('');
    setMyNumber('');
    setError('');
    setRematchState({ requested: false, opponentRequested: false });
    
    // Create new socket connection after a brief delay to ensure server cleanup
    setTimeout(() => {
      const newSocket = io();
      setSocket(newSocket);
      socketRef.current = newSocket;
      setupSocketListeners(newSocket);
    }, 100);
  };

  const setupSocketListeners = (socketInstance: Socket) => {
    socketInstance.on('sessionNotFound', () => {
      sessionStorage.removeItem('gameSessionId');
      sessionStorage.removeItem('playerName');
      sessionStorage.removeItem('gameState');
      setSessionId(null);
      setIsReconnecting(false);
      setGamePhase(GamePhase.LOBBY);
    });
    
    socketInstance.on('sessionReconnected', (data) => {
      setGameState(data.gameState);
      setIsReconnecting(false);
      
      // Restore player name
      setPlayerName(data.playerName);
      sessionStorage.setItem('playerName', data.playerName);
      sessionStorage.setItem('gameSessionId', data.sessionId);
      sessionStorage.setItem('gameState', JSON.stringify(data.gameState));
      
      if (data.gameState.gameEnded) {
        setGamePhase(GamePhase.ENDED);
      } else if (data.gameState.gameStarted) {
        setGamePhase(GamePhase.PLAYING);
      } else {
        setGamePhase(GamePhase.SETUP);
      }
      
      setOpponentStatus('connected');
      setError('');
    });
    
    socketInstance.on('waitingForPlayer', (data) => {
      if (data?.sessionId) {
        setSessionId(data.sessionId);
        sessionStorage.setItem('gameSessionId', data.sessionId);
      }
      setGamePhase(GamePhase.WAITING);
      setError('');
    });

    socketInstance.on('gameFound', (data) => {
      if (data.sessionId) {
        setSessionId(data.sessionId);
        sessionStorage.setItem('gameSessionId', data.sessionId);
      }
      setGameState(prev => ({
        ...prev,
        gameId: data.gameId,
        players: data.players,
        currentTurn: data.currentTurn
      }));
      setGamePhase(GamePhase.SETUP);
      sessionStorage.setItem('gameState', JSON.stringify(gameState));
      setError('');
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
      setGameState(prev => ({
        ...prev,
        currentTurn: data.currentTurn,
        players: data.players.map((p: any) => ({
          ...prev.players.find(pp => pp.id === p.id),
          ...p
        })),
        gameStarted: true
      }));
      setGamePhase(GamePhase.PLAYING);
      sessionStorage.setItem('gameState', JSON.stringify(gameState));
      setError('');
    });

    socketInstance.on('guessMade', (data) => {
      setGameState(prev => ({
        ...prev,
        currentTurn: data.currentTurn,
        allGuesses: data.allGuesses
      }));
    });

    socketInstance.on('playerWonButGameContinues', (data) => {
      setGameState(prev => ({
        ...prev,
        currentTurn: data.currentTurn,
        allGuesses: data.allGuesses,
        potentialWinner: data.winner
      }));
    });

    socketInstance.on('gameEnded', (data) => {
      setGameState(prev => ({
        ...prev,
        gameEnded: true,
        winner: data.winner,
        isDraw: data.isDraw || false,
        players: data.players.map((p: any) => ({
          ...prev.players.find(pp => pp.id === p.id),
          ...p
        }))
      }));
      setGamePhase(GamePhase.ENDED);
      sessionStorage.setItem('gameState', JSON.stringify(gameState));
    });

    socketInstance.on('newGameStarted', (data) => {
      setGameState(prev => ({
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
        potentialWinner: null
      }));
      setGamePhase(GamePhase.SETUP);
      setMyNumber('');
      setError('');
      setRematchState({ requested: false, opponentRequested: false });
    });

    socketInstance.on('numberGenerated', (number) => {
      setMyNumber(number);
    });

    socketInstance.on('numberError', (message) => {
      setError(message);
    });

    socketInstance.on('guessError', (message) => {
      setError(message);
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
      setError('Your opponent has left the game. Returning to lobby...');
      setTimeout(() => {
        resetToLobby();
      }, 3000);
    });

    socketInstance.on('rematchRequested', () => {
      setRematchState(prev => ({ ...prev, opponentRequested: true }));
    });

    socketInstance.on('rematchAccepted', () => {
      setRematchState({ requested: false, opponentRequested: false });
    });

    socketInstance.on('nameError', (message) => {
      setError(message);
      setGamePhase(GamePhase.LOBBY);
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
      socketRef.current.emit('joinLobby', { playerName: name.trim(), sessionId: newSessionId });
    }
  };

  const setNumber = (number: string) => {
    if (socketRef.current && gameState.gameId) {
      setMyNumber(number);
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
    socket: socketRef.current,
    gameState,
    gamePhase,
    playerName,
    myNumber,
    error,
    rematchState,
    sessionId,
    isReconnecting,
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