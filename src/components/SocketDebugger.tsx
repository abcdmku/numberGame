import React, { useState, useEffect } from 'react';
import { Bug, X, Minimize2, Maximize2, Trash2 } from 'lucide-react';

interface SocketMessage {
  id: string;
  type: 'sent' | 'received';
  event: string;
  data: any;
  timestamp: Date;
}

interface SocketDebuggerProps {
  socket: any;
  inline?: boolean;
}

export const SocketDebugger: React.FC<SocketDebuggerProps> = ({ socket, inline = false }) => {
  const [messages, setMessages] = useState<SocketMessage[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    if (!socket) return;

    const originalEmit = socket.emit.bind(socket);
    socket.emit = function(event: string, ...args: any[]) {
      const messageId = `${Date.now()}-${Math.random()}`;
      setMessages(prev => [...prev.slice(-49), {
        id: messageId,
        type: 'sent',
        event,
        data: args.length === 1 ? args[0] : args,
        timestamp: new Date()
      }]);
      return originalEmit(event, ...args);
    };

    const originalOnevent = socket.onevent;
    socket.onevent = function(packet: any) {
      const messageId = `${Date.now()}-${Math.random()}`;
      setMessages(prev => [...prev.slice(-49), {
        id: messageId,
        type: 'received',
        event: packet.data[0],
        data: packet.data[1],
        timestamp: new Date()
      }]);
      return originalOnevent.call(this, packet);
    };

    return () => {
      socket.emit = originalEmit;
      socket.onevent = originalOnevent;
    };
  }, [socket]);

  const clearMessages = () => setMessages([]);

  const formatData = (data: any) => {
    if (data === undefined) return '';
    try {
      return JSON.stringify(data, null, 2);
    } catch (e) {
      return String(data);
    }
  };

  const formatTime = (timestamp: Date) => {
    return timestamp.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3
    });
  };

  const messagesList = (height: string) => (
    <div className={`${height} overflow-y-auto p-2 space-y-1.5`}>
      {messages.length === 0 ? (
        <div className="text-center text-gray-500 text-sm py-8">No socket messages yet</div>
      ) : (
        messages.map((message) => (
          <div
            key={message.id}
            className={`p-2 rounded text-xs border-l-2 ${
              message.type === 'sent'
                ? 'bg-blue-900/30 border-blue-400'
                : 'bg-green-900/30 border-green-400'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                  message.type === 'sent' ? 'bg-blue-600 text-white' : 'bg-green-600 text-white'
                }`}>
                  {message.type === 'sent' ? '↗' : '↙'}
                </span>
                <span className="font-medium text-white">{message.event}</span>
              </div>
              <span className="text-gray-400 text-xs">{formatTime(message.timestamp)}</span>
            </div>
            {message.data && (
              <pre className="text-gray-300 text-xs overflow-x-auto whitespace-pre-wrap break-words max-h-32 overflow-y-auto bg-gray-800/50 p-2 rounded">
                {formatData(message.data)}
              </pre>
            )}
          </div>
        ))
      )}
    </div>
  );

  const connectionStatus = (
    <div className="p-2 border-t border-gray-700 bg-gray-800 rounded-b-lg">
      <div className="flex items-center gap-2 text-xs">
        <div className={`w-2 h-2 rounded-full ${socket?.connected ? 'bg-green-400' : 'bg-red-400'}`}></div>
        <span className="text-gray-300">{socket?.connected ? 'Connected' : 'Disconnected'}</span>
        {socket?.id && (
          <span className="text-gray-500 ml-auto font-mono">{socket.id.substring(0, 8)}...</span>
        )}
      </div>
    </div>
  );

  if (inline) {
    return (
      <div className="mt-4 pt-3 border-t border-zinc-800/50">
        <button
          onClick={() => setIsVisible(!isVisible)}
          className="flex items-center gap-2 text-xs text-zinc-600 hover:text-zinc-500 transition-colors w-full mb-2"
        >
          <Bug className="w-3 h-3" />
          <span>Socket Debugger ({messages.length})</span>
          {isVisible ? <Minimize2 className="w-3 h-3 ml-auto" /> : <Maximize2 className="w-3 h-3 ml-auto" />}
        </button>
        {isVisible && (
          <div className="bg-gray-900 text-white rounded-lg border border-gray-700">
            <div className="flex items-center justify-between p-2 border-b border-gray-700 bg-gray-800 rounded-t-lg">
              <div className="flex items-center gap-2">
                <Bug className="w-3.5 h-3.5 text-green-400" />
                <span className="text-sm font-medium">Socket Debugger</span>
                <span className="text-xs text-gray-400">({messages.length})</span>
              </div>
              <button onClick={clearMessages} className="p-1 hover:bg-gray-700 rounded" title="Clear messages">
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
            {messagesList('h-64')}
            {connectionStatus}
          </div>
        )}
      </div>
    );
  }

  // Fixed mode (original behavior)
  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 z-50 bg-gray-800 text-white p-3 rounded-full shadow-lg hover:bg-gray-700 transition-colors"
        title="Show Socket Debugger"
      >
        <Bug className="w-5 h-5" />
      </button>
    );
  }

  return (
    <div className={`fixed right-4 bottom-4 z-50 bg-gray-900 text-white rounded-lg shadow-2xl border border-gray-700 ${
      isMinimized ? 'w-80' : 'w-96'
    }`}>
      <div className="flex items-center justify-between p-3 border-b border-gray-700 bg-gray-800 rounded-t-lg">
        <div className="flex items-center gap-2">
          <Bug className="w-4 h-4 text-green-400" />
          <span className="text-sm font-medium">Socket Debugger</span>
          <span className="text-xs text-gray-400">({messages.length})</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={clearMessages} className="p-1 hover:bg-gray-700 rounded" title="Clear messages">
            <Trash2 className="w-3 h-3" />
          </button>
          <button onClick={() => setIsMinimized(!isMinimized)} className="p-1 hover:bg-gray-700 rounded" title={isMinimized ? 'Expand' : 'Minimize'}>
            {isMinimized ? <Maximize2 className="w-3 h-3" /> : <Minimize2 className="w-3 h-3" />}
          </button>
          <button onClick={() => setIsVisible(false)} className="p-1 hover:bg-gray-700 rounded" title="Close debugger">
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>
      {!isMinimized && messagesList('h-80')}
      {connectionStatus}
    </div>
  );
};
