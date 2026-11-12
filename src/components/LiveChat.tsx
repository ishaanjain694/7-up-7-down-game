import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { ChatMessage, EmojiReaction } from '../types.ts';
import { MessageSquare, Send, X, Smile, Flame, Sparkles } from 'lucide-react';
import { sound } from '../sound.ts';

interface LiveChatProps {
  messages: ChatMessage[];
  reactions: EmojiReaction[];
  onSendMessage: (text: string) => void;
  onSendEmoji: (emoji: string) => void;
}

const PRESET_EMOJIS = ['🔥', '🍀', '🎲', '💰', '🚀', '😱', '👑', '🎉', '😭', '❤️'];

const QUICK_SHOUTS = [
  'Lucky 7 incoming! 🍀',
  'All in on 7 Up! 🚀',
  '7 Down never fails! 🟢',
  'Roll em host! 🎲',
  'Double down! 🔥',
  'Rigged haha! 😂',
  'Big win let’s go! 💰',
];

export const LiveChat: React.FC<LiveChatProps> = ({
  messages,
  reactions,
  onSendMessage,
  onSendEmoji,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [text, setText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    sound.playPop();
    onSendMessage(text.trim());
    setText('');
  };

  const handleTriggerEmoji = (emoji: string) => {
    sound.playPop();
    onSendEmoji(emoji);
  };

  const handleQuickShout = (shout: string) => {
    sound.playPop();
    onSendMessage(shout);
  };

  return (
    <>
      {/* 1. Floating Emoji Burst Canvas (Appears on top of the entire screen) */}
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
        <AnimatePresence>
          {reactions.map((r) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 1, y: '85vh', x: `${r.x}vw`, scale: 0.6 }}
              animate={{
                opacity: [1, 1, 0.9, 0],
                y: '-10vh',
                scale: [0.8, 1.4, 1.2, 0.9],
                rotate: [0, -15, 15, -5],
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 3.5, ease: 'easeOut' }}
              className="absolute text-4xl sm:text-5xl drop-shadow-2xl flex flex-col items-center"
            >
              <span>{r.emoji}</span>
              <span className="text-[10px] font-bold bg-black/70 text-amber-300 px-1.5 py-0.5 rounded-full border border-amber-400/30 -mt-1 shadow">
                {r.senderName}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* 2. Floating Chat Toggle Button & Quick Emoji Bar */}
      <div className="fixed bottom-3 right-3 sm:bottom-5 sm:right-5 z-40 flex items-center gap-2">
        {/* Quick Emoji Reaction Pill */}
        <div className="hidden sm:flex items-center gap-1 bg-black/80 border border-amber-500/30 p-1.5 rounded-full shadow-2xl backdrop-blur-md">
          {PRESET_EMOJIS.slice(0, 5).map((emoji) => (
            <motion.button
              key={emoji}
              whileHover={{ scale: 1.3 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => handleTriggerEmoji(emoji)}
              className="w-8 h-8 flex items-center justify-center text-lg hover:bg-white/10 rounded-full transition-colors"
              title={`Send ${emoji} reaction`}
            >
              {emoji}
            </motion.button>
          ))}
        </div>

        {/* Chat Drawer Trigger */}
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          onClick={() => {
            sound.playPop();
            setIsOpen(!isOpen);
          }}
          className="relative p-3.5 rounded-full bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-400 text-amber-950 font-black shadow-[0_8px_20px_rgba(245,158,11,0.5)] border-2 border-yellow-200 transition-all"
          title="Open Room Chat & Reactions"
        >
          <MessageSquare className="w-5 h-5 fill-current" />
          {messages.length > 0 && !isOpen && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center border border-white">
              !
            </span>
          )}
        </motion.button>
      </div>

      {/* 3. Sliding Chat Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            className="fixed bottom-18 right-3 sm:bottom-20 sm:right-5 w-[calc(100vw-24px)] sm:w-96 max-h-[520px] h-[70vh] bg-neutral-900/95 border border-amber-500/30 rounded-3xl shadow-2xl backdrop-blur-2xl flex flex-col z-40 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-black/40">
              <div className="flex items-center gap-2">
                <span className="text-lg">💬</span>
                <span className="font-bold text-sm text-white">Table Chat & Vibes</span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Emoji Bar inside Drawer */}
            <div className="flex items-center justify-between gap-1 px-3 py-2 border-b border-white/5 bg-black/20 overflow-x-auto scrollbar-none">
              {PRESET_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleTriggerEmoji(emoji)}
                  className="w-7 h-7 flex-shrink-0 flex items-center justify-center text-lg hover:scale-125 transition-transform"
                >
                  {emoji}
                </button>
              ))}
            </div>

            {/* Quick Shoutouts */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 border-b border-white/5 overflow-x-auto scrollbar-none text-[11px]">
              {QUICK_SHOUTS.map((shout) => (
                <button
                  key={shout}
                  onClick={() => handleQuickShout(shout)}
                  className="flex-shrink-0 px-2 py-0.5 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-white/10 hover:border-amber-400/40 transition-colors"
                >
                  {shout}
                </button>
              ))}
            </div>

            {/* Messages Feed */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
              {messages.length === 0 ? (
                <div className="text-center text-xs text-neutral-500 mt-10">
                  No messages yet. Say hi to your friends!
                </div>
              ) : (
                messages.map((m) => {
                  if (m.isSystem) {
                    return (
                      <div
                        key={m.id}
                        className="text-center my-1 text-[11px] text-amber-300/80 font-medium bg-amber-500/10 py-1 px-2.5 rounded-lg border border-amber-500/20"
                      >
                        {m.avatar} {m.text}
                      </div>
                    );
                  }

                  return (
                    <div key={m.id} className="flex items-start gap-2">
                      <div className="w-7 h-7 rounded-full bg-neutral-800 border border-white/20 flex items-center justify-center text-sm flex-shrink-0 shadow">
                        {m.avatar}
                      </div>
                      <div className="flex flex-col max-w-[80%]">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-bold text-amber-300">
                            {m.name}
                          </span>
                          <span className="text-[9px] text-neutral-500">
                            {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div className="text-xs text-neutral-200 bg-neutral-800/80 border border-white/10 px-3 py-1.5 rounded-2xl rounded-tl-sm mt-0.5 break-words">
                          {m.text}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <form onSubmit={handleSend} className="p-3 border-t border-white/10 bg-black/40 flex items-center gap-2">
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Send message to table..."
                maxLength={120}
                className="flex-1 bg-neutral-800 border border-white/15 focus:border-amber-400 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 outline-none transition-colors"
              />
              <button
                type="submit"
                disabled={!text.trim()}
                className="p-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-amber-950 font-bold transition-all shadow-md"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
