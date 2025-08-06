import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { GameState, Player, GuessData, GamePhase } from '../types/game';

export const useSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const socketRef = useRef<Socket | null>(null);
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

  useEffect(() => {
    const newSocket = io();
    setSocket(newSocket);
    socketRef.current = newSocket;

    newSocket.on('waitingForPlayer', () => {
      setGamePhase(GamePhase.WAITING);
      setError('');
    });

    setupSocketListeners(newSocket);

    return () => {
      newSocket.close();
      socketRef.current = null;
    };
  }, []);

  const resetToLobby = () => {
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
    socketInstance.on('waitingForPlayer', () => {
      setGamePhase(GamePhase.WAITING);
      setError('');
    });

    socketInstance.on('gameFound', (data) => {
      setGameState(prev => ({
        ...prev,
        gameId: data.gameId,
        players: data.players,
        currentTurn: data.currentTurn
      }));
      setGamePhase(GamePhase.SETUP);
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

    socketInstance.on('opponentDisconnected', () => {
      setError('Your opponent has disconnected. Returning to lobby...');
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
    if (socketRef.current && name.trim()) {
      setPlayerName(name.trim());
      socketRef.current.emit('joinLobby', name.trim());
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

  return {
    socket: socketRef.current,
    gameState,
    gamePhase,
    playerName,
    myNumber,
    error,
    rematchState,
    joinLobby,
    setNumber,
    makeGuess,
    playAgain,
    generateRandomNumber,
    setError,
    resetToLobby,
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