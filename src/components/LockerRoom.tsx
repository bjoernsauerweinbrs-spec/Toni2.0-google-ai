import React, { useState, useEffect } from 'react';
import { Users, Star, TrendingUp, AlertTriangle, CheckCircle, Activity, X, Save, Scale, Watch, HeartPulse, Moon, Plus, Trash2, Camera, BrainCircuit } from 'lucide-react';
import { Player } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { TrainerToniAI } from '../services/GeminiService';

interface LockerRoomProps {
  players: Player[];
  onManualEntry?: (player: Player) => void;
}

export default function LockerRoom({ players: initialPlayers, onManualEntry }: LockerRoomProps) {
  const [players, setPlayers] = useState<Player[]>(initialPlayers);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [playerToDelete, setPlayerToDelete] = useState<Player | null>(null);
  const [highlights, setHighlights] = useState<any[]>([]);
  
  // Trainer AI State
  const [isSyncing, setIsSyncing] = useState(false);
  const [trainerAlert, setTrainerAlert] = useState<{ player: string; message: string; action: string } | null>(null);

  // Sync local state when props change
  useEffect(() => {
    setPlayers(initialPlayers);
  }, [initialPlayers]);

  // Trainer Sync Logic
  const handleTrainerSync = async () => {
    setIsSyncing(true);
    try {
      // Analyze all players (mocking sequential analysis for demo)
      for (const player of players) {
        if (player.readiness_score < 70) { // Trigger for low readiness
          const analysis = await TrainerToniAI.evaluatePlayerReadiness(player);
          if (analysis.status === 'RED' || analysis.status === 'YELLOW') {
            setTrainerAlert({
              player: player.name,
              message: analysis.message,
              action: analysis.action
            });
            break; // Show first alert only for demo
          }
        }
      }
    } catch (e) {
      console.error("Trainer sync failed", e);
    } finally {
      setIsSyncing(false);
    }
  };

  // Fetch highlights when player is selected
  useEffect(() => {
    if (selectedPlayer) {
      fetch(`/api/players/${selectedPlayer.id}/highlights`)
        .then(res => res.json())
        .then(data => setHighlights(data))
        .catch(err => console.error("Failed to fetch highlights", err));
    } else {
        setHighlights([]);
    }
  }, [selectedPlayer]);

  // OVR Calculation Logic (Average of 6 core stats)
  const calculateOVR = (stats: Player['stats']) => {
    if (!stats) return 0;
    const sum = stats.pace + stats.shooting + stats.passing + stats.dribbling + stats.defending + stats.physical;
    return Math.round(sum / 6);
  };

  // Get Card Style based on OVR
  const getCardStyle = (ovr: number) => {
    if (ovr >= 85) {
      return {
        bg: "bg-gradient-to-br from-slate-900 via-[#001240] to-cyan-900",
        border: "border-cyan-400",
        shadow: "shadow-[0_0_20px_rgba(34,211,238,0.3)]",
        text: "text-cyan-50",
        label: "ELITE",
        accent: "#22d3ee"
      };
    } else if (ovr >= 75) {
      return {
        bg: "bg-gradient-to-br from-[#ffd700] via-[#b8860b] to-[#8b6508]",
        border: "border-yellow-300",
        shadow: "shadow-[0_0_15px_rgba(255,215,0,0.3)]",
        text: "text-yellow-50",
        label: "GOLD",
        accent: "#fcd34d"
      };
    } else if (ovr >= 65) {
      return {
        bg: "bg-gradient-to-br from-[#e3e4e5] via-[#aeb1b3] to-[#757575]",
        border: "border-slate-300",
        shadow: "shadow-[0_0_10px_rgba(200,200,200,0.2)]",
        text: "text-slate-100",
        label: "SILVER",
        accent: "#e2e8f0"
      };
    } else {
      return {
        bg: "bg-gradient-to-br from-[#cd7f32] via-[#a05a2c] to-[#5c3a21]",
        border: "border-orange-900",
        shadow: "shadow-none",
        text: "text-orange-50",
        label: "BRONZE",
        accent: "#fdba74"
      };
    }
  };

  // Handle Stat Change
  const handleStatChange = (playerId: string, stat: keyof Player['stats'], value: string) => {
    const numValue = parseInt(value) || 0;
    setPlayers(prev => prev.map(p => {
      if (p.id === playerId && p.stats) {
        return {
          ...p,
          stats: { ...p.stats, [stat]: Math.min(99, Math.max(0, numValue)) }
        };
      }
      return p;
    }));
  };

  // Handle Name Change
  const handleNameChange = (playerId: string, value: string) => {
    setPlayers(prev => prev.map(p => p.id === playerId ? { ...p, name: value } : p));
  };

  // Handle Star Rating Change
  const handleStarChange = (playerId: string, rating: number) => {
    setPlayers(prev => prev.map(p => p.id === playerId ? { ...p, star_rating: rating } : p));
  };

  // Handle Status Toggle
  const toggleStatus = (player: Player) => {
    const statuses: ('GREEN' | 'YELLOW' | 'RED')[] = ['GREEN', 'YELLOW', 'RED'];
    const currentIdx = statuses.indexOf(player.status_override || 'GREEN');
    const nextStatus = statuses[(currentIdx + 1) % 3];
    
    setPlayers(prev => prev.map(p => p.id === player.id ? { ...p, status_override: nextStatus } : p));
  };

  // Open Modal
  const openModal = (player: Player) => {
    setSelectedPlayer(player);
    setIsModalOpen(true);
  };

  // Add New Player
  const handleAddPlayer = async () => {
    try {
      const res = await fetch('/api/players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: "NEW PLAYER",
          tactical_position: "Substitute"
        })
      });
      if (res.ok) {
        const data = await res.json();
        // Refresh players list
        const allPlayersRes = await fetch('/api/players');
        const allPlayers = await allPlayersRes.json();
        setPlayers(allPlayers);
      }
    } catch (e) {
      console.error("Add failed", e);
    }
  };

  // Delete Player Confirmation
  const confirmDelete = (player: Player) => {
    setPlayerToDelete(player);
    setIsDeleteConfirmOpen(true);
  };

  // Execute Delete
  const handleDelete = async () => {
    if (!playerToDelete) return;
    try {
      const res = await fetch(`/api/players/${playerToDelete.id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setPlayers(prev => prev.filter(p => p.id !== playerToDelete.id));
        setIsDeleteConfirmOpen(false);
        setPlayerToDelete(null);
        setIsModalOpen(false); // Close modal if open
      }
    } catch (e) {
      console.error("Delete failed", e);
    }
  };

  // Save Data to Backend
  const handleSave = async (player: Player) => {
    try {
      const res = await fetch(`/api/players/${player.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: player.name,
          stats: player.stats,
          biometrics: player.biometrics,
          activity: player.activity,
          star_rating: player.star_rating,
          status_override: player.status_override
        })
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data.newReadiness) {
          setPlayers(prev => prev.map(p => p.id === player.id ? { ...p, readiness_score: data.newReadiness } : p));
        }
        setIsModalOpen(false);
        setSelectedPlayer(null);
      }
    } catch (e) {
      console.error("Save failed", e);
    }
  };

  // Helper for Status UI
  const getStatusUI = (status: string) => {
    switch (status) {
      case 'GREEN': return { color: 'bg-emerald-500', text: 'text-emerald-400', label: 'MATCH READY', border: 'border-emerald-500/30' };
      case 'YELLOW': return { color: 'bg-yellow-500', text: 'text-yellow-400', label: 'LOAD MGMT', border: 'border-yellow-500/30' };
      case 'RED': return { color: 'bg-red-500', text: 'text-red-400', label: 'CRITICAL', border: 'border-red-500/30' };
      default: return { color: 'bg-emerald-500', text: 'text-emerald-400', label: 'MATCH READY', border: 'border-emerald-500/30' };
    }
  };

  return (
    <div className="h-full w-full bg-[#001240] text-slate-100 p-6 overflow-y-auto relative">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-4xl font-black text-white tracking-tighter italic flex items-center gap-3">
            <Users className="text-[#E21B4D]" />
            LOCKER ROOM
          </h2>
          <div className="h-1 w-20 bg-[#E21B4D] mt-2 skew-x-[-12deg]" />
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => selectedPlayer && onManualEntry?.(selectedPlayer)}
            disabled={!selectedPlayer}
            className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all uppercase tracking-wider text-sm ${
              !selectedPlayer 
                ? 'bg-slate-800/50 text-slate-500 cursor-not-allowed' 
                : 'bg-cyan-500 text-black hover:bg-cyan-400'
            }`}
          >
            <Activity size={20} />
            Manual Entry
          </button>
          <button 
            onClick={handleTrainerSync}
            disabled={isSyncing}
            className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all uppercase tracking-wider text-sm ${
              isSyncing 
                ? 'bg-amber-500 text-black animate-pulse' 
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-600'
            }`}
          >
            {isSyncing ? <BrainCircuit size={20} className="animate-spin" /> : <BrainCircuit size={20} />}
            {isSyncing ? 'Analyzing...' : 'Trainer Sync'}
          </button>
          <button 
            onClick={handleAddPlayer}
            className="bg-[#E21B4D] hover:bg-red-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-red-900/20 transition-all uppercase tracking-wider text-sm"
          >
            <Plus size={20} />
            Neuzugang Registrieren
          </button>
        </div>
      </div>

      {/* Trainer Alert Modal */}
      <AnimatePresence>
        {trainerAlert && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 backdrop-blur-md p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, rotate: -2 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0.9, rotate: 2 }}
              className="bg-[#0a0a0a] border-4 border-[#E21B4D] w-full max-w-lg rounded-2xl shadow-[0_0_50px_rgba(226,27,77,0.4)] p-8 relative overflow-hidden"
            >
              {/* Background Texture */}
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 pointer-events-none" />
              
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-[#E21B4D] rounded-full flex items-center justify-center shadow-lg shadow-red-900/50 animate-pulse">
                    <AlertTriangle size={32} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter leading-none">Trainer-Toni</h3>
                    <p className="text-[#E21B4D] font-mono font-bold uppercase tracking-widest text-sm">Intervention Required</p>
                  </div>
                </div>

                <div className="bg-white/5 border-l-4 border-[#E21B4D] p-6 rounded-r-xl mb-6">
                  <p className="text-xl font-black italic text-white leading-tight mb-4">
                    "{trainerAlert.message}"
                  </p>
                  <div className="flex items-center gap-2 text-slate-400 text-sm font-mono uppercase">
                    <span className="w-2 h-2 bg-[#E21B4D] rounded-full" />
                    Subject: {trainerAlert.player}
                  </div>
                </div>

                <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-lg mb-8 flex items-start gap-3">
                  <BrainCircuit className="text-amber-500 shrink-0 mt-1" size={20} />
                  <div>
                    <h4 className="text-amber-500 font-bold uppercase text-xs mb-1">Tactical Decision</h4>
                    <p className="text-white font-bold">{trainerAlert.action}</p>
                  </div>
                </div>

                <button 
                  onClick={() => setTrainerAlert(null)}
                  className="w-full bg-[#E21B4D] hover:bg-red-600 text-white font-black py-4 rounded-xl uppercase tracking-widest shadow-lg shadow-red-900/20 transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle size={20} />
                  Acknowledge & Execute
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Player Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {players.map((player, index) => {
          const ovr = calculateOVR(player.stats);
          const style = getCardStyle(ovr);
          const status = player.status_override || (player.readiness_score >= 85 ? 'GREEN' : player.readiness_score >= 65 ? 'YELLOW' : 'RED');
          const statusUI = getStatusUI(status);
          
          return (
            <motion.div 
              key={player.id} 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative group perspective"
            >
              {/* Card Container */}
              <div 
                onClick={() => openModal(player)}
                className={`relative ${style.bg} border-2 rounded-xl p-1 overflow-hidden transition-all duration-300 transform hover:-translate-y-2 hover:shadow-2xl cursor-pointer ${style.border} ${style.shadow}`}
              >
                
                {/* Texture Overlay */}
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none mix-blend-overlay" />
                <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-black/40 to-transparent z-0" />
                
                <div className="relative p-5 z-10">
                  {/* Top Row: Rating & Position */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex flex-col items-center">
                      <span className={`text-5xl font-black leading-none tracking-tighter italic ${style.text}`} style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>
                        {ovr}
                      </span>
                      <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest mt-1">OVR</span>
                    </div>
                    <div className="text-right">
                      <div className={`text-2xl font-black tracking-tight italic uppercase ${style.text}`}>{player.tactical_position.split(' ')[0]}</div>
                      
                      {/* Editable Stars */}
                      <div className="flex gap-1 justify-end mt-1" onClick={(e) => e.stopPropagation()}>
                        {[1, 2, 3, 4, 5].map(s => (
                          <button 
                            key={s} 
                            onClick={() => handleStarChange(player.id, s)}
                            className="focus:outline-none transform active:scale-90 transition-transform"
                          >
                            <Star 
                              size={12} 
                              className={`${s <= (player.star_rating || 3) ? "fill-white text-white" : "text-black/40"}`} 
                              style={{ filter: s <= (player.star_rating || 3) ? 'drop-shadow(0 0 2px rgba(255,255,255,0.8))' : 'none' }}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Player Name & Image Placeholder */}
                  <div className="mb-6 text-center relative">
                    <div className={`w-28 h-28 mx-auto bg-black/20 rounded-full mb-3 border-4 flex items-center justify-center overflow-hidden shadow-lg backdrop-blur-sm group/image relative`}
                         style={{ borderColor: style.accent }}>
                      {player.image_url ? (
                        <img src={player.image_url} alt={player.name} className="w-full h-full object-cover" />
                      ) : (
                        <Users size={48} className="text-white/80" />
                      )}
                      {/* Photo Upload Placeholder Overlay */}
                      <div 
                        className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover/image:opacity-100 transition-opacity cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          const url = prompt("Enter Image URL:", player.image_url || "");
                          if (url) {
                            setPlayers(prev => prev.map(p => p.id === player.id ? { ...p, image_url: url } : p));
                            fetch(`/api/players/${player.id}`, {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ ...player, image_url: url })
                            });
                          }
                        }}
                      >
                        <Camera size={24} className="text-white" />
                      </div>
                    </div>
                    
                    {/* Editable Name */}
                    <input 
                      type="text"
                      value={player.name}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => handleNameChange(player.id, e.target.value)}
                      className={`w-full bg-transparent text-2xl font-black tracking-tight uppercase text-center italic focus:outline-none focus:border-b-2 transition-all ${style.text}`}
                      style={{ borderColor: style.accent }}
                    />
                    
                    {/* Editable Status Badge */}
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleStatus(player); }}
                      className={`w-full mt-2 py-1 px-3 rounded-sm border ${statusUI.border} bg-black/30 backdrop-blur-md flex items-center justify-center gap-2 transition-all hover:bg-black/50`}
                    >
                      <div className={`w-2 h-2 rounded-full ${statusUI.color} animate-pulse`} />
                      <span className={`text-[10px] font-bold uppercase tracking-widest ${statusUI.text}`}>
                        {statusUI.label}
                      </span>
                    </button>
                  </div>

                  {/* Stats Grid - Editable */}
                  <div className="grid grid-cols-2 gap-y-2 gap-x-6 text-sm bg-black/20 p-3 rounded-lg border border-white/10 backdrop-blur-sm" onClick={(e) => e.stopPropagation()}>
                    {player.stats && Object.entries(player.stats).map(([key, value]) => (
                      <div key={key} className="flex justify-between items-center border-b border-white/5 pb-1 last:border-0">
                        <span className="text-white/60 font-bold tracking-wider text-xs uppercase">{key.substring(0, 3)}</span>
                        <input 
                          type="number"
                          value={value}
                          onChange={(e) => handleStatChange(player.id, key as any, e.target.value)}
                          className={`w-12 bg-transparent text-right font-black text-lg focus:outline-none italic ${style.text}`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Modal Overlay */}
      <AnimatePresence>
        {isModalOpen && selectedPlayer && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#001240]/90 backdrop-blur-md p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-[#061A40] border-2 border-white/10 w-full max-w-5xl max-h-[95vh] overflow-y-auto rounded-2xl shadow-2xl flex flex-col"
            >
              {/* Modal Header */}
              <div className="flex justify-between items-center p-6 border-b border-white/10 bg-[#061A40] sticky top-0 z-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#E21B4D] rounded-full flex items-center justify-center shadow-lg shadow-red-900/50">
                    <Users size={24} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-3xl font-black text-white italic tracking-tighter uppercase">{selectedPlayer.name}</h3>
                    <p className="text-slate-400 text-sm font-mono uppercase tracking-widest">Bio-Metrics & Activity Data Entry</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => confirmDelete(selectedPlayer)}
                    className="p-2 hover:bg-red-500/20 rounded-full text-red-500 hover:text-red-400 transition-colors mr-2"
                    title="Remove Player"
                  >
                    <Trash2 size={24} />
                  </button>
                  <button 
                    onClick={() => setIsModalOpen(false)}
                    className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Section 1: Bio-Metrics (Scale) */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3 text-[#E21B4D] mb-4 border-b border-[#E21B4D]/30 pb-2">
                    <Scale size={24} />
                    <h4 className="text-xl font-black uppercase tracking-tighter italic">Smart Scale Data</h4>
                  </div>
                  
                  <div className="bg-[#001240] p-6 rounded-xl border border-white/10 space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Weight (kg)</label>
                      <input 
                        type="number" 
                        defaultValue={selectedPlayer.biometrics?.weight || 78}
                        onChange={(e) => setSelectedPlayer({...selectedPlayer, biometrics: {...selectedPlayer.biometrics!, weight: parseFloat(e.target.value)}})}
                        className="w-full bg-[#061A40] border border-white/10 rounded-lg p-3 text-white font-mono focus:border-[#E21B4D] focus:outline-none focus:ring-1 focus:ring-[#E21B4D]"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Body Fat (%)</label>
                        <input 
                          type="number" 
                          defaultValue={selectedPlayer.biometrics?.body_fat || 10.5}
                          onChange={(e) => setSelectedPlayer({...selectedPlayer, biometrics: {...selectedPlayer.biometrics!, body_fat: parseFloat(e.target.value)}})}
                          className="w-full bg-[#061A40] border border-white/10 rounded-lg p-3 text-white font-mono focus:border-[#E21B4D] focus:outline-none focus:ring-1 focus:ring-[#E21B4D]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Muscle Mass (kg)</label>
                        <input 
                          type="number" 
                          defaultValue={selectedPlayer.biometrics?.muscle_mass || 42}
                          onChange={(e) => setSelectedPlayer({...selectedPlayer, biometrics: {...selectedPlayer.biometrics!, muscle_mass: parseFloat(e.target.value)}})}
                          className="w-full bg-[#061A40] border border-white/10 rounded-lg p-3 text-white font-mono focus:border-[#E21B4D] focus:outline-none focus:ring-1 focus:ring-[#E21B4D]"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 2: Activity (Watch) */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3 text-[#FFCC00] mb-4 border-b border-[#FFCC00]/30 pb-2">
                    <Watch size={24} />
                    <h4 className="text-xl font-black uppercase tracking-tighter italic">Smart Watch Sync</h4>
                  </div>
                  
                  <div className="bg-[#001240] p-6 rounded-xl border border-white/10 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1 flex items-center gap-1"><HeartPulse size={12}/> Avg HR (bpm)</label>
                        <input 
                          type="number" 
                          defaultValue={selectedPlayer.activity?.resting_hr || 48}
                          onChange={(e) => setSelectedPlayer({...selectedPlayer, activity: {...selectedPlayer.activity!, resting_hr: parseInt(e.target.value)}})}
                          className="w-full bg-[#061A40] border border-white/10 rounded-lg p-3 text-white font-mono focus:border-[#FFCC00] focus:outline-none focus:ring-1 focus:ring-[#FFCC00]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1 flex items-center gap-1"><Activity size={12}/> HRV (ms)</label>
                        <input 
                          type="number" 
                          defaultValue={65} // Mock default
                          className="w-full bg-[#061A40] border border-white/10 rounded-lg p-3 text-white font-mono focus:border-[#FFCC00] focus:outline-none focus:ring-1 focus:ring-[#FFCC00]"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1 flex items-center gap-1"><Moon size={12}/> Sleep Phases (Deep / REM)</label>
                      <div className="grid grid-cols-2 gap-4">
                        <input 
                          type="text" 
                          defaultValue={selectedPlayer.sleep_cycles?.deep_sleep || "2h 15m"}
                          className="w-full bg-[#061A40] border border-white/10 rounded-lg p-3 text-white font-mono focus:border-[#FFCC00] focus:outline-none focus:ring-1 focus:ring-[#FFCC00]"
                          placeholder="Deep Sleep"
                        />
                         <input 
                          type="text" 
                          defaultValue={selectedPlayer.sleep_cycles?.rem || "1h 45m"}
                          className="w-full bg-[#061A40] border border-white/10 rounded-lg p-3 text-white font-mono focus:border-[#FFCC00] focus:outline-none focus:ring-1 focus:ring-[#FFCC00]"
                          placeholder="REM Sleep"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 3: Highlights (New) */}
                <div className="md:col-span-2 space-y-6">
                    <div className="flex items-center gap-3 text-red-500 mb-4 border-b border-red-500/30 pb-2">
                        <Activity size={24} />
                        <h4 className="text-xl font-black uppercase tracking-tighter italic">Matchday Highlights</h4>
                    </div>
                    {highlights.length > 0 ? (
                        <div className="grid grid-cols-2 gap-4">
                            {highlights.map((highlight: any) => (
                                <div key={highlight.id} className="group relative aspect-video bg-black rounded-xl overflow-hidden border border-white/10 hover:border-red-600 transition-colors cursor-pointer">
                                    <video src={highlight.data.videoUrl} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" muted loop />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-90" />
                                    <div className="absolute bottom-0 left-0 right-0 p-4">
                                        <div className="flex justify-between items-end">
                                            <div>
                                                <div className="text-[10px] font-bold text-red-500 uppercase tracking-widest mb-1">
                                                    {highlight.data.timestamp}
                                                </div>
                                                <h4 className="text-lg font-black italic leading-none mb-1">{highlight.data.headline}</h4>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="h-32 border-2 border-dashed border-white/10 rounded-xl flex items-center justify-center text-slate-500">
                            <p className="font-mono text-sm">No highlights available yet.</p>
                        </div>
                    )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-white/10 bg-[#061A40] flex justify-end gap-4 sticky bottom-0 z-10">
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-3 rounded-xl text-slate-400 hover:text-white font-bold transition-colors uppercase tracking-wider text-sm"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => handleSave(selectedPlayer)}
                  className="px-8 py-3 bg-[#E21B4D] hover:bg-red-600 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-red-900/20 transition-all uppercase tracking-wider text-sm"
                >
                  <Save size={18} />
                  Save & Sync
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {isDeleteConfirmOpen && playerToDelete && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-md p-4"
          >
            <motion.div 
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-[#061A40] border-2 border-red-500 w-full max-w-md rounded-2xl shadow-2xl p-6 text-center"
            >
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={32} className="text-red-500" />
              </div>
              <h3 className="text-2xl font-black text-white italic uppercase mb-2">Manager Alert</h3>
              <p className="text-slate-300 mb-6 font-medium">
                "Coach, sind Sie sicher? Der Verkauf oder die Freistellung von <span className="text-[#E21B4D] font-bold">{playerToDelete.name}</span> hat direkte Auswirkungen auf die Kaderbreite und den Team-Marktwert."
              </p>
              <div className="flex gap-4 justify-center">
                <button 
                  onClick={() => setIsDeleteConfirmOpen(false)}
                  className="px-6 py-3 rounded-xl text-slate-400 hover:text-white font-bold transition-colors uppercase tracking-wider text-sm"
                >
                  Abbrechen
                </button>
                <button 
                  onClick={handleDelete}
                  className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-lg transition-all uppercase tracking-wider text-sm flex items-center gap-2"
                >
                  <Trash2 size={16} />
                  Bestätigen
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
