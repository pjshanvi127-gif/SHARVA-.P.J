/**
 * ChatBox - In-Game Chat Feed & Command Console
 */

import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types/game';
import { Send, Terminal } from 'lucide-react';
import { sounds } from '../audio/soundEngine';

interface ChatBoxProps {
  isOpen: boolean;
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  onClose: () => void;
}

export const ChatBox: React.FC<ChatBoxProps> = ({
  isOpen,
  messages,
  onSendMessage,
  onClose,
}) => {
  const [inputText, setInputText] = useState('');
  const logEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll chat to latest
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputText.trim();
    if (trimmed) {
      sounds.playClickSound();
      onSendMessage(trimmed);
      setInputText('');
    }
  };

  return (
    <div
      className={`absolute left-3 bottom-24 sm:left-6 z-20 w-80 sm:w-96 transition-all duration-200 font-mono ${
        isOpen ? 'pointer-events-auto opacity-100 scale-100' : 'pointer-events-none opacity-85 scale-95'
      }`}
    >
      <div className="bg-stone-950/85 border border-stone-800 rounded-xl overflow-hidden shadow-2xl flex flex-col">
        {/* Chat Feed */}
        <div className="p-3 max-h-48 sm:max-h-56 overflow-y-auto space-y-1.5 text-xs text-stone-200">
          {messages.map((msg) => (
            <div key={msg.id} className="leading-snug break-words">
              <span
                className="font-bold mr-1.5"
                style={{ color: msg.senderColor || '#38bdf8' }}
              >
                [{msg.sender}]:
              </span>
              <span className="text-stone-300">{msg.text}</span>
            </div>
          ))}
          <div ref={logEndRef} />
        </div>

        {/* Input Form (Only interactive when isOpen) */}
        {isOpen && (
          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-1.5 p-2 bg-stone-900 border-t border-stone-800"
          >
            <Terminal className="w-4 h-4 text-stone-400 ml-1 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Chat or type /help for commands..."
              className="flex-1 bg-transparent text-white text-xs px-2 py-1 outline-none font-mono placeholder:text-stone-500"
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  onClose();
                }
              }}
            />
            <button
              type="submit"
              className="p-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-lg transition cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
