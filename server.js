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
const usedNames = new Set();

// Utility functions
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
  const game = {
    id: gameId,
    players: {
      [player1.id]: {
        ...player1,
        number: null,
        ready: false,
        guesses: [],
        gamesWon: 0
      },
      [player2.id]: {
        ...player2,
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
  
  socket.on('joinLobby', (playerName) => {
    // Check if name is already in use
    const normalizedName = playerName.trim().toLowerCase();
    if (usedNames.has(normalizedName)) {
      socket.emit('nameError', 'This name is already in use. Please choose a different name.');
      return;
    }
    
    const player = {
      id: socket.id,
      name: playerName,
      socketId: socket.id
    };
    
    playerSockets.set(socket.id, socket);
    usedNames.add(normalizedName);
    
    // Check if there's a waiting player
    if (waitingPlayers.size > 0) {
      const waitingPlayer = Array.from(waitingPlayers.values())[0];
      waitingPlayers.delete(waitingPlayer.id);
      
      // Create game
      const game = createGame(waitingPlayer, player);
      
      // Join both players to game room
      const waitingSocket = playerSockets.get(waitingPlayer.id);
      waitingSocket.join(game.id);
      socket.join(game.id);
      
      // Notify both players
      io.to(game.id).emit('gameFound', {
        gameId: game.id,
        players: Object.values(game.players),
        currentTurn: game.currentTurn
      });
    } else {
      // Add to waiting list
      waitingPlayers.set(socket.id, player);
      socket.emit('waitingForPlayer');
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
  
  socket.on('generateNumber', () => {
    const randomNumber = generateRandomNumber();
    socket.emit('numberGenerated', randomNumber);
  });
  
  socket.on('disconnect', () => {
    console.log('Player disconnected:', socket.id);
    
    // Clean up player name from used names
    cleanupPlayerName(socket.id);
    
    // Remove from waiting players
    waitingPlayers.delete(socket.id);
    
    playerGames.forEach(game => {
      const opponentId = Object.keys(game.players).find(id => id !== socket.id);
      if (opponentId) {
        io.to(opponentId).emit('opponentDisconnected');
      }
      activeGames.delete(game.id);
    });
    
    playerSockets.delete(socket.id);
  });
  
  // Helper function to clean up player names
  function cleanupPlayerName(socketId) {
    // Check active games
    const playerGames = Array.from(activeGames.values()).filter(game => 
      game.players[socketId]
    );
    
    playerGames.forEach(game => {
      const player = game.players[socketId];
      if (player && player.name) {
        const normalizedName = player.name.trim().toLowerCase();
        usedNames.delete(normalizedName);
        console.log(`Removed name "${player.name}" from used names (game disconnect)`);
      }
    });
    
    // Check waiting players
    const waitingPlayer = waitingPlayers.get(socketId);
    if (waitingPlayer && waitingPlayer.name) {
      const normalizedName = waitingPlayer.name.trim().toLowerCase();
      usedNames.delete(normalizedName);
      console.log(`Removed name "${waitingPlayer.name}" from used names (waiting disconnect)`);
    }
  }
  
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