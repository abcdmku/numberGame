import type { Player, Game, GuessData } from '../types/game.js';

// Generate a unique session ID
export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Generate a unique game ID
export function generateGameId(): string {
  return `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Generate a random 5-digit number with unique digits
export function generateRandomNumber(): string {
  const digits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  const result: number[] = [];
  
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

// Validate a 5-digit number with unique digits
export function validateNumber(number: string): boolean {
  if (!/^\d{5}$/.test(number)) return false;
  
  const digits = number.split('');
  const uniqueDigits = new Set(digits);
  return uniqueDigits.size === 5;
}

// Calculate feedback for a guess against a target number
export function calculateFeedback(guess: string, target: string) {
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
  const guessCount: Record<string, number> = {};
  const targetCount: Record<string, number> = {};
  
  for (const digit of guessDigits) {
    guessCount[digit] = (guessCount[digit] || 0) + 1;
  }
  
  for (const digit of targetDigits) {
    targetCount[digit] = (targetCount[digit] || 0) + 1;
  }
  
  for (const digit in guessCount) {
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

// Create a new game with two players
export function createGame(player1: Omit<Player, 'sessionId' | 'number' | 'ready' | 'guesses' | 'gamesWon'>, player2: Omit<Player, 'sessionId' | 'number' | 'ready' | 'guesses' | 'gamesWon'>): Game {
  const gameId = generateGameId();
  const player1SessionId = generateSessionId();
  const player2SessionId = generateSessionId();
  
  const game: Game = {
    id: gameId,
    players: {
      [player1.id]: {
        ...player1,
        sessionId: player1SessionId,
        number: undefined,
        ready: false,
        guesses: [],
        gamesWon: 0
      },
      [player2.id]: {
        ...player2,
        sessionId: player2SessionId,
        number: undefined,
        ready: false,
        guesses: [],
        gamesWon: 0
      }
    },
    currentTurn: Math.random() < 0.5 ? player1.id : player2.id,
    firstPlayer: '',
    gameStarted: false,
    gameEnded: false,
    winner: null,
    gameNumber: 1
  };
  
  game.firstPlayer = game.currentTurn;
  return game;
}

// Reset game state for a new round
export function resetGameForNewRound(game: Game): void {
  Object.keys(game.players).forEach(playerId => {
    game.players[playerId].number = undefined;
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
  game.potentialWinner = undefined;
  game.isDraw = false;
  game.gameNumber++;
}

// Get all guesses sorted by turn
export function getAllGuessesSorted(game: Game): GuessData[] {
  return Object.values(game.players)
    .flatMap(p => p.guesses?.map(g => ({ ...g, playerId: p.id })) || [])
    .sort((a, b) => a.turn - b.turn);
}