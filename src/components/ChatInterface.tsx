import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Briefcase, Activity, Mic, MicOff } from 'lucide-react';
import { Persona } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface ChatInterfaceProps {
  activePersona: Persona;
  onPersonaChange: (p: Persona) => void;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  persona?: Persona;
}

export default function ChatInterface({ activePersona, onPersonaChange }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'assistant', text: 'Ready to analyze. What is the situation?', persona: activePersona }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Web Speech API Ref
  const recognitionRef = useRef<any>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize Speech Recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US'; // Or 'de-DE' based on preference

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition not supported in this browser.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input, persona: activePersona })
      });
      const data = await res.json();
      
      const aiMsg: Message = { 
        id: (Date.now() + 1).toString(), 
        role: 'assistant', 
        text: data.response || "Communication error.",
        persona: activePersona
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const personas: {id: Persona, label: string, icon: React.ReactNode, color: string}[] = [
    { id: 'TRAINER', label: 'Trainer', icon: <User size={16} />, color: 'bg-[#E21B4D]' },
    { id: 'MANAGER', label: 'Manager', icon: <Briefcase size={16} />, color: 'bg-[#FFCC00]' },
    { id: 'DOCTOR', label: 'Doctor', icon: <Activity size={16} />, color: 'bg-[#00A859]' }, // Green for medical
  ];

  return (
    <div className="flex flex-col h-full bg-[#061A40] border-l border-white/10">
      {/* Persona Selector */}
      <div className="p-4 border-b border-white/10 bg-[#041230]">
        <div className="flex gap-2 p-1 bg-[#001240] rounded-lg border border-white/5">
          {personas.map(p => (
            <button
              key={p.id}
              onClick={() => onPersonaChange(p.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-2 rounded-md text-[10px] font-bold uppercase tracking-wide transition-all ${
                activePersona === p.id 
                  ? `${p.color} text-[#001240] shadow-lg` 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              {p.icon}
              <span className="hidden xl:inline">{p.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#061A40]">
        {messages.map((msg) => (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[85%] rounded-2xl p-4 ${
              msg.role === 'user' 
                ? 'bg-white text-[#001240] rounded-br-none shadow-lg' 
                : 'bg-[#001240] text-slate-200 rounded-bl-none border border-white/10'
            }`}>
              {msg.role === 'assistant' && (
                <div className={`text-[10px] font-bold uppercase mb-1 ${
                  msg.persona === 'TRAINER' ? 'text-[#E21B4D]' :
                  msg.persona === 'MANAGER' ? 'text-[#FFCC00]' : 'text-[#00A859]'
                }`}>
                  {personas.find(p => p.id === msg.persona)?.label || 'AI'}
                </div>
              )}
              <div className="text-sm leading-relaxed whitespace-pre-wrap font-medium">{msg.text}</div>
            </div>
          </motion.div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-[#001240] rounded-2xl p-4 rounded-bl-none border border-white/10 flex gap-2 items-center">
               <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{animationDelay: '0ms'}} />
               <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{animationDelay: '150ms'}} />
               <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{animationDelay: '300ms'}} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-white/10 bg-[#041230]">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={`Message ${personas.find(p => p.id === activePersona)?.label}...`}
            className="w-full bg-[#001240] text-white placeholder-slate-500 border border-white/10 rounded-xl py-3 pl-4 pr-12 focus:outline-none focus:border-[#E21B4D] focus:ring-1 focus:ring-[#E21B4D] transition-all font-sans text-sm"
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="absolute right-2 top-2 p-1.5 bg-[#E21B4D] text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={16} />
          </button>
        </div>
        <div className="mt-2 flex justify-center">
           <button 
             onClick={toggleListening}
             className={`text-[10px] uppercase font-bold tracking-wider flex items-center gap-1 transition-colors px-3 py-1 rounded-full ${
               isListening 
                 ? 'bg-red-500/20 text-[#E21B4D] animate-pulse' 
                 : 'text-slate-500 hover:text-white'
             }`}
           >
             {isListening ? <MicOff size={10} /> : <Mic size={10} />}
             {isListening ? 'Listening...' : 'Voice Input'}
           </button>
        </div>
      </div>
    </div>
  );
}
