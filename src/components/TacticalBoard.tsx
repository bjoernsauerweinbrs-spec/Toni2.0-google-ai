import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, Shield, Zap, Mic, Grid, BrainCircuit } from 'lucide-react';
import { TrainerToniAI } from '../services/GeminiService';

interface TacticalBoardProps {
  isActive: boolean;
  onToggleGameMode: () => void;
}

export default function TacticalBoard({ isActive, onToggleGameMode }: TacticalBoardProps) {
  const [showGrid, setShowGrid] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [trainerMessage, setTrainerMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Pitch dimensions and grid
  const pitchWidth = 600;
  const pitchHeight = 400;

  // Formations
  const formation442 = [
    { x: 10, y: 50, role: 'GK' },
    { x: 30, y: 20, role: 'LB' }, { x: 30, y: 40, role: 'CB' }, { x: 30, y: 60, role: 'CB' }, { x: 30, y: 80, role: 'RB' },
    { x: 60, y: 20, role: 'LM' }, { x: 60, y: 40, role: 'CM' }, { x: 60, y: 60, role: 'CM' }, { x: 60, y: 80, role: 'RM' },
    { x: 85, y: 40, role: 'ST' }, { x: 85, y: 60, role: 'ST' },
  ];

  const formation343 = [
    { x: 90, y: 50, role: 'GK' },
    { x: 70, y: 30, role: 'CB' }, { x: 70, y: 50, role: 'CB' }, { x: 70, y: 70, role: 'CB' },
    { x: 50, y: 15, role: 'LWB' }, { x: 50, y: 35, role: 'CM' }, { x: 50, y: 65, role: 'CM' }, { x: 50, y: 85, role: 'RWB' },
    { x: 25, y: 25, role: 'LW' }, { x: 25, y: 50, role: 'ST' }, { x: 25, y: 75, role: 'RW' },
  ];

  const handleVoiceCommand = async () => {
    setIsListening(true);
    // Simulate listening delay
    setTimeout(async () => {
      setIsListening(false);
      setIsProcessing(true);
      
      // Mock user query (in a real app, this comes from STT)
      const mockQuery = "Trainer, wie knacken wir den 3-4-3 Block?";
      
      try {
        const response = await TrainerToniAI.generateVoiceResponse(
          mockQuery, 
          "Opponent is playing 3-4-3 Diamond. We are in 4-4-2 Flat. Score is 2-1 for us. 64th minute."
        );
        setTrainerMessage(response);
      } catch (e) {
        console.error(e);
      } finally {
        setIsProcessing(false);
      }
    }, 2000);
  };

  // Players state
  const [homePlayers, setHomePlayers] = useState(formation442);
  const [awayPlayers, setAwayPlayers] = useState(formation343);

  const handleDragEnd = (index: number, team: 'home' | 'away', info: any) => {
    // Update player position based on drag
    // This is a simple approximation
    const update = (prev: any) => prev.map((p: any, i: number) => {
      if (i === index) {
        return { ...p, x: p.x + info.offset.x / 5, y: p.y + info.offset.y / 5 };
      }
      return p;
    });

    if (team === 'home') setHomePlayers(update);
    else setAwayPlayers(update);
  };

  return (
    <div className="h-full w-full bg-slate-900 text-slate-100 p-6 overflow-y-auto flex flex-col relative">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <Shield className="text-cyan-400" />
            TACTICAL HUB
          </h2>
          <p className="text-slate-400 mt-1 font-mono text-sm">GEOMETRY // SPACE // PRESSING</p>
        </div>
        
        <div className="flex gap-4">
          <button 
            onClick={() => setShowGrid(!showGrid)}
            className={`px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-all ${
              showGrid ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50' : 'bg-slate-800 text-slate-400'
            }`}
          >
            <Grid size={18} />
            {showGrid ? 'GRID: ON' : 'GRID: OFF'}
          </button>

          <button 
            onClick={onToggleGameMode}
            className={`px-6 py-3 rounded-xl font-bold tracking-wider flex items-center gap-2 transition-all ${
              isActive 
                ? 'bg-red-600 text-white shadow-lg shadow-red-900/50 animate-pulse' 
                : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'
            }`}
          >
            <Zap size={18} className={isActive ? "fill-current" : ""} />
            {isActive ? 'MATCH MODE ACTIVE' : 'ACTIVATE MATCH MODE'}
          </button>
        </div>
      </div>

      {/* Trainer-Toni Voice Interface */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center">
        <button
          onClick={handleVoiceCommand}
          disabled={isListening || isProcessing}
          className={`p-4 rounded-full shadow-2xl transition-all transform hover:scale-105 ${
            isListening 
              ? 'bg-red-600 animate-pulse shadow-[0_0_30px_rgba(220,38,38,0.6)]' 
              : isProcessing 
                ? 'bg-amber-500 animate-bounce'
                : 'bg-slate-800 border-2 border-slate-600 hover:border-cyan-400'
          }`}
        >
          {isProcessing ? <BrainCircuit size={24} className="text-black" /> : <Mic size={24} className="text-white" />}
        </button>
        
        <AnimatePresence>
          {trainerMessage && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9 }}
              className="mt-4 bg-black/90 border-l-4 border-[#E21B4D] p-6 rounded-r-xl max-w-lg shadow-2xl backdrop-blur-md"
            >
              <div className="flex justify-between items-start mb-2">
                <span className="text-[#E21B4D] font-black uppercase tracking-widest text-xs">Trainer-Toni Instructions</span>
                <button onClick={() => setTrainerMessage(null)} className="text-slate-500 hover:text-white"><Users size={14}/></button>
              </div>
              <p className="text-xl font-black italic text-white leading-tight">
                "{trainerMessage}"
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center relative">
        <div className="relative w-full max-w-5xl aspect-[3/2] bg-[#0a2e18] border-4 border-slate-800 rounded-xl overflow-hidden shadow-2xl">
          
          {/* 5-Meter Grid System */}
          {showGrid && (
            <div className="absolute inset-0 grid grid-cols-[repeat(20,1fr)] grid-rows-[repeat(13,1fr)] pointer-events-none opacity-20">
              {Array.from({ length: 20 * 13 }).map((_, i) => (
                <div key={i} className="border-[0.5px] border-cyan-400/50" />
              ))}
            </div>
          )}

          {/* Pitch Markings */}
          <div className="absolute inset-4 border-2 border-white/30 rounded-sm">
             {/* Halfway Line */}
             <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-white/30 -translate-x-1/2" />
             {/* Center Circle */}
             <div className="absolute top-1/2 left-1/2 w-32 h-32 border-2 border-white/30 rounded-full -translate-x-1/2 -translate-y-1/2" />
             {/* Penalty Areas */}
             <div className="absolute top-1/4 bottom-1/4 left-0 w-32 border-r-2 border-y-2 border-white/30" />
             <div className="absolute top-1/4 bottom-1/4 right-0 w-32 border-l-2 border-y-2 border-white/30" />
          </div>

          {/* Halbraum-Korridore (Half-Spaces) */}
          {showGrid && (
            <>
              <div className="absolute top-[15%] bottom-[15%] left-0 right-0 bg-cyan-500/5 pointer-events-none" />
              <div className="absolute top-0 bottom-0 left-[20%] w-[20%] bg-red-500/5 pointer-events-none border-x border-dashed border-red-500/20" />
              <div className="absolute top-0 bottom-0 right-[20%] w-[20%] bg-red-500/5 pointer-events-none border-x border-dashed border-red-500/20" />
              
              {/* Zone 14 Highlight */}
              <div className="absolute top-[65%] bottom-[15%] left-[35%] right-[35%] bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
                <span className="text-amber-500/50 font-black text-4xl">14</span>
              </div>
            </>
          )}

          {/* Players */}
          <div className="absolute inset-0 p-8">
            {/* Home Team (Left) - 4-4-2 */}
            {homePlayers.map((p, i) => (
              <motion.div
                key={`home-${i}`}
                drag
                dragMomentum={false}
                onDragEnd={(_, info) => handleDragEnd(i, 'home', info)}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1, left: `${p.x}%`, top: `${p.y}%` }}
                transition={{ duration: 0.5, delay: i * 0.05 }}
                className="absolute w-10 h-10 -ml-5 -mt-5 bg-white rounded-full border-4 border-[#001240] shadow-xl flex items-center justify-center z-10 group cursor-pointer hover:scale-110 transition-transform"
              >
                <span className="text-xs font-black text-[#001240]">{p.role}</span>
                {/* Player Tooltip */}
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-black/90 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none">
                  Role: {p.role}
                </div>
              </motion.div>
            ))}

            {/* Away Team (Right) - 3-4-3 (Only visible in Match Mode) */}
            {isActive && awayPlayers.map((p, i) => (
              <motion.div
                key={`away-${i}`}
                drag
                dragMomentum={false}
                onDragEnd={(_, info) => handleDragEnd(i, 'away', info)}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1, left: `${p.x}%`, top: `${p.y}%` }}
                transition={{ duration: 0.5, delay: i * 0.05 + 0.5 }}
                className="absolute w-10 h-10 -ml-5 -mt-5 bg-[#E21B4D] rounded-full border-4 border-white shadow-xl flex items-center justify-center z-10"
              >
                <span className="text-xs font-black text-white">{p.role}</span>
              </motion.div>
            ))}
          </div>
          
          {/* Match Status Overlay */}
          {isActive && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/80 border border-white/20 px-8 py-3 rounded-b-xl flex items-center gap-6 shadow-2xl backdrop-blur-md">
              <div className="text-white font-black text-2xl tracking-tighter">TONI FC</div>
              <div className="bg-[#E21B4D] px-4 py-1 rounded text-white font-mono font-bold text-2xl shadow-[0_0_15px_rgba(226,27,77,0.5)]">2 - 1</div>
              <div className="text-slate-400 font-bold text-2xl tracking-tighter">GUEST</div>
              <div className="w-px h-8 bg-white/20 mx-2" />
              <div className="text-[#E21B4D] font-mono font-bold animate-pulse">64:12</div>
            </div>
          )}
        </div>

        {/* Legend / Controls */}
        <div className="w-full max-w-5xl mt-6 grid grid-cols-3 gap-4">
           <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
             <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Home Formation</h4>
             <div className="text-xl font-bold text-white">4-4-2 <span className="text-sm font-normal text-slate-400">Flat</span></div>
           </div>
           <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
             <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Opponent Formation</h4>
             <div className="text-xl font-bold text-white">{isActive ? '3-4-3' : 'Unknown'} <span className="text-sm font-normal text-slate-400">{isActive ? 'Diamond' : '---'}</span></div>
           </div>
           <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
             <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Key Battle</h4>
             <div className="text-sm text-slate-300">
               {isActive ? 'Overload in Zone 14 vs Double Pivot' : 'Activate Match Mode to analyze'}
             </div>
           </div>
        </div>
      </div>
    </div>
  );
}
