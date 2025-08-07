import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import type { 
  Game, 
  Player, 
  PlayerSession, 
  DisconnectedPlayer, 
  GameStateData,
  GuessData 
} from './types/game.js';
import {
  generateSessionId,
  generateRandomNumber,
  validateNumber,
  calculateFeedback,
  createGame,
  resetGameForNewRound,
  getAllGuessesSorted
} from './utils/gameUtils.js';
import {
  cleanupPlayerName,
  findGameByPlayerId,
  updateSessionSocket,
  updateGamePlayerReferences
} from './utils/sessionUtils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Check if we're in production (dist folder exists) or development
const distPath = path.join(__dirname, 'dist');
const isProduction = fs.existsSync(distPath);

if (isProduction) {
  // Production: serve built files
  app.use(express.static(distPath));
  
  // Handle React routing, return all requests to React app
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  // Development: just serve API endpoints, let Vite handle the frontend
  app.get('/', (req, res) => {
    res.json({ 
      message: 'Number Master Game Server', 
      status: 'running',
      mode: 'development',
      note: 'Frontend served by Vite dev server'
    });
  });
}

// Game state management
const waitingPlayers = new Map<string, Player>();
const activeGames = new Map<string, Game>();
const playerSockets = new Map<string, any>();
const usedNames = new Map<string, string>(); // Map socketId -> normalizedName for easier cleanup
const playerSessions = new Map<string, PlayerSession>(); // Map sessionId -> PlayerSession
const sessionsBySocket = new Map<string, string>(); // Map socketId -> sessionId for quick lookup
const disconnectedPlayers = new Map<string, DisconnectedPlayer>(); // Map sessionId -> DisconnectedPlayer

// Helper function to create game state data
function createGameStateData(game: Game): GameStateData {
  return {
    gameId: game.id,
    players: Object.values(game.players).map(p => ({
      ...p,
      sessionId: p.sessionId
    })),
    currentTurn: game.currentTurn,
    gameStarted: game.gameStarted,
    gameEnded: game.gameEnded,
    winner: game.winner,
    gameNumber: game.gameNumber,
    allGuesses: getAllGuessesSorted(game),
    potentialWinner: game.potentialWinner,
    isDraw: game.isDraw
  };
}

// Helper function to handle game reconnection
function handleGameReconnection(socket: any, session: PlayerSession, game: Game) {
  // Join game room
  socket.join(session.gameId);
  
  // Update player socket reference in the game
  const player = game.players[session.playerId];
  if (player) {
    player.socketId = socket.id;
  }
  
  // Send current game state
  const gameStateData = createGameStateData(game);
  
  socket.emit('sessionReconnected', {
    sessionId: session.sessionId,
    playerName: session.playerName,
    gameState: gameStateData
  });
  
  // Notify opponent that player reconnected
  const opponentId = Object.keys(game.players).find(id => id !== session.playerId);
  if (opponentId) {
    socket.to(session.gameId).emit('opponentReconnected', {
      playerName: session.playerName
    });
  }
  
  console.log(`Player ${session.playerName} reconnected to game ${session.gameId}`);
}

// Helper function to handle game end
function handleGameEnd(game: Game, winnerId: string | null, isDraw: boolean = false) {
  game.gameEnded = true;
  game.isDraw = isDraw;
  
  if (!isDraw && winnerId) {
    game.winner = game.players[winnerId].name;
    game.players[winnerId].gamesWon++;
  } else {
    game.winner = null;
  }
  
  const gameEndData = {
    winner: game.winner,
    isDraw: isDraw,
    winnerNumber: isDraw ? null : Object.values(game.players).find(p => p.name !== game.winner)?.number,
    players: Object.values(game.players).map(p => ({ 
      id: p.id, 
      name: p.name, 
      number: p.number,
      guesses: p.guesses,
      gamesWon: p.gamesWon,
      hasWon: p.hasWon || false
    }))
  };
  
  io.to(game.id).emit('gameEnded', gameEndData);
}

