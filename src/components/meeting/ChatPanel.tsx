'use client';

import { useState, useRef } from 'react';
import { Send } from 'lucide-react';

interface Message {
  senderName: string;
  senderId: string;
  message: string;
  timestamp: string;
}

interface ChatPanelProps {
  messages: Message[];
  currentUserId: string;
  onSend: (msg: string) => void;
}

export default function ChatPanel({ messages, currentUserId, onSend }: ChatPanelProps) {
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    onSend(input.trim());
    setInput('');
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  return (
    <div className="flex flex-col h-full bg-neutral-900 border-l border-neutral-800">
      <div className="p-4 border-b border-neutral-800 font-semibold text-sm text-white">
        Live Chat
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
        {messages.length === 0 ? (
          <p className="text-neutral-500 text-xs text-center py-8">No messages yet. Say hello! 👋</p>
        ) : messages.map((msg, i) => {
          const isMe = msg.senderId === currentUserId;
          return (
            <div key={i} className={`flex flex-col gap-1 ${isMe ? 'items-end' : 'items-start'}`}>
              {!isMe && (
                <span className="text-xs text-neutral-400 ml-1">{msg.senderName}</span>
              )}
              <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm ${
                isMe
                  ? 'bg-blue-600 text-white rounded-br-sm'
                  : 'bg-neutral-800 text-neutral-100 rounded-bl-sm'
              }`}>
                {msg.message}
              </div>
              <span className="text-xs text-neutral-600 mx-1">
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="p-3 border-t border-neutral-800 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 bg-neutral-800 border border-neutral-700 text-sm text-white px-3 py-2 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder:text-neutral-600"
        />
        <button type="submit"
          className="bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-xl transition-all">
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
