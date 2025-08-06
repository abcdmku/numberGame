import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

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
const waitingPlayers = new Map();
const activeGames = new Map();
const playerSockets = new Map();
const usedNames = new Map(); // Map socketId -> normalizedName for easier cleanup
const playerSessions = new Map(); // Map sessionId -> { playerId, gameId, playerName }
const sessionsBySocket = new Map(); // Map socketId -> sessionId for quick lookup
const disconnectedPlayers = new Map(); // Map sessionId -> { disconnectTime, gameId, playerData }

// Utility functions
function generateSessionId() {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function generateRandomNumber() {
  const digits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  const result = [];
  
  // First digit can be any digit 0-9
  const firstDigit = Math.floor(Math.random() * 10);
  result.push(firstDigit);
  digits.splice(digits.indexOf(firstDigit), 1);
  
  // Add 4 more unique digits
  for (let i = 0; i < 4; i++) {
    const randomIndex = Math.floor(Math.random() * digits.length);
    result.push(digits[randomIndex]);
    digits.splice(randomIndex, 1);
  }
  
  return result.join('');
}

function cleanupPlayerName(socketId) {
  if (usedNames.has(socketId)) {
    const playerName = usedNames.get(socketId);
    usedNames.delete(socketId);
    console.log(`Removed name "${playerName}" for socket ${socketId}`);
  }
}

function findGameByPlayerId(playerId) {
  return Array.from(activeGames.values()).find(game => 
    game.players[playerId]
  );
}

function validateNumber(number) {
  if (!/^\d{5}$/.test(number)) return false;
  
  const digits = number.split('');
  const uniqueDigits = new Set(digits);
  return uniqueDigits.size === 5;
}

function calculateFeedback(guess, target) {
  const guessDigits = guess.split('');
  const targetDigits = target.split('');
  
  let correctPosition = 0;
  let correctDigit = 0;
  
  // Count correct positions
  for (let i = 0; i < 5; i++) {
    if (guessDigits[i] === targetDigits[i]) {
      correctPosition++;
    }
  }
  
  // Count correct digits (including correct positions)
  const guessCount = {};
  const targetCount = {};
  
  for (let digit of guessDigits) {
    guessCount[digit] = (guessCount[digit] || 0) + 1;
  }
  
  for (let digit of targetDigits) {
    targetCount[digit] = (targetCount[digit] || 0) + 1;
  }
  
  for (let digit in guessCount) {
    if (targetCount[digit]) {
      correctDigit += Math.min(guessCount[digit], targetCount[digit]);
    }
  }
  
  const correctDigitWrongPosition = correctDigit - correctPosition;
  
  return {
    correctPosition,
    correctDigitWrongPosition
  };
}

function createGame(player1, player2) {
  const gameId = `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Generate session IDs for both players
  const player1SessionId = generateSessionId();
  const player2SessionId = generateSessionId();
  
  const game = {
    id: gameId,
    players: {
      [player1.id]: {
        ...player1,
        sessionId: player1SessionId,
        number: null,
        ready: false,
        guesses: [],
        gamesWon: 0
      },
      [player2.id]: {
        ...player2,
        sessionId: player2SessionId,
        number: null,
        ready: false,
        guesses: [],
        gamesWon: 0
      }
    },
    currentTurn: Math.random() < 0.5 ? player1.id : player2.id,
    firstPlayer: null,
    gameStarted: false,
    gameEnded: false,
    winner: null,
    gameNumber: 1
  };
  
  game.firstPlayer = game.currentTurn;
  activeGames.set(gameId, game);
  
  return game;
}

io.on('connection', (socket) => {
  console.log('Player connected:', socket.id);
  
  socket.on('reconnectToSession', (sessionId) => {
    const session = playerSessions.get(sessionId);
    if (!session) {
      socket.emit('sessionNotFound');
      return;
    }
    
    const game = activeGames.get(session.gameId);
    if (!game) {
      socket.emit('sessionNotFound');
      return;
    }
    
    // Update socket references
    const oldSocketId = session.socketId;
    session.socketId = socket.id;
    session.playerId = socket.id; // Update playerId to new socket.id
    sessionsBySocket.set(socket.id, sessionId);
    playerSockets.set(socket.id, socket);
    
    // Update game player socket reference
    if (game.players[session.playerId]) {
      // Move player data to new socket id
      const playerData = game.players[session.playerId];
      delete game.players[session.playerId];
      game.players[socket.id] = {
        ...playerData,
        id: socket.id,
        socketId: socket.id
      };
      
      // Update current turn if it was the old socket id
      if (game.currentTurn === session.playerId) {
        game.currentTurn = socket.id;
      }
      
      // Update session playerId
      session.playerId = socket.id;
    } else {
      game.players[session.playerId].socketId = socket.id;
    }
    
    // Clean up old socket references
    if (oldSocketId) {
      playerSockets.delete(oldSocketId);
      sessionsBySocket.delete(oldSocketId);
      cleanupPlayerName(oldSocketId);
    }
    
    // Remove from disconnected players if they were there
    disconnectedPlayers.delete(sessionId);
    
    // Join game room
    socket.join(session.gameId);
    
    // Send current game state
    const gameState = {
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
      allGuesses: [
        ...Object.values(game.players).flatMap(p => 
          p.guesses?.map(g => ({ ...g, playerId: p.id })) || []
        )
      ].sort((a, b) => a.turn - b.turn),
      potentialWinner: game.potentialWinner,
      isDraw: game.isDraw
    };
    
    socket.emit('sessionReconnected', gameState);
    
    // Notify opponent that player reconnected
    const opponentId = Object.keys(game.players).find(id => id !== socket.id);
    if (opponentId && playerSockets.has(game.players[opponentId].socketId)) {
      socket.to(session.gameId).emit('opponentReconnected', {
        playerName: session.playerName
      });
    }
    
    console.log(`Player ${session.playerName} reconnected to game ${session.gameId}`);
  });
  
  socket.on('joinLobby', (playerName) => {
    // Check if name is already in use
    const normalizedName = playerName.trim().toLowerCase();
    const isNameTaken = Array.from(usedNames.values()).includes(normalizedName);
    if (isNameTaken) {
      socket.emit('nameError', 'This name is already in use. Please choose a different name.');
      return;
    }
    
    const player = {
      id: socket.id,
      name: playerName,
      socketId: socket.id
    };
    
    playerSockets.set(socket.id, socket);
    usedNames.set(socket.id, normalizedName);
    
    // Create session for this player
    const sessionId = generateSessionId();
    const session = {
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
      
      // Update sessions with game ID
      const waitingSession = Array.from(playerSessions.values()).find(s => s.playerId === waitingPlayer.id);
      const playerSession = Array.from(playerSessions.values()).find(s => s.playerId === player.id);
      if (waitingSession) waitingSession.gameId = game.id;
      if (playerSession) playerSession.gameId = game.id;
      
      // Join both players to game room
      const waitingSocket = playerSockets.get(waitingPlayer.id);
      waitingSocket.join(game.id);
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
    const opponentId = Object.keys(game.players).find(id => id !== socket.id);
    const opponent = game.players[opponentId];
    const currentPlayer = game.players[socket.id];
    
    // Calculate feedback
    const feedback = calculateFeedback(guess, opponent.number);
    
    // Add guess to history
    const guessData = {
      guess,
      feedback,
      player: currentPlayer.name,
      turn: currentPlayer.guesses.length + 1
    };
    
    currentPlayer.guesses.push(guessData);
    
    // Check for win
    const isWin = feedback.correctPosition === 5;
    
    if (isWin) {
      // Mark this player as having won, but don't end the game yet
      game.players[socket.id].hasWon = true;
      
      // Check if opponent has already made their guess this round
      const opponentHasGuessed = opponent.guesses.length >= currentPlayer.guesses.length;
      
      if (opponentHasGuessed) {
        // Check if opponent also won (draw condition)
        if (opponent.hasWon) {
          // Both players won - it's a draw
          game.gameEnded = true;
          game.winner = null; // null indicates draw
          game.isDraw = true;
          
          io.to(gameId).emit('gameEnded', {
            winner: null,
            isDraw: true,
            winnerNumber: null,
            players: Object.values(game.players).map(p => ({ 
              id: p.id, 
              name: p.name, 
              number: p.number,
              guesses: p.guesses,
              gamesWon: p.gamesWon,
              hasWon: p.hasWon || false
            }))
          });
        } else {
          // Only current player won
          game.gameEnded = true;
          game.winner = currentPlayer.name;
          game.players[socket.id].gamesWon++;
          
          io.to(gameId).emit('gameEnded', {
            winner: currentPlayer.name,
            winnerNumber: opponent.number,
            players: Object.values(game.players).map(p => ({ 
              id: p.id, 
              name: p.name, 
              number: p.number,
              guesses: p.guesses,
              gamesWon: p.gamesWon,
              hasWon: p.hasWon || false
            }))
          });
        }
      } else {
        // Give opponent a chance to guess
        game.potentialWinner = socket.id;
        game.currentTurn = opponentId;
        
        io.to(gameId).emit('playerWonButGameContinues', {
          winner: currentPlayer.name,
          currentTurn: game.currentTurn,
          allGuesses: [
            ...game.players[socket.id].guesses.map(g => ({ ...g, playerId: socket.id })),
            ...game.players[opponentId].guesses.map(g => ({ ...g, playerId: opponentId }))
          ].sort((a, b) => a.turn - b.turn)
        });
      }
    } else {
      // Check if opponent has already won
      if (game.potentialWinner && game.potentialWinner !== socket.id) {
        // Opponent won and this player didn't guess correctly
        game.gameEnded = true;
        game.winner = game.players[game.potentialWinner].name;
        game.players[game.potentialWinner].gamesWon++;
        
        io.to(gameId).emit('gameEnded', {
          winner: game.players[game.potentialWinner].name,
          winnerNumber: currentPlayer.number,
          players: Object.values(game.players).map(p => ({ 
            id: p.id, 
            name: p.name, 
            number: p.number,
            guesses: p.guesses,
            gamesWon: p.gamesWon,
            hasWon: p.hasWon || false
          }))
        });
      } else {
        // Switch turns
        game.currentTurn = opponentId;
      
        io.to(gameId).emit('guessMade', {
          guess: guessData,
          currentTurn: game.currentTurn,
          allGuesses: [
            ...game.players[socket.id].guesses.map(g => ({ ...g, playerId: socket.id })),
            ...game.players[opponentId].guesses.map(g => ({ ...g, playerId: opponentId }))
          ].sort((a, b) => a.turn - b.turn)
        });
      }
    }
  });
  
  socket.on('playAgain', ({ gameId }) => {
    const game = activeGames.get(gameId);
    if (!game) return;
    
    // Reset game state
    Object.keys(game.players).forEach(playerId => {
      game.players[playerId].number = null;
      game.players[playerId].ready = false;
      game.players[playerId].guesses = [];
      game.players[playerId].hasWon = false;
    });
    
    // Alternate first player
    const playerIds = Object.keys(game.players);
    game.currentTurn = game.firstPlayer === playerIds[0] ? playerIds[1] : playerIds[0];
    game.firstPlayer = game.currentTurn;
    game.gameStarted = false;
    game.gameEnded = false;
    game.winner = null;
    game.potentialWinner = null;
    game.gameNumber++;
    
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
  
  socket.on('disconnect', () => {
    console.log('Player disconnected:', socket.id);
    
    const sessionId = sessionsBySocket.get(socket.id);
    const session = sessionId ? playerSessions.get(sessionId) : null;
    
    if (session && session.gameId) {
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
    cleanupPlayerName(socket.id);
    sessionsBySocket.delete(socket.id);
    playerSockets.delete(socket.id);
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
    
    // Reset game state for rematch
    Object.keys(game.players).forEach(playerId => {
      game.players[playerId].number = null;
      game.players[playerId].ready = false;
      game.players[playerId].guesses = [];
      game.players[playerId].hasWon = false;
    });
    
    const playerIds = Object.keys(game.players);
    game.currentTurn = game.firstPlayer === playerIds[0] ? playerIds[1] : playerIds[0];
    game.firstPlayer = game.currentTurn;
    game.gameStarted = false;
    game.gameEnded = false;
    game.winner = null;
    game.potentialWinner = null;
    game.gameNumber++;
    
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
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});