io.on('connection', (socket) => {
  console.log('Player connected:', socket.id);
  
  socket.on('reconnectToSession', (data) => {
    const { sessionId, playerName } = data;
    const session = playerSessions.get(sessionId);
    
    if (!session) {
      socket.emit('sessionNotFound');
      return;
    }
    
    const game = activeGames.get(session.gameId!);
    if (!game) {
      socket.emit('sessionNotFound');
      return;
    }
    
    // Update socket references
    updateSessionSocket(session, socket.id, sessionsBySocket);
    playerSockets.set(socket.id, socket);
    
    // Update game player references
    const updatedPlayerId = updateGamePlayerReferences(game, sessionId, socket.id);
    if (updatedPlayerId) {
      session.playerId = updatedPlayerId;
    }
    
    // Remove from disconnected players if they were there
    disconnectedPlayers.delete(sessionId);
    
    handleGameReconnection(socket, session, game);
  });
  
  socket.on('joinLobby', ({ playerName, sessionId }) => {
    // Check if this session already exists and has an active game
    const existingSession = playerSessions.get(sessionId);
    if (existingSession?.gameId) {
      const game = activeGames.get(existingSession.gameId);
      if (game && !game.gameEnded) {
        // Update socket references for existing session
        updateSessionSocket(existingSession, socket.id, sessionsBySocket);
        playerSockets.set(socket.id, socket);
        
        // Update player data in game
        const updatedPlayerId = updateGamePlayerReferences(game, sessionId, socket.id);
        if (updatedPlayerId) {
          // Remove from disconnected players if they were there
          disconnectedPlayers.delete(sessionId);
          
          // Keep the original playerId but update socket references
          existingSession.socketId = socket.id;
          
          handleGameReconnection(socket, existingSession, game);
          return;
        }
      }
    }
    
    // Check if name is already in use by a different session
    const normalizedName = playerName.trim().toLowerCase();
    const isNameTaken = Array.from(usedNames.values()).includes(normalizedName);
    if (isNameTaken) {
      socket.emit('nameError', 'This name is already in use. Please choose a different name.');
      return;
    }
    
    const player: Player = {
      id: socket.id,
      name: playerName,
      socketId: socket.id,
      sessionId: '',
      ready: false,
      guesses: [],
      gamesWon: 0
    };
    
    playerSockets.set(socket.id, socket);
    usedNames.set(socket.id, normalizedName);
    
    // Create or update session for this player
    const session: PlayerSession = {
      playerId: socket.id,
      gameId: null,
      playerName: playerName,
      socketId: socket.id
    };
    playerSessions.set(sessionId, session);
    sessionsBySocket.set(socket.id, sessionId);
    
    console.log(`Player "${playerName}" (${socket.id}) joined. Used names:`, Array.from(usedNames.values()));
    
    // Check if there's a waiting player
    if (waitingPlayers.size > 0) {
      const waitingPlayer = Array.from(waitingPlayers.values())[0];
      waitingPlayers.delete(waitingPlayer.id);
      
      // Create game
      const game = createGame(waitingPlayer, player);
      activeGames.set(game.id, game);
      
      // Update sessions with game ID
      const waitingSession = playerSessions.get(waitingPlayer.sessionId);
      const playerSession = playerSessions.get(sessionId);
      if (waitingSession) waitingSession.gameId = game.id;
      if (playerSession) playerSession.gameId = game.id;
      
      // Join both players to game room
      const waitingSocket = playerSockets.get(waitingPlayer.id);
      waitingSocket?.join(game.id);
      socket.join(game.id);
      
      // Notify both players
      io.to(game.id).emit('gameFound', {
        gameId: game.id,
        sessionId: sessionId,
        players: Object.values(game.players),
        currentTurn: game.currentTurn
      });
    } else {
      // Add to waiting list
      player.sessionId = sessionId;
      waitingPlayers.set(socket.id, player);
      socket.emit('waitingForPlayer', { sessionId });
    }
  });
  
  socket.on('setNumber', ({ gameId, number }) => {
    const game = activeGames.get(gameId);
    if (!game || !game.players[socket.id]) return;
    
    if (!validateNumber(number)) {
      socket.emit('numberError', 'Invalid number. Must be 5 digits with no repeats.');
      return;
    }
    
    game.players[socket.id].number = number;
    game.players[socket.id].ready = true;
    
    // Check if both players are ready
    const allReady = Object.values(game.players).every(player => player.ready);
    
    if (allReady) {
      game.gameStarted = true;
      io.to(gameId).emit('gameStarted', {
        currentTurn: game.currentTurn,
        players: Object.values(game.players).map(p => ({ id: p.id, name: p.name, ready: p.ready }))
      });
    } else {
      io.to(gameId).emit('playerReady', {
        playerId: socket.id,
        players: Object.values(game.players).map(p => ({ id: p.id, name: p.name, ready: p.ready }))
      });
    }
  });
  
  socket.on('makeGuess', ({ gameId, guess }) => {
    const game = activeGames.get(gameId);
    if (!game || !game.gameStarted || game.gameEnded) return;
    if (game.currentTurn !== socket.id) return;
    
    if (!validateNumber(guess)) {
      socket.emit('guessError', 'Invalid guess. Must be 5 digits with no repeats.');
      return;
    }
    
    // Find opponent
    const opponentId = Object.keys(game.players).find(id => id !== socket.id)!;
    const opponent = game.players[opponentId];
    const currentPlayer = game.players[socket.id];
    
    // Calculate feedback
    const feedback = calculateFeedback(guess, opponent.number!);
    
    // Add guess to history
    const guessData: GuessData = {
      guess,
      feedback,
      player: currentPlayer.name,
      turn: currentPlayer.guesses.length + 1
    };
    
    currentPlayer.guesses.push(guessData);
    
    // Check for win
    const isWin = feedback.correctPosition === 5;
    
    if (isWin) {
      // Mark this player as having won
      game.players[socket.id].hasWon = true;
      
      // Check if opponent has already made their guess this round
      const opponentHasGuessed = opponent.guesses.length >= currentPlayer.guesses.length;
      
      if (opponentHasGuessed) {
        // Check if opponent also won (draw condition)
        if (opponent.hasWon) {
          handleGameEnd(game, null, true); // Draw
        } else {
          handleGameEnd(game, socket.id); // Current player wins
        }
      } else {
        // Give opponent a chance to guess
        game.potentialWinner = socket.id;
        game.currentTurn = opponentId;
        
        io.to(gameId).emit('playerWonButGameContinues', {
          winnerName: currentPlayer.name,
          winnerId: socket.id,
          currentTurn: game.currentTurn,
          allGuesses: getAllGuessesSorted(game)
        });
      }
    } else {
      // Check if opponent has already won
      if (game.potentialWinner && game.potentialWinner !== socket.id) {
        handleGameEnd(game, game.potentialWinner);
      } else {
        // Switch turns
        game.currentTurn = opponentId;
      
        io.to(gameId).emit('guessMade', {
          guess: guessData,
          currentTurn: game.currentTurn,
          allGuesses: getAllGuessesSorted(game)
        });
      }
    }
  });
  
  socket.on('playAgain', ({ gameId }) => {
    const game = activeGames.get(gameId);
    if (!game) return;
    
    resetGameForNewRound(game);
    
    io.to(gameId).emit('newGameStarted', {
      currentTurn: game.currentTurn,
      gameNumber: game.gameNumber,
      players: Object.values(game.players).map(p => ({ 
        id: p.id, 
        name: p.name, 
        ready: p.ready,
        gamesWon: p.gamesWon
      }))
    });
  });
  
  socket.on('waitForOpponent', ({ gameId }) => {
    const game = activeGames.get(gameId);
    if (!game) return;
    
    const sessionId = sessionsBySocket.get(socket.id);
    socket.emit('opponentDisconnectedWaiting', { sessionId });
  });
  
  socket.on('generateNumber', () => {
    const randomNumber = generateRandomNumber();
    socket.emit('numberGenerated', randomNumber);
  });
  
  socket.on('requestRematch', ({ gameId }) => {
    const game = activeGames.get(gameId);
    if (!game) return;
    
    const opponentId = Object.keys(game.players).find(id => id !== socket.id);
    if (opponentId) {
      io.to(opponentId).emit('rematchRequested');
    }
  });
  
  socket.on('acceptRematch', ({ gameId }) => {
    const game = activeGames.get(gameId);
    if (!game) return;
    
    io.to(gameId).emit('rematchAccepted');
    resetGameForNewRound(game);
    
    io.to(gameId).emit('newGameStarted', {
      currentTurn: game.currentTurn,
      gameNumber: game.gameNumber,
      players: Object.values(game.players).map(p => ({ 
        id: p.id, 
        name: p.name, 
        ready: p.ready,
        gamesWon: p.gamesWon
      }))
    });
  });
  
  socket.on('disconnect', () => {
    console.log('Player disconnected:', socket.id);
    
    const sessionId = sessionsBySocket.get(socket.id);
    const session = sessionId ? playerSessions.get(sessionId) : null;
    
    if (session?.gameId) {
      // Player was in a game - mark as disconnected but keep session
      const game = activeGames.get(session.gameId);
      if (game && !game.gameEnded) {
        disconnectedPlayers.set(sessionId, {
          disconnectTime: Date.now(),
          gameId: session.gameId,
          playerData: game.players[session.playerId],
          originalPlayerId: session.playerId
        });
        
        // Notify opponent
        const opponentId = Object.keys(game.players).find(id => id !== session.playerId);
        if (opponentId && playerSockets.has(game.players[opponentId].socketId)) {
          socket.to(session.gameId).emit('opponentDisconnected', {
            playerName: session.playerName,
            canReconnect: true
          });
        }
        
        console.log(`Player ${session.playerName} disconnected from game ${session.gameId}, session preserved`);
      } else {
        // Game ended, clean up completely
        playerSessions.delete(sessionId);
      }
    } else {
      // Player was waiting or not in a game
      waitingPlayers.delete(socket.id);
      if (sessionId) {
        playerSessions.delete(sessionId);
      }
    }
    
    // Clean up socket references
    cleanupPlayerName(socket.id, usedNames);
    sessionsBySocket.delete(socket.id);
    playerSockets.delete(socket.id);
  });
});

// Clean up old disconnected players (after 5 minutes)
setInterval(() => {
  const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
  for (const [sessionId, data] of disconnectedPlayers.entries()) {
    if (data.disconnectTime < fiveMinutesAgo) {
      disconnectedPlayers.delete(sessionId);
      playerSessions.delete(sessionId);
      const game = activeGames.get(data.gameId);
      if (game) {
        // Notify remaining player that opponent won't return
        const remainingPlayerId = Object.keys(game.players).find(id => id !== data.playerData.id);
        if (remainingPlayerId && playerSockets.has(game.players[remainingPlayerId].socketId)) {
          io.to(remainingPlayerId).emit('opponentLeft');
        }
        activeGames.delete(data.gameId);
      }
      console.log(`Cleaned up expired session ${sessionId}`);
    }
  }
}, 60000); // Check every minute

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});