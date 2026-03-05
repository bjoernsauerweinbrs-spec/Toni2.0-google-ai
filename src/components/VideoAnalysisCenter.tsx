import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, Pause, SkipBack, SkipForward, Mic, PenTool, Layers, 
  Target, Share2, Save, Scissors, Activity, Maximize2, X, BookOpen,
  BrainCircuit, ShieldAlert, HeartPulse
} from 'lucide-react';
import ReactPlayer from 'react-player';
import { Player, InterviewSession } from '../types';
import PressRoom from './PressRoom';

interface VideoAnalysisProps {
  players: Player[];
  isPlaying?: boolean;
  onTogglePlay?: () => void;
}

export default function VideoAnalysisCenter({ players, isPlaying: externalIsPlaying, onTogglePlay }: VideoAnalysisProps) {
  const [internalIsPlaying, setInternalIsPlaying] = useState(false);
  const isPlaying = externalIsPlaying !== undefined ? externalIsPlaying : internalIsPlaying;
  const setIsPlaying = onTogglePlay || setInternalIsPlaying;
  const [currentTime, setCurrentTime] = useState(0);
  const [isDrawing, setIsDrawing] = useState(false);
  const [activeTool, setActiveTool] = useState<'CURSOR' | 'PEN' | 'ZONE'>('CURSOR');
  const [showOverlay, setShowOverlay] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [analysisMode, setAnalysisMode] = useState<'NONE' | 'CHAIN' | 'PRESSING' | 'SHOWCASE'>('NONE');
  const [isPressRoomOpen, setIsPressRoomOpen] = useState(false);
  const [selectedClip, setSelectedClip] = useState<any>(null);
  const [showcaseAlert, setShowcaseAlert] = useState<{ type: 'TRAINER' | 'DOCTOR' | 'PRESSE'; message: string } | null>(null);
  
  const playerRef = useRef<any>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const Player = ReactPlayer as any;

  // Mock tactical events
  const events = [
    { time: 15, type: 'TURNOVER', label: 'High Press Win', color: 'text-emerald-400' },
    { time: 42, type: 'SHOT', label: 'Shot on Target', color: 'text-amber-400' },
    { time: 88, type: 'GOAL', label: 'Goal - Counter Attack', color: 'text-red-500' },
  ];

  const handleOpenPressRoom = (clip: any) => {
    setSelectedClip({
      ...clip,
      player: players[0], // Default to first player for demo
      metrics: {
        heart_rate: 185,
        speed: 32.4
      }
    });
    setIsPressRoomOpen(true);
  };

  const handleInterviewComplete = async (session: InterviewSession) => {
    try {
      const res = await fetch('/api/journal/save-interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(session)
      });
      const data = await res.json();
      if (data.success) {
        alert("Interview saved to Journal!");
        setIsPressRoomOpen(false);
      }
    } catch (e) {
      console.error("Failed to save interview", e);
    }
  };

  // --- Video Analysis & Journal Sync ---
  const sendToJournal = async (clip: any) => {
    const activePlayer = players[0]; // Default to first player for demo
    
    try {
      const res = await fetch('/api/video/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoUrl: "https://www.youtube.com/watch?v=5mTGRWX1Vcg",
          playerId: activePlayer.id,
          playerName: activePlayer.name,
          eventType: clip.label || 'TACTICAL HIGHLIGHT',
          metrics: {
            heart_rate: 185,
            speed: 32.4
          }
        })
      });
      const data = await res.json();
      if (data.success) {
        alert("Clip processed by Presse-Toni and sent to Journal!");
      }
    } catch (e) {
      console.error("Failed to send to journal", e);
    }
  };

  const toggleMic = () => {
    setIsListening(!isListening);
  };

  const startShowcase = () => {
    setAnalysisMode('SHOWCASE');
    setIsPlaying(true);
    
    // Sequence of AI Alerts for the demo
    setTimeout(() => {
      setShowcaseAlert({
        type: 'TRAINER',
        message: "Coach, look at the 4-4-2 shifting in the middle block. We are exploiting the half-spaces effectively."
      });
    }, 2000);

    setTimeout(() => {
      setShowcaseAlert({
        type: 'DOCTOR',
        message: "Alert: Heart rate peak detected. Syncing with recovery data from the Sports Watch."
      });
    }, 8000);

    setTimeout(() => {
      setShowcaseAlert(null);
    }, 14000);
  };

  return (
    <div className="h-full w-full bg-[#050505] text-white flex flex-col overflow-hidden font-sans">
      {/* Top Bar - Cinematic Header */}
      <header className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-[#0a0a0a] z-20">
        <div className="flex items-center gap-4">
          <div className="w-2 h-8 bg-[#E21B4D]" /> {/* Red Bull Accent */}
          <div>
            <h1 className="text-2xl font-black italic tracking-tighter leading-none">VIDEO<span className="text-slate-500">LAB</span></h1>
            <p className="text-[10px] font-mono text-[#E21B4D] uppercase tracking-widest">Tactical Analysis Center</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <button 
            onClick={startShowcase}
            className={`px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-all uppercase tracking-wider text-xs ${
              analysisMode === 'SHOWCASE' 
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50 animate-pulse' 
                : 'bg-[#E21B4D] text-white hover:bg-red-600 shadow-lg shadow-red-900/20'
            }`}
          >
            <BrainCircuit size={16} />
            {analysisMode === 'SHOWCASE' ? 'Showcase Active' : 'Start Showcase'}
          </button>

          <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-lg border border-white/10">
            <div className={`w-2 h-2 rounded-full ${isListening ? 'bg-red-500 animate-pulse' : 'bg-slate-500'}`} />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              {isListening ? 'Listening...' : 'Toni Analyst Idle'}
            </span>
          </div>
          <button 
            onClick={toggleMic}
            className={`p-3 rounded-full transition-all ${isListening ? 'bg-red-600 text-white shadow-[0_0_20px_rgba(220,38,38,0.5)]' : 'bg-white/10 hover:bg-white/20 text-slate-300'}`}
          >
            <Mic size={20} />
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Video Stage */}
        <div className="flex-1 relative bg-black flex flex-col">
          {/* Video Container with Vignette & Glow */}
          <div className="flex-1 relative overflow-hidden flex items-center justify-center group">
            {/* Cinematic Glow Effect */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(226,27,77,0.1)_0%,_transparent_70%)] opacity-50 pointer-events-none z-0" />
            <div className="absolute inset-0 shadow-[inset_0_0_150px_rgba(0,0,0,0.9)] pointer-events-none z-10" />

            {/* React Player */}
            <div className="absolute inset-0 z-0">
              <Player
                ref={playerRef}
                url="https://www.youtube.com/watch?v=5mTGRWX1Vcg"
                playing={isPlaying}
                controls={false}
                width="100%"
                height="100%"
                style={{ position: 'absolute', top: 0, left: 0 }}
                onProgress={(progress: any) => setCurrentTime(progress.playedSeconds)}
              />
            </div>

            {/* Tactical Overlay Canvas & Showcase Elements */}
            {analysisMode === 'SHOWCASE' && (
              <div className="absolute inset-0 z-20 pointer-events-none">
                {/* 5-Meter Grid System */}
                <div className="absolute inset-0 grid grid-cols-[repeat(20,1fr)] grid-rows-[repeat(13,1fr)] opacity-30">
                  {Array.from({ length: 20 * 13 }).map((_, i) => (
                    <div key={i} className="border-[0.5px] border-cyan-400/30" />
                  ))}
                </div>

                {/* Halbraum-Korridore (Half-Spaces) */}
                <div className="absolute top-[15%] bottom-[15%] left-0 right-0 bg-cyan-500/10" />
                <div className="absolute top-0 bottom-0 left-[25%] w-[15%] bg-red-500/10 border-x border-dashed border-red-500/40" />
                <div className="absolute top-0 bottom-0 right-[25%] w-[15%] bg-red-500/10 border-x border-dashed border-red-500/40" />

                {/* AI Player Tracking Circles (Mocked positions) */}
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="absolute top-[40%] left-[30%] flex flex-col items-center"
                >
                  <div className="w-12 h-12 rounded-full border-2 border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.5)]" />
                  <div className="mt-1 bg-black/80 border border-cyan-400/50 px-2 py-0.5 rounded text-[8px] font-mono font-bold text-cyan-400 uppercase tracking-widest backdrop-blur-sm">
                    {players[0]?.name || 'Player 1'} • <span className="text-emerald-400">{players[0]?.readiness_score || 85}%</span>
                  </div>
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                  className="absolute top-[55%] left-[45%] flex flex-col items-center"
                >
                  <div className="w-12 h-12 rounded-full border-2 border-[#E21B4D] shadow-[0_0_15px_rgba(226,27,77,0.5)]" />
                  <div className="mt-1 bg-black/80 border border-[#E21B4D]/50 px-2 py-0.5 rounded text-[8px] font-mono font-bold text-[#E21B4D] uppercase tracking-widest backdrop-blur-sm">
                    {players[1]?.name || 'Player 2'} • <span className="text-amber-400">{players[1]?.readiness_score || 62}%</span>
                  </div>
                </motion.div>
              </div>
            )}

            {/* AI HUD Overlay */}
            <AnimatePresence>
              {analysisMode === 'SHOWCASE' && (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="absolute top-8 right-8 bg-black/80 backdrop-blur-md border border-[#00FFFF]/30 p-4 rounded-xl z-30 w-64"
                >
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-[#00FFFF] font-bold text-sm uppercase tracking-wider">Defensive Chain</h3>
                    <span className="text-xs font-mono text-white">94% Integrity</span>
                  </div>
                  <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden mb-4">
                    <div className="h-full w-[94%] bg-[#00FFFF] shadow-[0_0_10px_#00FFFF]" />
                  </div>
                  
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-[#E21B4D] font-bold text-sm uppercase tracking-wider">Pressing Intensity</h3>
                    <span className="text-xs font-mono text-white">High (Gegenpressing)</span>
                  </div>
                  <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full w-[85%] bg-[#E21B4D] shadow-[0_0_10px_#E21B4D]" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Multi-Persona Alerts */}
            <AnimatePresence>
              {showcaseAlert && (
                <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 20, scale: 0.9 }}
                  className={`absolute bottom-8 left-1/2 -translate-x-1/2 z-40 max-w-lg w-full bg-black/90 backdrop-blur-md border-l-4 p-6 rounded-r-xl shadow-2xl ${
                    showcaseAlert.type === 'TRAINER' ? 'border-cyan-400' : 
                    showcaseAlert.type === 'DOCTOR' ? 'border-[#E21B4D]' : 'border-amber-400'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    {showcaseAlert.type === 'TRAINER' && <BrainCircuit className="text-cyan-400" size={20} />}
                    {showcaseAlert.type === 'DOCTOR' && <HeartPulse className="text-[#E21B4D]" size={20} />}
                    <span className={`font-black uppercase tracking-widest text-xs ${
                      showcaseAlert.type === 'TRAINER' ? 'text-cyan-400' : 'text-[#E21B4D]'
                    }`}>
                      {showcaseAlert.type}-Toni Analysis
                    </span>
                  </div>
                  <p className="text-lg font-black italic text-white leading-tight">
                    "{showcaseAlert.message}"
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Drawing Tools (Floating) */}
            <div className="absolute left-6 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-30 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <button 
                onClick={() => setActiveTool('CURSOR')}
                className={`p-3 rounded-xl backdrop-blur-md border ${activeTool === 'CURSOR' ? 'bg-white text-black border-white' : 'bg-black/50 text-white border-white/10 hover:bg-black/70'}`}
              >
                <Maximize2 size={20} />
              </button>
              <button 
                onClick={() => setActiveTool('PEN')}
                className={`p-3 rounded-xl backdrop-blur-md border ${activeTool === 'PEN' ? 'bg-[#E21B4D] text-white border-[#E21B4D]' : 'bg-black/50 text-white border-white/10 hover:bg-black/70'}`}
              >
                <PenTool size={20} />
              </button>
              <button 
                onClick={() => setShowOverlay(!showOverlay)}
                className={`p-3 rounded-xl backdrop-blur-md border ${showOverlay ? 'bg-[#00FFFF] text-black border-[#00FFFF]' : 'bg-black/50 text-white border-white/10 hover:bg-black/70'}`}
              >
                <Layers size={20} />
              </button>
            </div>
          </div>

          {/* Bottom HUD - Timeline & Metrics */}
          <div className="h-48 bg-[#0a0a0a] border-t border-white/10 flex flex-col z-20">
            {/* Timeline Scrubber */}
            <div className="h-12 flex items-center px-4 gap-4 border-b border-white/5">
              <button 
                onClick={() => setIsPlaying(!isPlaying)}
                className="text-white hover:text-[#E21B4D] transition-colors"
              >
                {isPlaying ? <Pause size={24} /> : <Play size={24} />}
              </button>
              
              <div className="flex-1 h-12 relative group cursor-pointer flex items-center">
                {/* Track */}
                <div className="absolute inset-x-0 h-1 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-[#E21B4D] w-[35%]" />
                </div>
                
                {/* Event Markers */}
                {events.map((ev, i) => (
                  <div 
                    key={i} 
                    className={`absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-[#0a0a0a] ${ev.type === 'GOAL' ? 'bg-white h-4 w-4' : 'bg-slate-500'}`}
                    style={{ left: `${ev.time}%` }}
                  >
                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-black/90 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap border border-white/10 pointer-events-none">
                      {ev.label}
                    </div>
                  </div>
                ))}
              </div>

              <div className="font-mono text-xl font-bold text-white w-20 text-right">04:12</div>
            </div>

            {/* Player Metrics (Syncs with Video) */}
            <div className="flex-1 p-4 flex gap-4 overflow-x-auto">
              {players.slice(0, 4).map(player => (
                <div key={player.id} className="min-w-[200px] bg-white/5 rounded-lg p-3 border border-white/5 flex flex-col justify-between hover:bg-white/10 transition-colors cursor-pointer group">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-700 overflow-hidden">
                        <img src={player.image_url || `https://picsum.photos/seed/${player.id}/100`} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <div className="font-bold text-sm text-white leading-none">{player.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-1">HR: 142 BPM</div>
                      </div>
                    </div>
                    <div className={`text-xs font-bold ${player.readiness_score > 80 ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {player.readiness_score}%
                    </div>
                  </div>
                  
                  {/* Mini Sparkline */}
                  <div className="h-8 flex items-end gap-1 mt-2 opacity-50 group-hover:opacity-100 transition-opacity">
                    {[40, 60, 55, 70, 85, 60, 75, 50, 65, 80].map((h, i) => (
                      <div key={i} className="flex-1 bg-[#E21B4D]" style={{ height: `${h}%` }} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Sidebar - Tagging & Clips */}
        <div className="w-80 bg-[#080808] border-l border-white/10 flex flex-col z-20">
          <div className="p-4 border-b border-white/10">
            <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-4">Live Tagging</h3>
            <div className="grid grid-cols-2 gap-2">
              {['Pressing', 'Transition', 'Set Piece', 'Build Up', 'Turnover', 'Finish'].map(tag => (
                <button key={tag} className="bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white py-3 rounded-lg text-xs font-bold border border-white/5 transition-all active:scale-95">
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Generated Clips</h3>
            {[
              { id: 1, label: 'Defensive Line Gap', time: '14:02' },
              { id: 2, label: 'High Press Win', time: '22:15' },
              { id: 3, label: 'Counter Attack Goal', time: '88:04' }
            ].map(clip => (
              <div key={clip.id} className="bg-white/5 p-3 rounded-lg border border-white/5 hover:border-[#E21B4D]/50 group cursor-pointer transition-all">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-bold text-[#E21B4D] uppercase">Tactical Alert</span>
                  <span className="text-[10px] font-mono text-slate-500">{clip.time}</span>
                </div>
                <p className="text-sm text-white font-medium leading-tight mb-2">{clip.label} detected</p>
                <div className="flex gap-2">
                  <button className="flex-1 bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold py-1.5 rounded flex items-center justify-center gap-1">
                    <Play size={10} /> Review
                  </button>
                  <button 
                    onClick={() => sendToJournal(clip)}
                    className="flex-1 bg-[#E21B4D]/10 hover:bg-[#E21B4D]/20 text-[#E21B4D] text-[10px] font-bold py-1.5 rounded flex items-center justify-center gap-1"
                  >
                    <BookOpen size={10} /> Journal
                  </button>
                  <button 
                    onClick={() => handleOpenPressRoom(clip)}
                    className="flex-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-[10px] font-bold py-1.5 rounded flex items-center justify-center gap-1"
                  >
                    <Mic size={10} /> Press
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-white/10 bg-[#0a0a0a]">
            <button className="w-full bg-[#E21B4D] hover:bg-red-600 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-red-900/20 transition-all">
              <Save size={18} />
              <span>EXPORT TO BRIEFCASE</span>
            </button>
          </div>
        </div>
      </div>

      {/* Press Room Modal */}
      <PressRoom 
        isOpen={isPressRoomOpen}
        onClose={() => setIsPressRoomOpen(false)}
        clip={selectedClip || { id: '0', label: 'Unknown', time: '00:00' }}
        onInterviewComplete={handleInterviewComplete}
      />
    </div>
  );
}
