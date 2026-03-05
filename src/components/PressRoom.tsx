import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, X, Video, MessageSquare, Send, User, Award, TrendingUp, Activity } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { Player, InterviewSession } from '../types/index';

interface PressRoomProps {
  isOpen: boolean;
  onClose: () => void;
  clip: {
    id: string;
    label: string;
    time: string;
    player?: Player;
    metrics?: any;
  };
  onInterviewComplete: (session: InterviewSession) => void;
}

export default function PressRoom({ isOpen, onClose, clip, onInterviewComplete }: PressRoomProps) {
  const [step, setStep] = useState<'INTRO' | 'QUESTION' | 'ANSWERING' | 'PROCESSING' | 'COMPLETE'>('INTRO');
  const [question, setQuestion] = useState<string>("");
  const [answer, setAnswer] = useState<string>("");
  const [isListening, setIsListening] = useState(false);
  const [article, setArticle] = useState<{ headline: string; body: string } | null>(null);

  // Initialize Gemini
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

  useEffect(() => {
    if (isOpen && step === 'INTRO') {
      generateQuestion();
    }
  }, [isOpen]);

  const generateQuestion = async () => {
    setStep('PROCESSING');
    try {
      const prompt = `
        You are Presse-Toni, a top-tier sports journalist for Red Bulletin and The Athletic. 
        You are interviewing the Head Coach of RB Leipzig about a specific match event.
        
        Context:
        - Event: ${clip.label} at ${clip.time}
        - Player Involved: ${clip.player?.name || 'Unknown Player'}
        - Player Readiness: ${clip.player?.readiness_score || 85}%
        - Heart Rate: ${clip.metrics?.heart_rate || 160} bpm
        
        Task:
        Generate a single, tough, investigative question for the coach.
        - If Readiness is low (<70%), ask about the medical risk of playing him.
        - If it's a tactical event (Turnover, Gap), ask about the system failure.
        - Tone: Professional, direct, demanding.
        - Keep it under 30 words.
      `;

      const result = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: prompt
      });
      setQuestion(result.text || "Coach, can you explain this scene?");
      setStep('QUESTION');
    } catch (error) {
      console.error("AI Error:", error);
      setQuestion("Coach, can you explain what happened in this scene?");
      setStep('QUESTION');
    }
  };

  const handleAnswer = async () => {
    if (!answer.trim()) return;
    
    setStep('PROCESSING');
    try {
      const prompt = `
        You are an editor for The Athletic. 
        Turn this raw quote from a coach into a polished, professional journalism piece.
        
        Question: "${question}"
        Coach's Raw Answer: "${answer}"
        
        Output JSON:
        {
          "headline": "A punchy, dramatic headline (max 8 words)",
          "body": "A 2-paragraph article summary incorporating the quote naturally."
        }
      `;

      const result = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: prompt
      });
      const text = result.text || "{}";
      // Clean up markdown code blocks if present
      const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const data = JSON.parse(jsonStr);
      
      setArticle(data);
      setStep('COMPLETE');
      
      onInterviewComplete({
        id: Date.now().toString(),
        clipId: clip.id,
        playerId: clip.player?.id || 'unknown',
        playerName: clip.player?.name || 'Unknown',
        topic: clip.label,
        questions: [{ id: '1', text: question, tone: 'AGGRESSIVE', context: 'Post-match' }],
        answers: [answer],
        articleHeadline: data.headline,
        articleBody: data.body,
        date: new Date().toISOString()
      });

    } catch (error) {
      console.error("AI Error:", error);
      setStep('COMPLETE'); // Fallback
    }
  };

  const toggleMic = () => {
    if (!isListening) {
      setIsListening(true);
      // Simulate listening delay then "transcription"
      setTimeout(() => {
        setIsListening(false);
        setAnswer(prev => prev + (prev ? " " : "") + "We took a calculated risk. The data showed he was ready for 60 minutes, and in high-pressing situations, you need your best legs. It didn't pay off this time, but I stand by the decision.");
      }, 2000);
    } else {
      setIsListening(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm"
      >
        <div className="w-full max-w-6xl h-[85vh] bg-[#1a1a1a] rounded-2xl overflow-hidden shadow-2xl flex relative border border-white/10">
          
          {/* Close Button */}
          <button onClick={onClose} className="absolute top-4 right-4 z-50 p-2 bg-black/50 rounded-full text-white hover:bg-white/20">
            <X size={24} />
          </button>

          {/* LEFT: The Press Room (Visuals) */}
          <div className="w-2/3 relative bg-[#111] flex flex-col items-center justify-end overflow-hidden">
            
            {/* Dynamic Sponsor Wall Background */}
            <div className="absolute inset-0 opacity-30 grid grid-cols-4 gap-8 p-8 pointer-events-none">
              {Array.from({ length: 24 }).map((_, i) => (
                <div key={i} className="flex items-center justify-center">
                  <div className="text-white/20 font-black text-2xl rotate-[-15deg] uppercase tracking-tighter">
                    {i % 3 === 0 ? 'RED BULL' : i % 3 === 1 ? 'NIKE' : 'STARK'}
                  </div>
                </div>
              ))}
            </div>

            {/* Floating Highlight Window */}
            <motion.div 
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="absolute top-8 left-8 w-80 aspect-video bg-black rounded-lg border-2 border-[#E21B4D] shadow-2xl overflow-hidden z-10"
            >
              <div className="absolute top-2 left-2 bg-[#E21B4D] text-white text-[10px] font-bold px-2 py-1 rounded">
                REPLAY: {clip.time}
              </div>
              <video 
                src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4" 
                className="w-full h-full object-cover opacity-80"
                autoPlay 
                loop 
                muted 
              />
            </motion.div>

            {/* Presse-Toni Avatar */}
            <div className="relative z-20 mb-[-20px]">
               {/* Placeholder for Avatar - could be an image */}
               <div className="w-64 h-64 bg-gradient-to-b from-slate-700 to-slate-900 rounded-full border-4 border-white/10 flex items-center justify-center shadow-2xl">
                  <User size={120} className="text-slate-400" />
               </div>
               <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white text-black px-4 py-1 rounded-full font-bold text-sm shadow-lg whitespace-nowrap">
                 PRESSE-TONI <span className="text-[#E21B4D]">LIVE</span>
               </div>
            </div>

            {/* Desk / Foreground */}
            <div className="w-full h-32 bg-gradient-to-b from-[#222] to-[#000] relative z-30 flex items-end justify-center pb-8 border-t border-white/5">
              <div className="flex gap-12 items-end">
                <div className="text-center">
                  <div className="w-12 h-16 bg-blue-400/20 rounded-lg border border-white/10 mx-auto mb-2 backdrop-blur-md" />
                  <span className="text-[10px] text-slate-500 uppercase">Water</span>
                </div>
                <div className="text-center">
                  <div className={`w-8 h-20 rounded-full mx-auto mb-2 flex items-center justify-center transition-all ${isListening ? 'bg-red-500 shadow-[0_0_20px_rgba(220,38,38,0.6)]' : 'bg-slate-800'}`}>
                    <Mic size={16} className="text-white" />
                  </div>
                  <span className="text-[10px] text-slate-500 uppercase">Mic Feed</span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Interaction Panel */}
          <div className="w-1/3 bg-[#0a0a0a] border-l border-white/10 p-8 flex flex-col">
            <div className="mb-8">
              <h2 className="text-xl font-black italic tracking-tighter text-white mb-1">PRESS<span className="text-[#E21B4D]">ROOM</span></h2>
              <p className="text-xs text-slate-500 font-mono">EXCLUSIVE INTERVIEW</p>
            </div>

            <div className="flex-1 flex flex-col gap-6">
              {/* Chat History / Status */}
              <div className="flex-1 overflow-y-auto space-y-6 pr-2">
                {step === 'PROCESSING' && (
                  <div className="flex items-center gap-3 text-slate-400 animate-pulse">
                    <Activity size={16} />
                    <span className="text-sm font-mono">Presse-Toni is thinking...</span>
                  </div>
                )}

                {(step === 'QUESTION' || step === 'ANSWERING' || step === 'COMPLETE') && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/5 p-4 rounded-xl border border-white/10"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center">
                        <User size={12} className="text-white" />
                      </div>
                      <span className="text-xs font-bold text-[#E21B4D]">PRESSE-TONI</span>
                    </div>
                    <p className="text-lg font-serif text-white leading-relaxed">"{question}"</p>
                  </motion.div>
                )}

                {step === 'COMPLETE' && article && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-[#E21B4D] text-white p-6 rounded-xl shadow-lg"
                  >
                    <div className="flex items-center gap-2 mb-4 opacity-80">
                      <Award size={16} />
                      <span className="text-xs font-bold uppercase tracking-widest">Journal Entry Created</span>
                    </div>
                    <h3 className="text-2xl font-black italic leading-none mb-4">{article.headline}</h3>
                    <p className="text-sm opacity-90 leading-relaxed font-serif">{article.body}</p>
                  </motion.div>
                )}
              </div>

              {/* Input Area */}
              {step !== 'COMPLETE' && step !== 'PROCESSING' && (
                <div className="mt-auto">
                  <div className="relative">
                    <textarea
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      placeholder={isListening ? "Listening..." : "Type your answer or use the mic..."}
                      className="w-full bg-[#111] border border-white/10 rounded-xl p-4 pr-12 text-white placeholder-slate-600 focus:outline-none focus:border-[#E21B4D] min-h-[100px] resize-none font-sans"
                      disabled={step === 'INTRO'}
                    />
                    <button 
                      onClick={toggleMic}
                      className={`absolute top-3 right-3 p-2 rounded-lg transition-colors ${isListening ? 'bg-red-500/20 text-red-500' : 'text-slate-500 hover:text-white'}`}
                    >
                      <Mic size={18} />
                    </button>
                  </div>
                  
                  <button 
                    onClick={handleAnswer}
                    disabled={!answer.trim() || step === 'INTRO'}
                    className="w-full mt-4 bg-white text-black font-bold py-4 rounded-xl hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
                  >
                    <span>PUBLISH STATEMENT</span>
                    <Send size={16} />
                  </button>
                </div>
              )}
              
              {step === 'COMPLETE' && (
                <button 
                  onClick={onClose}
                  className="w-full bg-white/10 text-white font-bold py-4 rounded-xl hover:bg-white/20 flex items-center justify-center gap-2 transition-all"
                >
                  <span>RETURN TO LAB</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
