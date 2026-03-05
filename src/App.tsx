import React, { useState } from 'react';
import { LayoutDashboard, Users, Briefcase, Activity, Menu, X, Settings, LogOut, BookOpen, Video } from 'lucide-react';
import TacticalBoard from './components/TacticalBoard';
import MedicalLab from './components/MedicalLab';
import LockerRoom from './components/LockerRoom';
import BriefcaseModule from './components/Briefcase';
import ChatInterface from './components/ChatInterface';
import PerformanceJournal from './components/PerformanceJournal';
import VideoAnalysisCenter from './components/VideoAnalysisCenter';
import VRSpace from './components/VRSpace';
import { ManualEntryModal } from './components/ManualEntryModal';
import { Persona, Player } from './types';
import { motion, AnimatePresence } from 'motion/react';

function App() {
  const [activeModule, setActiveModule] = useState<'TACTICS' | 'MEDICAL' | 'LOCKER' | 'BRIEFCASE' | 'JOURNAL' | 'VIDEO'>('TACTICS');
  const [activePersona, setActivePersona] = useState<Persona>('TRAINER');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [players, setPlayers] = useState<Player[]>([]);
  const [isGameMode, setIsGameMode] = useState(false);
  const [isVRMode, setIsVRMode] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [entryPersona, setEntryPersona] = useState<'DOCTOR' | 'TRAINER' | 'MANAGER'>('DOCTOR');

  // Fetch players from backend
  const fetchPlayers = () => {
    fetch('/api/players')
      .then(res => res.json())
      .then(data => setPlayers(data))
      .catch(err => console.error("Failed to fetch players", err));
  };

  const handleUpdatePlayer = (updatedPlayer: Partial<Player>) => {
    if (!editingPlayer) return;
    
    fetch(`/api/players/${editingPlayer.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedPlayer)
    })
    .then(res => res.json())
    .then(() => {
      fetchPlayers();
      setEditingPlayer(null);
    })
    .catch(err => console.error("Failed to update player", err));
  };

  const openManualEntry = (player: Player, persona: Persona) => {
    setEditingPlayer(player);
    // Map COACH to TRAINER for the modal if needed, or just cast
    setEntryPersona(persona as any);
  };

  React.useEffect(() => {
    fetchPlayers();
  }, []);

  const navItems = [
    { id: 'TACTICS', label: 'Tactical Hub', icon: <LayoutDashboard size={20} /> },
    { id: 'MEDICAL', label: 'Medical Lab', icon: <Activity size={20} /> },
    { id: 'LOCKER', label: 'Locker Room', icon: <Users size={20} /> },
    { id: 'VIDEO', label: 'Video Lab', icon: <Video size={20} /> },
    { id: 'BRIEFCASE', label: 'Briefcase', icon: <Briefcase size={20} /> },
    { id: 'JOURNAL', label: 'Stark Journal', icon: <BookOpen size={20} /> },
  ];

  return (
    <div className="flex h-screen bg-[#001240] text-slate-100 font-sans overflow-hidden">
      {/* VR Overlay */}
      <AnimatePresence>
        {isVRMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100]"
          >
            <VRSpace 
              players={players} 
              onExit={() => setIsVRMode(false)} 
              onUpdatePlayers={setPlayers} 
              onManualEntry={openManualEntry}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside 
        initial={{ width: 280 }}
        animate={{ width: isSidebarOpen ? 280 : 80 }}
        className="bg-[#061A40] border-r border-white/10 flex flex-col z-20 shadow-2xl"
      >
        {/* Logo Area */}
        <div className="h-20 flex items-center px-6 border-b border-white/10 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-[#E21B4D]/20 to-transparent opacity-50" />
          <div className="flex items-center gap-3 z-10">
            <div className="w-10 h-10 bg-[#E21B4D] rounded-full flex items-center justify-center shadow-lg shadow-red-900/50">
              <span className="font-black text-white text-xl italic">RB</span>
            </div>
            {isSidebarOpen && (
              <div>
                <h1 className="font-black text-xl tracking-tighter italic text-white">TONI <span className="text-[#E21B4D]">2.0</span></h1>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest">Elite Management</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 px-3 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveModule(item.id as any)}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden ${
                activeModule === item.id 
                  ? 'bg-white text-[#001240] shadow-lg font-bold' 
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              {activeModule === item.id && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#E21B4D]" />
              )}
              <span className="z-10">{item.icon}</span>
              {isSidebarOpen && <span className="z-10 tracking-wide">{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-white/10 bg-[#041230]">
          <div className={`flex items-center gap-3 ${!isSidebarOpen && 'justify-center'}`}>
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#E21B4D] to-[#FFCC00] p-[2px]">
              <div className="w-full h-full rounded-full bg-[#001240] flex items-center justify-center">
                <span className="font-bold text-xs">JD</span>
              </div>
            </div>
            {isSidebarOpen && (
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-bold text-white truncate">Julian D.</p>
                <p className="text-xs text-slate-400 truncate">Head Coach</p>
              </div>
            )}
            {isSidebarOpen && (
              <button className="text-slate-400 hover:text-white transition-colors">
                <Settings size={18} />
              </button>
            )}
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#001240] relative">
        {/* Top Bar */}
        <header className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-[#061A40]/80 backdrop-blur-md z-10">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-white/10 rounded-lg text-slate-300 transition-colors"
          >
            {isSidebarOpen ? <Menu size={20} /> : <Menu size={20} />}
          </button>
          
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setIsVRMode(true)}
              className="flex items-center gap-2 px-4 py-1.5 bg-cyan-500/10 border border-cyan-500/20 rounded-full hover:bg-cyan-500/20 transition-all group"
            >
              <div className="w-2 h-2 bg-cyan-400 rounded-full group-hover:scale-125 transition-transform" />
              <span className="text-xs font-black italic text-cyan-400 uppercase tracking-wider">Enter VR Mode</span>
            </button>
            <div className="flex items-center gap-2 px-4 py-1.5 bg-red-500/10 border border-red-500/20 rounded-full">
              <div className="w-2 h-2 bg-[#E21B4D] rounded-full animate-pulse" />
              <span className="text-xs font-bold text-[#E21B4D] uppercase tracking-wider">Live Session</span>
            </div>
            <div className="text-right hidden md:block">
              <p className="text-xs text-slate-400 font-mono">{new Date().toLocaleDateString()}</p>
              <p className="text-sm font-bold text-white font-mono">{new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
            </div>
          </div>
        </header>

        {/* Module View */}
        <div className="flex-1 overflow-hidden relative">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-5 pointer-events-none" />
          
          <AnimatePresence mode="wait">
            <motion.div
              key={activeModule}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="h-full w-full"
            >
              {activeModule === 'TACTICS' && (
                <TacticalBoard 
                  isActive={isGameMode} 
                  onToggleGameMode={() => setIsGameMode(!isGameMode)} 
                />
              )}
              {activeModule === 'MEDICAL' && (
                <MedicalLab 
                  players={players} 
                  onManualEntry={(p) => openManualEntry(p, 'DOCTOR')} 
                />
              )}
              {activeModule === 'LOCKER' && (
                <LockerRoom 
                  players={players} 
                  onManualEntry={(p) => openManualEntry(p, 'TRAINER')} 
                />
              )}
              {activeModule === 'VIDEO' && <VideoAnalysisCenter players={players} />}
              {activeModule === 'BRIEFCASE' && <BriefcaseModule />}
              {activeModule === 'JOURNAL' && <PerformanceJournal players={players} onUpdate={fetchPlayers} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* AI Chat Sidebar (Right) */}
      <aside className="w-96 border-l border-white/10 bg-[#061A40] z-20 shadow-2xl flex flex-col">
        <ChatInterface activePersona={activePersona} onPersonaChange={setActivePersona} />
      </aside>

      {/* Manual Entry Modal */}
      {editingPlayer && (
        <ManualEntryModal
          isOpen={!!editingPlayer}
          onClose={() => setEditingPlayer(null)}
          player={editingPlayer}
          onSave={handleUpdatePlayer}
          persona={entryPersona}
        />
      )}
    </div>
  );
}

export default App;
