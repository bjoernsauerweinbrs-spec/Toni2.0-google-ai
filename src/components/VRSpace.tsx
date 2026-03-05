import React, { Suspense, useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { XR, createXRStore, XRButton, useXR, Interactive } from '@react-three/xr';
import { OrbitControls, Sky, Html, Environment, useTexture, PerspectiveCamera, Text } from '@react-three/drei';
import * as THREE from 'three';
import { Activity, Briefcase, Video, Users, MessageSquare, Shield, Zap, Move, BrainCircuit, Mic, MicOff, Search } from 'lucide-react';
import TacticalBoard from './TacticalBoard';
import MedicalLab from './MedicalLab';
import BriefcaseModule from './Briefcase';
import VideoAnalysisCenter from './VideoAnalysisCenter';
import ChatInterface from './ChatInterface';
import { Player, Persona } from '../types';
import { VRAdvisorAI } from '../services/GeminiService';
import { GoogleGenAI, Modality } from "@google/genai";
import { motion, AnimatePresence } from 'motion/react';

const store = createXRStore();

interface VRSpaceProps {
  players: Player[];
  onExit: () => void;
  onUpdatePlayers: (players: Player[]) => void;
  onManualEntry?: (player: Player, persona: Persona) => void;
}

// --- Locomotion & Mode System ---
function PlayerController({ mode, setMode }: { mode: 'NAV' | 'ANALYZE', setMode: (m: 'NAV' | 'ANALYZE') => void }) {
  const xrState = useXR();
  const speed = 0.05;
  const lastToggleRef = useRef(0);

  useFrame((state, delta) => {
    const origin = xrState.origin;
    if (!origin) return;

    const session = state.gl.xr.getSession();
    if (!session) return;

    for (const source of session.inputSources) {
      if (source.gamepad) {
        // Mode Toggle: Using the primary button on the right controller to toggle
        const now = Date.now();
        if (source.handedness === 'right' && source.gamepad.buttons[0]?.pressed && now - lastToggleRef.current > 500) {
          setMode(mode === 'NAV' ? 'ANALYZE' : 'NAV');
          lastToggleRef.current = now;
        }

        if (mode === 'NAV' && source.handedness === 'left') {
          const axes = source.gamepad.axes;
          const x = axes[2] || 0;
          const z = axes[3] || 0;

          if (Math.abs(x) > 0.1 || Math.abs(z) > 0.1) {
            const direction = new THREE.Vector3();
            state.camera.getWorldDirection(direction);
            direction.y = 0;
            direction.normalize();

            const side = new THREE.Vector3().crossVectors(state.camera.up, direction).normalize();
            
            origin.position.addScaledVector(direction, -z * speed);
            origin.position.addScaledVector(side, x * speed);
          }
        }
      }
    }
  });

  return null;
}

// --- Telestrator Component ---
function Telestrator({ isVisible, onDraw }: { isVisible: boolean, onDraw: (points: THREE.Vector2[]) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(document.createElement('canvas'));
  const textureRef = useRef<THREE.CanvasTexture | null>(null);
  const [points, setPoints] = useState<THREE.Vector2[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = 'rgba(0,0,0,0)';
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    textureRef.current = new THREE.CanvasTexture(canvas);
  }, []);

  const handlePointerMove = (e: any) => {
    if (!isDrawing || !isVisible) return;
    const uv = e.intersection?.uv;
    if (uv) {
      const x = uv.x * 1024;
      const y = (1 - uv.y) * 1024;
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 10;
        ctx.lineCap = 'round';
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#00ffff';
        
        if (points.length === 0) {
          ctx.beginPath();
          ctx.moveTo(x, y);
        } else {
          const lastPoint = points[points.length - 1];
          ctx.beginPath();
          ctx.moveTo(lastPoint.x, lastPoint.y);
          ctx.lineTo(x, y);
          ctx.stroke();
        }
        setPoints(prev => [...prev, new THREE.Vector2(x, y)]);
        if (textureRef.current) textureRef.current.needsUpdate = true;
      }
    }
  };

  const handleSelectStart = () => {
    if (isVisible) {
      setIsDrawing(true);
      setPoints([]);
    }
  };

  const handleSelectEnd = () => {
    if (isVisible) {
      setIsDrawing(false);
      onDraw(points);
      // Clear canvas after a delay or keep it? User said "live drawing"
      // Let's keep it for now and provide a clear button in the UI
    }
  };

  return (
    <Interactive
      onMove={handlePointerMove}
      onSelectStart={handleSelectStart}
      onSelectEnd={handleSelectEnd}
    >
      <mesh position={[0, 0, 0.01]}>
        <planeGeometry args={[4, 2.25]} />
        <meshBasicMaterial map={textureRef.current} transparent opacity={0.8} />
      </mesh>
    </Interactive>
  );
}

