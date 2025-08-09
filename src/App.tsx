import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useSocket } from './hooks/useSocket';
import { Lobby } from './components/Lobby';
import { WaitingRoom } from './components/WaitingRoom';
import { NumberSetup } from './components/NumberSetup';
import { GameBoard } from './components/GameBoard';
import { GameResults } from './components/GameResults';
import { ErrorDisplay } from './components/ErrorDisplay';
import { SocketDebugger } from './components/SocketDebugger';
import { GamePhase } from './types/game';

function App() {
  const {
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
    requestRematch,
    acceptRematch
  } = useSocket();

  const [showReturnConfirm, setShowReturnConfirm] = React.useState(false);

  const handleReturnToLobby = () => {
    if (gamePhase === GamePhase.PLAYING || gamePhase === GamePhase.SETUP) {
      setShowReturnConfirm(true);
    } else {
      resetToLobby();
    }
  };

  const confirmReturnToLobby = () => {
    setShowReturnConfirm(false);
    resetToLobby();
  };

  const cancelReturn = () => {
    setShowReturnConfirm(false);
  };

  const myId = gameState.players.find(p => p.name === playerName)?.id || '';

  // Show reconnecting screen
  if (isReconnecting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 max-w-md shadow-2xl border border-white/20 text-center animate-in fade-in duration-700">
          <div className="relative flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-6 mx-auto">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full opacity-50 animate-ping"></div>
            <div className="relative w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">Reconnecting...</h2>
          <p className="text-blue-100 mb-6">Restoring your game session</p>
          
          {/* Enhanced progress indicators */}
          <div className="space-y-4">
            <div className="flex justify-center space-x-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
            
            <div className="w-full bg-white/10 rounded-full h-1">
              <div className="h-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-pulse" style={{ width: '60%' }}></div>
            </div>
            
            <p className="text-xs text-blue-200">This usually takes a few seconds</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-hidden select-none">
      {/* Screen reader only styles */}
      <style jsx global>{`
        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }
      `}</style>
      
      <ErrorDisplay error={error} onClose={() => setError('')} />
      <SocketDebugger socket={socketRef.current} />
      
      {/* Transition overlay */}
      {isTransitioning && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 flex items-center justify-center">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-white/20">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span className="text-white font-medium">Transitioning...</span>
            </div>
          </div>
        </div>
      )}
      
      {/* Return to Lobby Confirmation Dialog */}
      {showReturnConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 w-full max-w-md shadow-2xl border border-white/20">
            <h3 className="text-xl font-bold text-white mb-4">Leave Game?</h3>
            <p className="text-blue-100 mb-6">
              Are you sure you want to return to the lobby? This will end your current game and disconnect you from your opponent.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={confirmReturnToLobby}
                className="w-full sm:flex-1 bg-red-500/80 backdrop-blur-sm text-white py-3 px-6 rounded-none md:rounded-xl font-semibold hover:bg-red-600/80 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 focus:ring-offset-transparent transition-all duration-200"
              >
                Yes, Leave Game
              </button>
              <button
                onClick={cancelReturn}
                className="w-full sm:flex-1 bg-white/20 backdrop-blur-sm text-white py-3 px-6 rounded-none md:rounded-xl font-semibold hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-transparent transition-all duration-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Return to Lobby Button (shown in game states) */}
      {(gamePhase === GamePhase.SETUP || gamePhase === GamePhase.PLAYING) && (
        <button
          onClick={handleReturnToLobby}
          className="fixed top-4 left-4 z-40 bg-white/10 backdrop-blur-md text-white p-3 rounded-xl hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-transparent transition-all duration-200 flex items-center gap-2"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="hidden sm:inline">Return to Lobby</span>
        </button>
      )}

      <div className={`transition-all duration-300 ${isTransitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
        {gamePhase === GamePhase.LOBBY && (
          <div className="animate-in fade-in duration-500">
            <Lobby onJoin={joinLobby} />
          </div>
        )}
        
        {gamePhase === GamePhase.WAITING && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <button
              onClick={handleReturnToLobby}
              className="fixed top-4 left-4 z-40 bg-white/10 backdrop-blur-md text-white p-3 rounded-xl hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-transparent transition-all duration-200 flex items-center gap-2"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:inline">Return to Lobby</span>
            </button>
            <WaitingRoom 
              playerName={playerName} 
              opponentStatus={opponentStatus}
              onWaitForOpponent={waitForOpponent}
            />
          </div>
        )}
        
        {gamePhase === GamePhase.SETUP && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500">
            <NumberSetup
              players={gameState.players}
              myId={myId}
              onSetNumber={setNumber}
              onGenerateRandom={generateRandomNumber}
              myNumber={myNumber}
              gameNumber={gameState.gameNumber}
             opponentStatus={opponentStatus}
            />
          </div>
        )}
        
        {gamePhase === GamePhase.PLAYING && (
          <div className="animate-in fade-in slide-in-from-left-4 duration-700">
            <GameBoard
              players={gameState.players}
              myId={myId}
              currentTurn={gameState.currentTurn || ''}
              allGuesses={gameState.allGuesses}
              onMakeGuess={makeGuess}
              gameNumber={gameState.gameNumber}
              gameState={gameState}
              opponentStatus={opponentStatus}
              playerName={playerName}
            />
          </div>
        )}
        
        {gamePhase === GamePhase.ENDED && (
          <div className="animate-in fade-in zoom-in-95 duration-700">
            <GameResults
              winner={gameState.winner || ''}
              players={gameState.players}
              myId={myId}
              onPlayAgain={playAgain}
              onReturnToLobby={handleReturnToLobby}
              gameNumber={gameState.gameNumber}
              rematchState={rematchState}
              onRequestRematch={requestRematch}
              onAcceptRematch={acceptRematch}
              onJoinLobby={joinLobby}
              playerName={playerName}
              gameState={gameState}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;