import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { GameState, Player, GuessData, GamePhase } from '../types/game';

export const useSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
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

    newSocket.on('waitingForPlayer', () => {
      setGamePhase(GamePhase.WAITING);
      setError('');
    });

    newSocket.on('gameFound', (data) => {
      setGameState(prev => ({
        ...prev,
        gameId: data.gameId,
        players: data.players,
        currentTurn: data.currentTurn
      }));
      setGamePhase(GamePhase.SETUP);
      setError('');
    });

    newSocket.on('playerReady', (data) => {
      setGameState(prev => ({
        ...prev,
        players: data.players
      }));
    });

    newSocket.on('gameStarted', (data) => {
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

    newSocket.on('guessMade', (data) => {
      setGameState(prev => ({
        ...prev,
        currentTurn: data.currentTurn,
        allGuesses: data.allGuesses
      }));
    });

    newSocket.on('playerWonButGameContinues', (data) => {
      setGameState(prev => ({
        ...prev,
        currentTurn: data.currentTurn,
        allGuesses: data.allGuesses,
        potentialWinner: data.winner
      }));
    });

    newSocket.on('gameEnded', (data) => {
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

    newSocket.on('newGameStarted', (data) => {
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

    newSocket.on('numberGenerated', (number) => {
      setMyNumber(number);
    });

    newSocket.on('numberError', (message) => {
      setError(message);
    });

    newSocket.on('guessError', (message) => {
      setError(message);
    });

    newSocket.on('opponentDisconnected', () => {
      setError('Your opponent has disconnected. Returning to lobby...');
      setTimeout(() => {
        // Reset to initial state
        resetToLobby();
      }, 3000);
    });

    newSocket.on('rematchRequested', () => {
      setRematchState(prev => ({ ...prev, opponentRequested: true }));
    });

    newSocket.on('rematchAccepted', () => {
      setRematchState({ requested: false, opponentRequested: false });
    });

    newSocket.on('nameError', (message) => {
      setError(message);
      setGamePhase(GamePhase.LOBBY);
    });

    return () => {
      newSocket.close();
    };
  }, []);

  const resetToLobby = () => {
    setGamePhase(GamePhase.LOBBY);
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
    setPlayerName('');
    setMyNumber('');
    setError('');
    setRematchState({ requested: false, opponentRequested: false });
  };

  const joinLobby = (name: string) => {
    if (socket && name.trim()) {
      setPlayerName(name.trim());
      socket.emit('joinLobby', name.trim());
    }
  };

  const setNumber = (number: string) => {
    if (socket && gameState.gameId) {
      setMyNumber(number);
      socket.emit('setNumber', { gameId: gameState.gameId, number });
    }
  };

  const makeGuess = (guess: string) => {
    if (socket && gameState.gameId) {
      socket.emit('makeGuess', { gameId: gameState.gameId, guess });
      setError('');
    }
  };

  const playAgain = () => {
    if (socket && gameState.gameId) {
      socket.emit('playAgain', { gameId: gameState.gameId });
    }
  };

  const generateRandomNumber = () => {
    if (socket) {
      socket.emit('generateNumber');
    }
  };

  return {
    socket,
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
    requestRematch: () => {
      if (socket && gameState.gameId) {
        socket.emit('requestRematch', { gameId: gameState.gameId });
        setRematchState(prev => ({ ...prev, requested: true }));
      }
    },
    acceptRematch: () => {
      if (socket && gameState.gameId) {
        socket.emit('acceptRematch', { gameId: gameState.gameId });
        setRematchState({ requested: false, opponentRequested: false });
      }
    }
  };
};