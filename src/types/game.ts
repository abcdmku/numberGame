export interface Player {
  id: string;
  name: string;
  ready?: boolean;
  number?: string;
  guesses?: GuessData[];
  gamesWon?: number;
  hasWon?: boolean;
}

export interface GuessData {
  guess: string;
  feedback: {
    correctPosition: number;
    correctDigitWrongPosition: number;
  };
  player: string;
  turn: number;
  playerId?: string;
}

export interface GameState {
  gameId: string | null;
  players: Player[];
  currentTurn: string | null;
  gameStarted: boolean;
  gameEnded: boolean;
  winner: string | null;
  allGuesses: GuessData[];
  gameNumber: number;
  potentialWinner?: string | null;
  isDraw?: boolean;
}

export enum GamePhase {
  LOBBY = 'lobby',
  WAITING = 'waiting',
  SETUP = 'setup',
  PLAYING = 'playing',
  ENDED = 'ended'
}