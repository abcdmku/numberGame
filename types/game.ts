// Server-side game types
export interface Player {
  id: string;
  name: string;
  socketId: string;
  sessionId: string;
  number?: string;
  ready: boolean;
  guesses: GuessData[];
  gamesWon: number;
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

export interface Game {
  id: string;
  players: Record<string, Player>;
  currentTurn: string;
  firstPlayer: string;
  gameStarted: boolean;
  gameEnded: boolean;
  winner: string | null;
  gameNumber: number;
  potentialWinner?: string;
  isDraw?: boolean;
}

export interface PlayerSession {
  playerId: string;
  gameId: string | null;
  playerName: string;
  socketId: string;
}

export interface DisconnectedPlayer {
  disconnectTime: number;
  gameId: string;
  playerData: Player;
  originalPlayerId: string;
}

export interface GameStateData {
  gameId: string;
  players: Player[];
  currentTurn: string;
  gameStarted: boolean;
  gameEnded: boolean;
  winner: string | null;
  gameNumber: number;
  allGuesses: GuessData[];
  potentialWinner?: string;
  isDraw?: boolean;
}