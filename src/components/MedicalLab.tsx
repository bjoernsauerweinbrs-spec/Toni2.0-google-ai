import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  BarChart, Bar, Legend
} from 'recharts';
import { Activity, Heart, Moon, AlertTriangle, Stethoscope, Brain, Flame, Thermometer, TrendingUp } from 'lucide-react';
import { Player } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface MedicalLabProps {
  players: Player[];
  onManualEntry?: (player: Player) => void;
}

export default function MedicalLab({ players, onManualEntry }: MedicalLabProps) {
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>(players[0]?.id || '');
  const [doctorBriefing, setDoctorBriefing] = useState<string | null>(null);
  const [isLoadingBriefing, setIsLoadingBriefing] = useState(false);

  const selectedPlayer = players.find(p => p.id === selectedPlayerId) || players[0];

  useEffect(() => {
    if (players.length > 0 && !selectedPlayerId) {
      setSelectedPlayerId(players[0].id);
    }
  }, [players]);

  const generateBriefing = async () => {
    setIsLoadingBriefing(true);
    try {
      const res = await fetch('/api/medical/briefing');
      const data = await res.json();
      setDoctorBriefing(data.message);
    } catch (e) {
      console.error("Briefing failed", e);
    } finally {
      setIsLoadingBriefing(false);
    }
  };

  if (!selectedPlayer) return <div className="p-8 text-white">Loading Medical Data...</div>;

  // Mock Data for Charts (if real data is missing/partial)
  const spiderData = [
    { subject: 'Speed', A: selectedPlayer.stats?.pace || 70, fullMark: 100 },
    { subject: 'Stamina', A: selectedPlayer.scouting_metrics?.stamina || 80, fullMark: 100 },
    { subject: 'Power', A: selectedPlayer.stats?.physical || 75, fullMark: 100 },
    { subject: 'Recovery', A: selectedPlayer.scouting_metrics?.recovery || 85, fullMark: 100 },
    { subject: 'Agility', A: selectedPlayer.scouting_metrics?.agility || 78, fullMark: 100 },
  ];

  const sleepData = [
    { name: 'Deep', hours: parseFloat(selectedPlayer.sleep_cycles?.deep_sleep || '0') },
    { name: 'REM', hours: parseFloat(selectedPlayer.sleep_cycles?.rem || '0') },
    { name: 'Light', hours: 4 }, // Mock
  ];

  const correlationData = [
    { day: 'Mon', load: 80, recovery: 75 },
    { day: 'Tue', load: 90, recovery: 60 },
    { day: 'Wed', load: 60, recovery: 85 },
    { day: 'Thu', load: 85, recovery: 70 },
    { day: 'Fri', load: 95, recovery: 55 },
    { day: 'Sat', load: 40, recovery: 90 },
    { day: 'Sun', load: 100, recovery: 40 },
  ];

  return (
    <div className="h-full w-full bg-[#001240] text-slate-100 p-6 overflow-y-auto relative">
      {/* Background Texture */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none" />

      {/* Header */}
      <div className="flex justify-between items-center mb-8 relative z-10">
        <div>
          <h2 className="text-4xl font-black text-white tracking-tighter italic flex items-center gap-3">
            <Activity className="text-cyan-400" />
            ANALYSEZENTRUM
          </h2>
          <div className="h-1 w-20 bg-cyan-400 mt-2 skew-x-[-12deg]" />
          <p className="text-cyan-400/60 mt-1 font-mono text-xs uppercase tracking-widest">Medical & Performance Lab</p>
          <button 
            onClick={() => onManualEntry?.(selectedPlayer)}
            className="mt-4 flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/30 rounded-lg hover:bg-cyan-500/20 transition-all text-cyan-400 text-xs font-black uppercase tracking-widest"
          >
            <Activity size={14} /> Manual Entry
          </button>
        </div>
        
        {/* Doctor Persona Trigger */}
        <div className="flex items-center gap-4">
          <AnimatePresence>
            {doctorBriefing && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-cyan-900/20 border border-cyan-500/30 p-3 rounded-xl max-w-md text-right backdrop-blur-md"
              >
                <p className="text-cyan-100 text-sm font-medium italic">"{doctorBriefing}"</p>
              </motion.div>
            )}
          </AnimatePresence>
          
          <button 
            onClick={generateBriefing}
            disabled={isLoadingBriefing}
            className="relative group"
          >
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 p-[2px] shadow-[0_0_20px_rgba(34,211,238,0.4)] transition-transform group-hover:scale-105">
              <div className="w-full h-full rounded-full bg-[#001240] flex items-center justify-center overflow-hidden">
                <Stethoscope size={24} className={`text-cyan-400 ${isLoadingBriefing ? 'animate-pulse' : ''}`} />
              </div>
            </div>
            <div className="absolute -bottom-2 -right-2 bg-[#001240] text-cyan-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-cyan-500/50">
              DR. TONI
            </div>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
        {/* Left Column: Roster & Red Zone */}
        <div className="lg:col-span-3 space-y-6">
          {/* Red Zone Alert */}
          {players.some(p => p.readiness_score < 65) && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-900/20 border-l-4 border-red-500 p-4 rounded-r-xl backdrop-blur-sm"
            >
              <div className="flex items-center gap-2 text-red-500 mb-2">
                <AlertTriangle size={20} />
                <h3 className="font-black uppercase tracking-wider text-sm">Red Zone Alert</h3>
              </div>
              <div className="space-y-1">
                {players.filter(p => p.readiness_score < 65).map(p => (
                  <div key={p.id} className="flex justify-between text-xs text-red-200 font-mono">
                    <span>{p.name}</span>
                    <span className="font-bold">{p.readiness_score}%</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Player List */}
          <div className="bg-[#061A40]/80 border border-white/5 rounded-2xl p-4 h-[600px] overflow-y-auto custom-scrollbar">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 sticky top-0 bg-[#061A40] py-2">Squad Status</h3>
            <div className="space-y-2">
              {players.map(player => (
                <button
                  key={player.id}
                  onClick={() => setSelectedPlayerId(player.id)}
                  className={`w-full text-left p-3 rounded-xl border transition-all duration-200 flex items-center justify-between group ${
                    selectedPlayer.id === player.id 
                      ? 'bg-cyan-900/20 border-cyan-500/50 shadow-[0_0_15px_rgba(34,211,238,0.1)]' 
                      : 'bg-white/5 border-transparent hover:bg-white/10'
                  }`}
                >
                  <div>
                    <div className={`font-bold text-sm ${selectedPlayer.id === player.id ? 'text-cyan-100' : 'text-slate-300'}`}>{player.name}</div>
                    <div className="text-[10px] text-slate-500 font-mono uppercase">{player.tactical_position}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${
                      player.readiness_score >= 85 ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]' : 
                      player.readiness_score >= 65 ? 'bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.6)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]'
                    }`} />
                    <span className={`font-mono font-bold text-xs ${
                      player.readiness_score >= 85 ? 'text-emerald-400' : 
                      player.readiness_score >= 65 ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {player.readiness_score}%
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Dashboard */}
        <div className="lg:col-span-9 space-y-6">
          {/* Top Row: Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Readiness */}
            <div className="bg-[#061A40]/80 border border-white/10 p-5 rounded-2xl relative overflow-hidden group hover:border-cyan-500/30 transition-colors">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Brain size={64} className="text-white" />
              </div>
              <div className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-2">Readiness Score</div>
              <div className="text-5xl font-black text-white flex items-baseline gap-2 italic tracking-tighter">
                {selectedPlayer.readiness_score}
                <span className="text-sm text-slate-500 font-normal not-italic">%</span>
              </div>
              <div className={`mt-2 text-xs font-bold uppercase tracking-wider ${
                 selectedPlayer.readiness_score >= 85 ? 'text-emerald-400' : 
                 selectedPlayer.readiness_score >= 65 ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {selectedPlayer.readiness_score >= 85 ? 'Elite Condition' : selectedPlayer.readiness_score >= 65 ? 'Load Mgmt' : 'Recovery Needed'}
              </div>
            </div>

            {/* HRV */}
            <div className="bg-[#061A40]/80 border border-white/10 p-5 rounded-2xl relative overflow-hidden group hover:border-cyan-500/30 transition-colors">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Activity size={64} className="text-cyan-400" />
              </div>
              <div className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-2">HRV Status</div>
              <div className="text-4xl font-black text-cyan-400 flex items-baseline gap-2 italic tracking-tighter">
                {selectedPlayer.hrv_data && selectedPlayer.hrv_data.length > 0 
                  ? Math.round(selectedPlayer.hrv_data[selectedPlayer.hrv_data.length - 1].value) 
                  : '--'}
                <span className="text-sm text-slate-500 font-normal not-italic">ms</span>
              </div>
              <div className="mt-2 text-xs text-slate-400 flex items-center gap-1">
                <TrendingUp size={12} />
                <span>7-day avg: Stable</span>
              </div>
            </div>

            {/* Sleep */}
            <div className="bg-[#061A40]/80 border border-white/10 p-5 rounded-2xl relative overflow-hidden group hover:border-indigo-500/30 transition-colors">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Moon size={64} className="text-indigo-400" />
              </div>
              <div className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-2">Sleep Quality</div>
              <div className="text-4xl font-black text-indigo-400 flex items-baseline gap-2 italic tracking-tighter">
                92
                <span className="text-sm text-slate-500 font-normal not-italic">QS</span>
              </div>
              <div className="mt-2 text-xs text-slate-400">
                Deep: {selectedPlayer.sleep_cycles?.deep_sleep} • REM: {selectedPlayer.sleep_cycles?.rem}
              </div>
            </div>

             {/* Load */}
             <div className="bg-[#061A40]/80 border border-white/10 p-5 rounded-2xl relative overflow-hidden group hover:border-orange-500/30 transition-colors">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Flame size={64} className="text-orange-400" />
              </div>
              <div className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-2">Training Load</div>
              <div className="text-4xl font-black text-orange-400 flex items-baseline gap-2 italic tracking-tighter">
                High
              </div>
              <div className="mt-2 text-xs text-slate-400">
                {selectedPlayer.activity?.calories_burned || 0} kcal burned
              </div>
            </div>
          </div>

          {/* Middle Row: Spider Chart & Sleep Architecture */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Biometric Spider Chart */}
            <div className="bg-[#061A40]/80 border border-white/10 p-6 rounded-2xl">
              <h4 className="text-sm font-bold text-white mb-6 flex items-center gap-2 uppercase tracking-wider">
                <Thermometer size={16} className="text-cyan-400" />
                Biometric Profile vs Season Peak
              </h4>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={spiderData}>
                    <PolarGrid stroke="#334155" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar
                      name="Current"
                      dataKey="A"
                      stroke="#22d3ee"
                      strokeWidth={2}
                      fill="#22d3ee"
                      fillOpacity={0.3}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f1f5f9' }}
                      itemStyle={{ color: '#22d3ee' }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Sleep Architecture */}
            <div className="bg-[#061A40]/80 border border-white/10 p-6 rounded-2xl">
              <h4 className="text-sm font-bold text-white mb-6 flex items-center gap-2 uppercase tracking-wider">
                <Moon size={16} className="text-indigo-400" />
                Sleep Architecture (Last Night)
              </h4>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sleepData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                    <XAxis type="number" stroke="#64748b" tick={{fill: '#64748b', fontSize: 10}} />
                    <YAxis dataKey="name" type="category" stroke="#64748b" tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 'bold'}} width={50} />
                    <Tooltip 
                      cursor={{fill: 'rgba(255,255,255,0.05)'}}
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f1f5f9' }}
                    />
                    <Bar dataKey="hours" fill="#818cf8" radius={[0, 4, 4, 0]} barSize={30} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Bottom Row: Correlation Engine */}
          <div className="bg-[#061A40]/80 border border-white/10 p-6 rounded-2xl">
            <h4 className="text-sm font-bold text-white mb-6 flex items-center gap-2 uppercase tracking-wider">
              <Activity size={16} className="text-emerald-400" />
              Correlation Engine: Load vs Recovery
            </h4>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={correlationData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="day" stroke="#64748b" tick={{fill: '#64748b', fontSize: 12}} axisLine={false} tickLine={false} />
                  <YAxis stroke="#64748b" tick={{fill: '#64748b', fontSize: 12}} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f1f5f9' }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="load" name="Training Load" stroke="#f97316" strokeWidth={2} dot={{r: 4}} activeDot={{r: 6}} />
                  <Line type="monotone" dataKey="recovery" name="Recovery Rate" stroke="#10b981" strokeWidth={2} dot={{r: 4}} activeDot={{r: 6}} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