// --- VR Advisor Component (Intelligence) ---
function VRAdvisor({ players }: { players: Player[] }) {
  const [analysis, setAnalysis] = useState<string>('Analyzing squad performance...');
  const [quickStatus, setQuickStatus] = useState<string>('System Ready.');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const sessionRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      const status = await VRAdvisorAI.getQuickStatus(players);
      setQuickStatus(status);
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, [players]);

  const runDeepAnalysis = async () => {
    setIsAnalyzing(true);
    const result = await VRAdvisorAI.analyzeSquadTactics(players, "Analyze current squad readiness and tactical efficiency.");
    setAnalysis(result);
    setIsAnalyzing(false);
  };

  const startLiveConversation = async () => {
    if (isLive) {
      setIsLive(false);
      sessionRef.current?.close();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track: any) => track.stop());
      }
      return;
    }

    setIsLive(true);
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const audioContext = new AudioContext({ sampleRate: 16000 });
      const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(4096, 1, 1);

      const session = await ai.live.connect({
        model: "gemini-2.5-flash-native-audio-preview-09-2025",
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
          },
          systemInstruction: "You are the Stark Elite VR Advisor. Provide tactical and medical advice in real-time. Be direct and professional.",
        },
        callbacks: {
          onopen: () => {
            console.log("Live session opened");
            source.connect(processor);
            processor.connect(audioContext.destination);
            processor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmData = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) {
                pcmData[i] = Math.max(-1, Math.min(1, inputData[i])) * 0x7FFF;
              }
              const base64Data = btoa(String.fromCharCode(...new Uint8Array(pcmData.buffer)));
              session.sendRealtimeInput({
                media: { data: base64Data, mimeType: 'audio/pcm;rate=16000' }
              });
            };
          },
          onmessage: async (message) => {
            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio) {
              const binaryString = atob(base64Audio);
              const bytes = new Uint8Array(binaryString.length);
              for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
              }
              const pcmData = new Int16Array(bytes.buffer);
              const float32Data = new Float32Array(pcmData.length);
              for (let i = 0; i < pcmData.length; i++) {
                float32Data[i] = pcmData[i] / 32768;
              }
              
              const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
              const buffer = audioCtx.createBuffer(1, float32Data.length, 24000);
              buffer.getChannelData(0).set(float32Data);
              const source = audioCtx.createBufferSource();
              source.buffer = buffer;
              source.connect(audioCtx.destination);
              source.start();
            }
          },
          onerror: (err) => {
            console.error("Live API error:", err);
            setIsLive(false);
          },
          onclose: () => setIsLive(false),
        }
      });
      sessionRef.current = session;
    } catch (e) {
      console.error("Failed to connect to Live API", e);
      setIsLive(false);
    }
  };

  return (
    <group position={[0, 3, 0]}>
      <Html transform distanceFactor={4}>
        <div className="w-[1000px] bg-[#001240]/90 backdrop-blur-2xl rounded-[40px] border-4 border-purple-500 overflow-hidden shadow-[0_0_100px_rgba(139,92,246,0.3)]">
          <div className="p-8 bg-purple-900/40 border-b-2 border-purple-500 flex justify-between items-center">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center shadow-lg shadow-purple-900/50">
                <BrainCircuit size={40} className="text-black" />
              </div>
              <div>
                <h2 className="text-4xl font-black italic text-white uppercase tracking-tighter">AI Intelligence Advisor</h2>
                <p className="text-purple-400 font-mono text-sm uppercase tracking-widest">{quickStatus}</p>
              </div>
            </div>
            <div className="flex gap-4">
              <button onClick={startLiveConversation} className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-black italic uppercase tracking-tighter transition-all ${isLive ? 'bg-red-600 text-white animate-pulse' : 'bg-purple-500 text-black hover:bg-purple-400'}`}>
                {isLive ? <MicOff size={24} /> : <Mic size={24} />}
                {isLive ? 'Live Voice Active' : 'Start Voice Advisor'}
              </button>
              <button onClick={runDeepAnalysis} disabled={isAnalyzing} className="flex items-center gap-3 px-8 py-4 bg-white text-black rounded-2xl font-black italic uppercase tracking-tighter hover:bg-slate-200 transition-all disabled:opacity-50">
                {isAnalyzing ? <Zap size={24} className="animate-spin" /> : <Search size={24} />}
                {isAnalyzing ? 'Analyzing...' : 'Deep Tactical Scan'}
              </button>
            </div>
          </div>
          <div className="p-10">
            <div className="bg-black/40 border border-white/10 rounded-2xl p-8 min-h-[200px]">
              <p className="text-2xl text-slate-200 font-medium leading-relaxed italic">{analysis}</p>
            </div>
          </div>
        </div>
      </Html>
    </group>
  );
}

// --- Grabbable Panel Component ---
function GrabbablePanel({ children, position, rotation, title, icon: Icon, color = "#22d3ee" }: any) {
  const [panelPos, setPanelPos] = useState(position);
  const [isGrabbing, setIsGrabbing] = useState(false);
  const panelRef = useRef<THREE.Group>(null);

  return (
    <Interactive
      onSelectStart={() => setIsGrabbing(true)}
      onSelectEnd={() => setIsGrabbing(false)}
      onMove={(e) => {
        if (isGrabbing && panelRef.current) {
          const point = e.intersection?.point;
          if (point) panelRef.current.position.copy(point);
        }
      }}
    >
      <group ref={panelRef} position={panelPos} rotation={rotation}>
        <Html transform distanceFactor={3.5} portal={undefined}>
          <div className={`w-[1000px] h-[800px] bg-[#001240]/90 backdrop-blur-xl rounded-[40px] border-4 overflow-hidden shadow-2xl transition-all ${isGrabbing ? 'scale-105 border-white' : ''}`} style={{ borderColor: color }}>
            <div className="p-6 flex justify-between items-center border-b-2" style={{ backgroundColor: `${color}20`, borderColor: color }}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: color }}>
                  <Icon size={28} className="text-black" />
                </div>
                <h2 className="text-4xl font-black italic text-white tracking-tight uppercase">{title}</h2>
              </div>
            </div>
            <div className="p-4 h-full overflow-auto custom-scrollbar">{children}</div>
          </div>
        </Html>
      </group>
    </Interactive>
  );
}

// --- FIFA Card Component ---
function FIFACard({ player, position, rotation, onUpdate, onManualEntry, persona }: { player: Player, position: [number, number, number], rotation: [number, number, number], onUpdate: (p: Player) => void, onManualEntry?: (p: Player, persona: Persona) => void, persona: Persona }) {
  const [isEditing, setIsEditing] = useState(false);
  const ovr = Math.round(((player.stats?.pace || 0) + (player.stats?.shooting || 0) + (player.stats?.passing || 0) + (player.stats?.dribbling || 0) + (player.stats?.defending || 0) + (player.stats?.physical || 0)) / 6) || 80;
  
  const getCardColor = (ovr: number) => {
    if (ovr >= 85) return "#22d3ee"; // Elite
    if (ovr >= 75) return "#fcd34d"; // Gold
    return "#e2e8f0"; // Silver
  };

  const color = getCardColor(ovr);

  return (
    <group position={position} rotation={rotation}>
      <Interactive onSelect={() => setIsEditing(!isEditing)}>
        <Html transform distanceFactor={1.5}>
          <div className={`w-64 h-96 bg-gradient-to-br from-slate-900 via-[#001240] to-slate-900 rounded-2xl border-2 p-1 shadow-2xl overflow-hidden transition-all ${isEditing ? 'scale-110 ring-4 ring-white' : ''}`}
               style={{ borderColor: color }}>
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 pointer-events-none" />
            <div className="relative p-4 h-full flex flex-col">
              <div className="flex justify-between items-start">
                <div className="flex flex-col items-center">
                  <span className="text-4xl font-black italic leading-none" style={{ color }}>{ovr}</span>
                  <span className="text-[8px] font-bold text-white/60 uppercase tracking-widest">OVR</span>
                </div>
                <div className="text-right">
                  <div className="text-xl font-black italic uppercase" style={{ color }}>{player.tactical_position.split(' ')[0]}</div>
                </div>
              </div>
              <div className="flex-1 flex flex-col items-center justify-center py-4">
                <div className="w-24 h-24 bg-white/10 rounded-full border-2 flex items-center justify-center overflow-hidden mb-2" style={{ borderColor: color }}>
                  {player.image_url ? <img src={player.image_url} className="w-full h-full object-cover" /> : <Users size={40} className="text-white/40" />}
                </div>
                {isEditing ? (
                  <input 
                    className="bg-transparent text-xl font-black italic uppercase text-white tracking-tighter text-center border-b border-white/20 focus:outline-none w-full"
                    value={player.name}
                    onChange={(e) => onUpdate({ ...player, name: e.target.value })}
                  />
                ) : (
                  <h3 className="text-xl font-black italic uppercase text-white tracking-tighter text-center">{player.name}</h3>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2 text-[10px] bg-black/40 p-2 rounded-lg border border-white/10">
                {player.stats && Object.entries(player.stats).slice(0, 6).map(([k, v]) => (
                  <div key={k} className="flex justify-between border-b border-white/5 pb-1">
                    <span className="text-white/60 font-bold uppercase">{k.substring(0, 3)}</span>
                    {isEditing ? (
                      <input 
                        type="number"
                        className="bg-transparent font-black w-8 text-right focus:outline-none"
                        style={{ color }}
                        value={v}
                        onChange={(e) => {
                          const newStats = { ...player.stats, [k]: parseInt(e.target.value) || 0 };
                          onUpdate({ ...player, stats: newStats as any });
                        }}
                      />
                    ) : (
                      <span className="font-black" style={{ color }}>{v}</span>
                    )}
                  </div>
                ))}
              </div>
              {isEditing && (
                <div className="mt-2 flex gap-2">
                  <button 
                    onClick={() => setIsEditing(false)}
                    className="flex-1 bg-white text-black font-black uppercase text-[10px] py-1 rounded"
                  >
                    Save
                  </button>
                  <button 
                    onClick={() => onManualEntry?.(player, persona)}
                    className="flex-1 bg-cyan-500 text-black font-black uppercase text-[10px] py-1 rounded"
                  >
                    Manual Input
                  </button>
                </div>
              )}
            </div>
          </div>
        </Html>
      </Interactive>
    </group>
  );
}

// --- Eric Meijer Tactical Screen ---
function EricMeijerDisplay({ players }: { players: Player[] }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [mode, setMode] = useState<'NAV' | 'ANALYZE'>('NAV');

  const handleDraw = async (points: THREE.Vector2[]) => {
    if (points.length < 5) return;
    
    // AI Analysis of the drawing
    const result = await VRAdvisorAI.analyzeSquadTactics(players, "Analyze this pass/movement line drawn on the video. Is it successful? What are the risks?");
    setAiAnalysis(result);
    
    // Sync to Journal & Briefcase
    try {
      await fetch('/api/video/save-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timestamp: Date.now(),
          drawing: points,
          analysis: result,
          type: 'VR_TELESTRATOR_CLIP'
        })
      });
      console.log("Tactical drawing synced to Performance Journal and Briefcase.");
    } catch (e) {
      console.error("Failed to sync drawing", e);
    }
  };

  const lastTriggerRef = useRef(0);

  // Trigger for Pause/Play
  useFrame((state) => {
    const session = state.gl.xr.getSession();
    if (!session) return;
    for (const source of session.inputSources) {
      if (source.gamepad && source.handedness === 'right') {
        const triggerPressed = source.gamepad.buttons[1]?.pressed;
        const now = Date.now();
        if (triggerPressed && now - lastTriggerRef.current > 500) {
          setIsPlaying(!isPlaying);
          lastTriggerRef.current = now;
        }
      }
    }
  });

  return (
    <group position={[0, 2.5, -5]}>
      {/* Curved Screen Frame */}
      <mesh rotation={[0, 0, 0]}>
        <cylinderGeometry args={[10, 10, 4.5, 32, 1, true, -Math.PI / 6, Math.PI / 3]} />
        <meshStandardMaterial color="#001240" side={THREE.DoubleSide} metalness={0.9} roughness={0.1} />
      </mesh>
      
      {/* Video Content */}
      <group position={[0, 0, 0.1]}>
        <Html transform distanceFactor={4} position={[0, 0, 0]}>
          <div className="w-[1200px] h-[675px] bg-black rounded-3xl overflow-hidden border-8 border-cyan-500/30 shadow-[0_0_50px_rgba(34,211,238,0.3)] relative">
            <VideoAnalysisCenter players={players} isPlaying={isPlaying} onTogglePlay={() => setIsPlaying(!isPlaying)} />
            
            {/* Mode Indicator */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-4 z-[100]">
              <button 
                onClick={() => setMode('NAV')}
                className={`px-6 py-2 rounded-full font-black italic uppercase tracking-tighter transition-all ${mode === 'NAV' ? 'bg-cyan-500 text-black' : 'bg-black/50 text-white'}`}
              >
                Navigation
              </button>
              <button 
                onClick={() => setMode('ANALYZE')}
                className={`px-6 py-2 rounded-full font-black italic uppercase tracking-tighter transition-all ${mode === 'ANALYZE' ? 'bg-red-600 text-white animate-pulse' : 'bg-black/50 text-white'}`}
              >
                Telestrator Mode
              </button>
            </div>

            {/* Formation Recognition Labels */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-[30%] left-[20%] bg-cyan-500/80 text-black px-2 py-1 rounded font-black text-[10px] uppercase">4-4-2 Block</div>
              <div className="absolute top-[30%] right-[20%] bg-red-600/80 text-white px-2 py-1 rounded font-black text-[10px] uppercase">3-4-3 Diamond</div>
              
              {/* Distance Labels */}
              <div className="absolute top-[45%] left-[35%] w-20 h-0.5 bg-white/50">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-[8px] font-mono text-white">8.4m</div>
              </div>
              <div className="absolute top-[55%] left-[50%] w-16 h-0.5 bg-white/50">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-[8px] font-mono text-white">6.2m</div>
              </div>
            </div>

            {/* AI Analysis Overlay */}
            <AnimatePresence>
              {aiAnalysis && (
                <motion.div 
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 50 }}
                  className="absolute right-8 top-24 w-80 bg-black/80 backdrop-blur-xl border-l-4 border-cyan-500 p-6 rounded-r-xl z-[100]"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <BrainCircuit className="text-cyan-400" size={20} />
                    <span className="text-cyan-400 font-black uppercase text-xs">Toni Analyst</span>
                  </div>
                  <p className="text-white font-bold italic leading-tight">"{aiAnalysis}"</p>
                  <button 
                    onClick={() => setAiAnalysis(null)}
                    className="mt-4 text-[10px] text-slate-500 uppercase font-black hover:text-white"
                  >
                    Dismiss
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Html>
        
        {/* Telestrator Layer (Only active in ANALYZE mode) */}
        {mode === 'ANALYZE' && <Telestrator isVisible={true} onDraw={handleDraw} />}
      </group>

      <PlayerController mode={mode} setMode={setMode} />
    </group>
  );
}

// --- Scene Component ---
function Scene({ players, onUpdatePlayers, onManualEntry }: { players: Player[], onUpdatePlayers: (p: Player[]) => void, onManualEntry?: (p: Player, persona: Persona) => void }) {
  const texture = useTexture('https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=2000');
  const [activePersona, setActivePersona] = useState<Persona>('TRAINER');

  const handleUpdatePlayer = async (updatedPlayer: Player) => {
    const updated = players.map(p => p.id === updatedPlayer.id ? updatedPlayer : p);
    onUpdatePlayers(updated);
    await fetch(`/api/players/${updatedPlayer.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedPlayer)
    });
  };

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 1.6, 5]} />
      <OrbitControls 
        enableZoom={true} 
        enablePan={true} 
        rotateSpeed={0.5}
        target={[0, 1.6, 0]} 
      />
      
      <ambientLight intensity={0.7} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, 5, -10]} color="#00ffff" intensity={0.5} />

      <mesh scale={[-50, 50, 50]}>
        <sphereGeometry args={[1, 64, 64]} />
        <meshBasicMaterial map={texture} side={THREE.BackSide} transparent opacity={0.3} />
      </mesh>

      <Sky sunPosition={[100, 20, 100]} />
      <Environment preset="night" />

      {/* --- CENTER (0,0,0): TACTICAL HUB (Circular Table) --- */}
      <group position={[0, 0, 0]}>
        <mesh position={[0, 0.4, 0]}>
          <cylinderGeometry args={[3, 3.2, 0.8, 32]} />
          <meshStandardMaterial color="#061A40" metalness={0.9} roughness={0.1} />
        </mesh>
        <group position={[0, 0.85, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <mesh>
            <circleGeometry args={[2.8, 32]} />
            <meshStandardMaterial color="#00ffff" transparent opacity={0.3} emissive="#00ffff" emissiveIntensity={2} />
          </mesh>
          <Html transform distanceFactor={3} position={[0, 0, 0.05]} rotation={[Math.PI / 2, 0, 0]}>
            <div className="w-[1200px] h-[900px] bg-[#001240]/90 backdrop-blur-xl rounded-[60px] border-[10px] border-cyan-400/50 overflow-hidden scale-[0.4] origin-center shadow-[0_0_100px_rgba(34,211,238,0.5)]">
              <TacticalBoard isActive={true} onToggleGameMode={() => {}} />
            </div>
          </Html>
        </group>
        
        {/* Label on Floor */}
        <Text
          position={[0, 0.01, 4]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={0.5}
          color="#00ffff"
          font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff"
        >
          TACTICAL HUB
        </Text>
      </group>

      {/* --- FRONT-RIGHT (45°): MEDIA & SCOUTING LOUNGE --- */}
      <group position={[10, 0, -10]} rotation={[0, -Math.PI / 4, 0]}>
        <EricMeijerDisplay players={players} />
        <Text
          position={[0, 0.1, 5]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={0.5}
          color="#ffffff"
        >
          MEDIA & SCOUTING LOUNGE
        </Text>
      </group>

      {/* --- LEFT (-90°): MEDICAL PERFORMANCE LAB --- */}
      <group position={[-12, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        {/* Glass Wall Effect */}
        <mesh position={[0, 2.5, -5]}>
          <planeGeometry args={[15, 5]} />
          <meshStandardMaterial color="#22d3ee" transparent opacity={0.1} metalness={1} roughness={0} />
        </mesh>
        
        <GrabbablePanel position={[0, 2.5, 0]} rotation={[0, 0, 0]} title="Medical Lab" icon={Activity} color="#22d3ee">
          <MedicalLab players={players} />
        </GrabbablePanel>
        
        <Text
          position={[0, 0.1, 5]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={0.5}
          color="#22d3ee"
        >
          MEDICAL PERFORMANCE LAB
        </Text>

        {/* Team Cabin */}
        <group position={[0, 1.5, 6]} rotation={[0, -Math.PI / 6, 0]}>
          <Html transform distanceFactor={3}>
            <div className="w-[600px] h-[800px] bg-[#061A40]/95 backdrop-blur-xl rounded-3xl border-4 border-cyan-500 shadow-2xl flex flex-col overflow-hidden">
              <div className="p-6 bg-cyan-900/40 border-b-2 border-cyan-500 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Users className="text-cyan-400" size={32} />
                  <h2 className="text-2xl font-black italic text-white uppercase tracking-tighter">Team Cabin</h2>
                </div>
              </div>
              <div className="flex-1 p-4 overflow-y-auto space-y-3 custom-scrollbar">
                {players.map(player => (
                  <div key={player.id} className="p-4 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center border border-cyan-500/30">
                        <span className="text-[10px] font-black text-cyan-400">{player.tactical_position.substring(0, 2)}</span>
                      </div>
                      <p className="font-black text-white italic uppercase tracking-tight text-sm">{player.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-black text-cyan-400 italic leading-none">84</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Html>
        </group>
      </group>

      {/* --- RIGHT (+90°): MANAGEMENT ZONE --- */}
      <group position={[12, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <GrabbablePanel position={[0, 2.5, 0]} rotation={[0, 0, 0]} title="Management Zone" icon={Briefcase} color="#f59e0b">
          <BriefcaseModule />
        </GrabbablePanel>

        <Text
          position={[0, 0.1, 5]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={0.5}
          color="#f59e0b"
        >
          MANAGEMENT ZONE
        </Text>

        {/* FIFA Cards */}
        <group position={[0, 1.5, 6]} rotation={[0, Math.PI / 6, 0]}>
          {players.slice(0, 3).map((player, i) => (
            <FIFACard 
              key={player.id} 
              player={player} 
              position={[i * 2 - 2, 0, 0]} 
              rotation={[0, 0, 0]} 
              onUpdate={handleUpdatePlayer}
              onManualEntry={onManualEntry}
              persona={activePersona}
            />
          ))}
        </group>
      </group>

      {/* --- BACK (+12m): AI ADVISOR & CHAT --- */}
      <group position={[0, 1.5, 12]} rotation={[0, Math.PI, 0]}>
        <VRAdvisor players={players} />
        <GrabbablePanel position={[6, 1, 0]} rotation={[0, -Math.PI / 6, 0]} title="Trainer-Toni AI" icon={MessageSquare} color="#8b5cf6">
          <ChatInterface activePersona={activePersona} onPersonaChange={setActivePersona} />
        </GrabbablePanel>
      </group>

      {/* --- NLZ (YOUTH ACADEMY) - SEPARATE ZONE (-135°) --- */}
      <group position={[-15, 0, 15]} rotation={[0, Math.PI / 4, 0]}>
        <Text
          position={[0, 5, 0]}
          fontSize={1}
          color="#fcd34d"
          font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff"
        >
          NACHWUCHSLEISTUNGSZENTRUM (NLZ)
        </Text>
        
        {/* Funino Zone */}
        <group position={[-5, 0, 0]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
            <planeGeometry args={[8, 5]} />
            <meshStandardMaterial color="#10b981" transparent opacity={0.4} />
          </mesh>
          <Text position={[0, 0.1, 3]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.3} color="#ffffff">FUNINO ZONE (4 GOALS)</Text>
          {/* Mini Goals */}
          {[[-3.5, -2], [-3.5, 2], [3.5, -2], [3.5, 2]].map((pos, i) => (
            <mesh key={i} position={[pos[0], 0.25, pos[1]]}>
              <boxGeometry args={[0.5, 0.5, 1]} />
              <meshStandardMaterial color="white" wireframe />
            </mesh>
          ))}
        </group>

        {/* G-Jugend & Basis */}
        <group position={[5, 0, 0]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
            <planeGeometry args={[8, 5]} />
            <meshStandardMaterial color="#3b82f6" transparent opacity={0.4} />
          </mesh>
          <Text position={[0, 0.1, 3]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.3} color="#ffffff">G-JUGEND & BASIS</Text>
        </group>

        {/* Lernfelder (DNA) */}
        <group position={[0, 2, -5]}>
          <Html transform distanceFactor={3}>
            <div className="w-[800px] p-8 bg-gradient-to-br from-amber-900/90 to-black/90 border-4 border-amber-500 rounded-[40px] text-white">
              <h2 className="text-4xl font-black italic uppercase mb-4 text-amber-400">Vereins-DNA Lernfeld</h2>
              <div className="space-y-4 font-mono text-lg">
                <p className="border-l-4 border-amber-500 pl-4">1. MENTALITÄT ÜBER TALENT</p>
                <p className="border-l-4 border-amber-500 pl-4">2. AGGRESSIVES PRESSING (VON KLEIN AUF)</p>
                <p className="border-l-4 border-amber-500 pl-4">3. SCHNELLE UMSCHALTMOMENTE</p>
              </div>
            </div>
          </Html>
        </group>

        {/* Youth FIFA Cards */}
        <group position={[0, 1.5, 5]}>
          <Text position={[0, 2.5, 0]} fontSize={0.5} color="#fcd34d">YOUTH TALENTS</Text>
          {players.filter(p => p.category === 'YOUTH').map((player, i) => (
            <FIFACard 
              key={player.id} 
              player={player} 
              position={[i * 2 - 1, 0, 0]} 
              rotation={[0, 0, 0]} 
              onUpdate={onUpdatePlayers as any}
              onManualEntry={onManualEntry}
              persona={activePersona}
            />
          ))}
        </group>
      </group>
    </>
  );
}

export default function VRSpace({ players, onExit, onUpdatePlayers, onManualEntry }: VRSpaceProps) {
  return (
    <div className="fixed inset-0 z-[100] bg-black">
      <div className="absolute top-6 left-6 z-[110] flex items-center gap-4">
        <button onClick={onExit} className="px-6 py-3 bg-red-600 text-white font-black italic rounded-xl shadow-2xl hover:bg-red-700 transition-all uppercase tracking-tighter">
          Exit VR Mode
        </button>
        <XRButton store={store} mode="immersive-vr" className="!static !bg-cyan-600 !text-white !font-black !italic !rounded-xl !px-6 !py-3 !border-none !shadow-2xl hover:!bg-cyan-700 !transition-all">
          Enter VR
        </XRButton>
      </div>

      <Canvas shadows>
        <XR store={store}>
          <Suspense fallback={null}>
            <Scene players={players} onUpdatePlayers={onUpdatePlayers} onManualEntry={onManualEntry} />
          </Suspense>
        </XR>
      </Canvas>

      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-[110] text-center pointer-events-none">
        <p className="text-cyan-400 font-black italic text-2xl uppercase tracking-widest drop-shadow-lg">
          Stark Elite VR Command Center
        </p>
        <p className="text-white/60 font-mono text-sm uppercase mt-2">
          Use Left Joystick to Walk • Use Controllers to Grab Screens • Interact with Holograms
        </p>
      </div>
    </div>
  );
}
