import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Newspaper, Edit3, Eye, Search, Mic, Camera, 
  ChevronRight, ChevronLeft, Layout, Share2, Save, Plus, Trash2, Move, Type as TypeIcon, Image as ImageIcon,
  Play, Pause, CheckCircle, ArrowLeft, ZoomIn, ZoomOut, Activity, HeartPulse
} from 'lucide-react';
import { Player } from '../types';

interface JournalProps {
  players: Player[];
  onUpdate: () => void;
}

interface InterviewLine {
  speaker: string;
  text: string;
}

interface OpponentData {
  last_matches: string[];
  key_players: string[];
  formation: string;
  summary: string;
}

type PageType = 'COVER' | 'INTERVIEW' | 'PREVIEW' | 'SQUAD' | 'ARTICLE' | 'HIGHLIGHTS' | 'MEDICAL';

interface PageConfig {
  id: string;
  type: PageType;
  data?: any;
}

export default function PerformanceJournal({ players, onUpdate }: JournalProps) {
  const [isEditorMode, setIsEditorMode] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [summary, setSummary] = useState("");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Dynamic Pages State
  const [pages, setPages] = useState<PageConfig[]>([]);

  // Fetch pages from server
  useEffect(() => {
    fetch('/api/journal/pages')
      .then(res => res.json())
      .then(data => setPages(data))
      .catch(err => console.error("Failed to fetch journal pages", err));
  }, []);

  // --- Helper to update page data ---
  const updatePageData = (id: string, newData: any) => {
    const updatedPages = pages.map(p => p.id === id ? { ...p, data: { ...p.data, ...newData } } : p);
    setPages(updatedPages);
    // Sync to server (debounced in real app)
    fetch('/api/journal/pages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pages: updatedPages })
    });
  };

  // --- AI Actions ---

  const generateOpponentData = async (teamName: string) => {
    try {
      const res = await fetch('/api/journal/opponent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamName })
      });
      const data = await res.json();
      return data.analysis as OpponentData;
    } catch (e) {
      console.error("Opponent analysis failed", e);
      return null;
    }
  };

  const generateInterview = async (topic: string, interviewee: string) => {
    try {
      const res = await fetch('/api/journal/interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, interviewee })
      });
      const data = await res.json();
      return data.interview as InterviewLine[];
    } catch (e) {
      console.error("Interview generation failed", e);
      return [];
    }
  };

  const generateSummary = async () => {
    try {
      const res = await fetch('/api/journal/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pages })
      });
      const data = await res.json();
      setSummary(data.summary);
      return data.summary;
    } catch (e) {
      console.error("Summary failed", e);
      return "Ready for review.";
    }
  };

  const generateTTS = async (text: string) => {
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      const data = await res.json();
      if (data.audio) {
        const blob = new Blob([Uint8Array.from(atob(data.audio), c => c.charCodeAt(0))], { type: 'audio/mp3' });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        // Auto-play
        setTimeout(() => {
            if (audioRef.current) {
                audioRef.current.src = url;
                audioRef.current.play();
                setIsPlaying(true);
            }
        }, 500);
      }
    } catch (e) {
      console.error("TTS failed", e);
    }
  };

  const handleEnterPreview = async () => {
    setIsPreviewMode(true);
    setIsEditorMode(false);
    const text = await generateSummary();
    if (text) generateTTS(text);
  };

  const handleFinalize = async () => {
    // Save to Briefcase
    try {
        await fetch('/api/briefcase/articles', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: `ISSUE #${pages[0].data.issue || 42}`,
                subtitle: pages[0].data.title || 'MATCHDAY READY',
                content: summary,
                author: 'Presse-Toni',
                tags: ['JOURNAL', 'ISSUE']
            })
        });
        alert("Journal finalized and sent to Briefcase!");
        setIsPreviewMode(false);
    } catch (e) {
        console.error("Finalize failed", e);
    }
  };

  // --- Page Management ---

  const addPage = (type: PageType) => {
    const newPage: PageConfig = {
      id: `${type.toLowerCase()}-${Date.now()}`,
      type,
      data: type === 'INTERVIEW' ? { topic: '', interviewee: 'The Coach', lines: [] } : {}
    };
    const newPages = [...pages];
    newPages.splice(currentPage + 1, 0, newPage);
    setPages(newPages);
    setCurrentPage(currentPage + 1);
  };

  const removePage = () => {
    if (pages.length <= 1) return;
    const newPages = pages.filter((_, i) => i !== currentPage);
    setPages(newPages);
    setCurrentPage(Math.max(0, currentPage - 1));
  };

  // --- Components ---

  const CoverPage = ({ page }: { page: PageConfig }) => (
    <div className="h-full w-full relative bg-black flex flex-col justify-between p-8 overflow-hidden group">
      {/* Background Image */}
      <div className="absolute inset-0 opacity-60">
        <img 
          src="https://images.unsplash.com/photo-1517927033932-b3d18e61fb3a?q=80&w=2500&auto=format&fit=crop" 
          className="w-full h-full object-cover grayscale contrast-125"
          alt="Cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/50" />
      </div>

      {/* Header */}
      <div className="relative z-10 flex justify-between items-start border-b border-white/20 pb-4">
        <div>
          <h1 className="text-6xl font-black text-white italic tracking-tighter leading-none">
            STARK<br/><span className="text-red-600">PERFORMANCE</span>
          </h1>
          <p className="text-white/80 font-mono text-sm mt-2 tracking-[0.2em] uppercase">The Official Journal • Issue #{page.data.issue || 42}</p>
        </div>
        <div className="text-right">
          <div className="bg-red-600 text-white font-bold px-3 py-1 text-xs inline-block transform -skew-x-12">
            EXCLUSIVE
          </div>
          <p className="text-white font-bold text-xl mt-2">INSIDE THE LAB</p>
        </div>
      </div>

      {/* Main Headline */}
      <div className="relative z-10 mt-auto mb-12">
        {isEditorMode ? (
          <input 
            className="bg-transparent text-8xl font-black text-white italic tracking-tighter w-full border-none focus:ring-0 placeholder-white/50"
            value={page.data.title || "MATCHDAY READY"}
            onChange={(e) => updatePageData(page.id, { title: e.target.value })}
          />
        ) : (
          <h2 className="text-8xl font-black text-white italic tracking-tighter leading-[0.8]">
            {page.data.title?.split(' ').map((word: string, i: number) => (
                <span key={i}>{word}<br/></span>
            )) || <>MATCHDAY<br/>READY</>}
          </h2>
        )}
        <div className="h-2 w-32 bg-red-600 mt-6" />
      </div>

      {/* Footer - URL REMOVED */}
      <div className="relative z-10 flex justify-between items-end text-xs font-mono text-white/60">
        <p>POWERED BY PRESSE-TONI AI</p>
      </div>
    </div>
  );

  const ArticlePage = ({ page }: { page: PageConfig }) => {
    return (
      <div className="h-full w-full bg-white text-black p-8 overflow-y-auto grid grid-cols-12 gap-8">
        {/* Left Column - Image & Quote */}
        <div className="col-span-5 flex flex-col gap-6">
          <div className="aspect-[3/4] bg-slate-200 relative overflow-hidden group">
            <img 
              src={page.data.imageUrl || "https://images.unsplash.com/photo-1522778119026-d647f0565c6a?q=80&w=1000&auto=format&fit=crop"}
              className="w-full h-full object-cover grayscale contrast-125"
              alt="Article Visual"
            />
            {isEditorMode && (
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <button 
                    onClick={() => {
                        const url = prompt("Enter image URL", page.data.imageUrl);
                        if (url) updatePageData(page.id, { imageUrl: url });
                    }}
                    className="bg-white text-black px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"
                >
                  <ImageIcon size={12} /> Change Image
                </button>
              </div>
            )}
          </div>
          <blockquote className="font-serif text-2xl italic leading-tight border-l-4 border-red-600 pl-4">
            {isEditorMode ? (
              <textarea 
                className="w-full h-32 bg-transparent border-none resize-none focus:ring-0 italic" 
                value={page.data.quote || "Success is not an accident..."}
                onChange={(e) => updatePageData(page.id, { quote: e.target.value })}
              />
            ) : (
              page.data.quote || "Success is not an accident. It is hard work, perseverance, learning, studying, sacrifice and most of all, love of what you are doing."
            )}
          </blockquote>
        </div>

        {/* Right Column - Text */}
        <div className="col-span-7 flex flex-col">
          <div className="mb-8">
            <h4 className="font-bold text-xs uppercase tracking-widest text-red-600 mb-2">FEATURE STORY</h4>
            {isEditorMode ? (
              <input 
                className="text-5xl font-black italic tracking-tighter w-full border-none focus:ring-0 leading-none mb-4" 
                value={page.data.headline || "THE SCIENCE OF WINNING"}
                onChange={(e) => updatePageData(page.id, { headline: e.target.value })}
              />
            ) : (
              <h2 className="text-5xl font-black italic tracking-tighter leading-none mb-4">
                {page.data.headline || "THE SCIENCE OF WINNING"}
              </h2>
            )}
            <div className="h-1 w-24 bg-black" />
          </div>
          
          <div className="prose prose-lg font-serif text-slate-800 columns-1 gap-8">
            {isEditorMode ? (
              <textarea 
                className="w-full h-[500px] bg-transparent border-none resize-none focus:ring-0" 
                value={page.data.content || "Lorem ipsum..."}
                onChange={(e) => updatePageData(page.id, { content: e.target.value })}
              />
            ) : (
              <p>
                {page.data.content || "Lorem ipsum dolor sit amet, consectetur adipiscing elit..."}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  };

  const InterviewPage = ({ page }: { page: PageConfig }) => {
    const [loading, setLoading] = useState(false);

    const handleGenerate = async () => {
      setLoading(true);
      const result = await generateInterview(page.data.topic || "Strategy", page.data.interviewee || "The Coach");
      if (result) updatePageData(page.id, { lines: result });
      setLoading(false);
    };

    return (
      <div className="h-full w-full bg-[#f4f4f4] text-black p-8 overflow-y-auto grid grid-cols-12 gap-8">
        {/* Sidebar / Context */}
        <div className="col-span-4 border-r border-black/10 pr-8 flex flex-col">
          <div className="mb-8">
            <h3 className="text-4xl font-black italic tracking-tighter mb-2">THE<br/>INTERVIEW</h3>
            <div className="h-1 w-12 bg-black mb-4" />
            <p className="font-serif text-lg leading-tight">
              Presse-Toni sits down with the key figures to discuss strategy, finance, and the future.
            </p>
          </div>

          {isEditorMode && (
            <div className="bg-white p-4 rounded-xl shadow-sm border border-black/5 space-y-4 mb-8">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500">Interview Config</h4>
              <div>
                <label className="text-xs font-bold block mb-1">Topic</label>
                <input 
                  value={page.data.topic || ''}
                  onChange={(e) => updatePageData(page.id, { topic: e.target.value })}
                  className="w-full text-sm border p-2 rounded bg-slate-50"
                  placeholder="e.g. Derby Tactics"
                />
              </div>
              <div>
                <label className="text-xs font-bold block mb-1">Guest</label>
                <select 
                  value={page.data.interviewee || 'The Coach'}
                  onChange={(e) => updatePageData(page.id, { interviewee: e.target.value })}
                  className="w-full text-sm border p-2 rounded bg-slate-50"
                >
                  <option>The Coach</option>
                  <option>The Manager</option>
                  <option>The Doctor</option>
                  <option>The Captain</option>
                </select>
              </div>
              <button 
                onClick={handleGenerate}
                disabled={loading}
                className="w-full bg-black text-white py-2 rounded text-xs font-bold uppercase hover:bg-slate-800 disabled:opacity-50"
              >
                {loading ? 'Generating...' : 'Generate Interview'}
              </button>
            </div>
          )}

          <div className="mt-auto">
            <div className="aspect-square bg-slate-200 rounded-full overflow-hidden mb-4 relative">
               <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=PresseToni" alt="Presse Toni" className="w-full h-full object-cover" />
            </div>
            <p className="font-bold uppercase text-sm">Presse-Toni</p>
            <p className="text-xs text-slate-500">Chief Editor</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="col-span-8 font-serif text-xl leading-relaxed space-y-6">
          {page.data.lines && page.data.lines.length > 0 ? (
            page.data.lines.map((line: InterviewLine, idx: number) => (
              <div key={idx} className={line.speaker === 'Presse-Toni' ? 'font-bold text-black mb-2' : 'text-slate-700 mb-6 pl-4 border-l-2 border-red-500'}>
                <span className="text-xs font-sans font-black uppercase text-slate-400 block mb-1">{line.speaker}</span>
                {line.text}
              </div>
            ))
          ) : (
            <div className="flex items-center justify-center h-full text-slate-400 italic">
              "No interview generated yet. Use the config panel to start."
            </div>
          )}
        </div>
      </div>
    );
  };

  const MatchPreviewPage = ({ page }: { page: PageConfig }) => {
    const [loading, setLoading] = useState(false);

    const handleAnalyze = async () => {
      setLoading(true);
      const result = await generateOpponentData(page.data.teamName || "FC Bayern Munich");
      if (result) updatePageData(page.id, { analysis: result });
      setLoading(false);
    };

    const data = page.data.analysis;

    return (
      <div className="h-full w-full bg-[#1a1a1a] text-white p-8 overflow-y-auto">
        <div className="grid grid-cols-12 gap-8 h-full">
          {/* Header & Search */}
          <div className="col-span-12 flex justify-between items-end border-b border-white/10 pb-6 mb-6">
            <div>
              <h2 className="text-5xl font-black italic tracking-tighter text-white">MATCH<span className="text-red-600">PREVIEW</span></h2>
              <p className="font-mono text-red-600 mt-2">OPPONENT INTELLIGENCE</p>
            </div>
            {isEditorMode && (
              <div className="flex gap-2">
                <input 
                  value={page.data.teamName || ''} 
                  onChange={(e) => updatePageData(page.id, { teamName: e.target.value })}
                  className="bg-white/10 border border-white/20 text-white px-4 py-2 rounded-lg"
                  placeholder="Team Name"
                />
                <button 
                  onClick={handleAnalyze}
                  disabled={loading}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2"
                >
                  <Search size={16} />
                  {loading ? 'Scanning...' : 'Analyze'}
                </button>
              </div>
            )}
          </div>

          {/* Content */}
          {data ? (
            <>
              <div className="col-span-4 bg-white/5 p-6 rounded-2xl border border-white/10">
                <h3 className="text-2xl font-bold mb-4 text-red-500">FORM GUIDE</h3>
                <div className="flex gap-2 mb-6">
                  {data.last_matches.map((res: string, i: number) => (
                    <div key={i} className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border ${
                      res.includes('W') ? 'bg-green-500/20 border-green-500 text-green-500' :
                      res.includes('L') ? 'bg-red-500/20 border-red-500 text-red-500' :
                      'bg-yellow-500/20 border-yellow-500 text-yellow-500'
                    }`}>
                      {res.split(' ')[0]}
                    </div>
                  ))}
                </div>
                <h4 className="font-mono text-xs text-slate-400 uppercase mb-2">Tactical Setup</h4>
                <div className="text-4xl font-black text-white mb-6">{data.formation}</div>
                
                <h4 className="font-mono text-xs text-slate-400 uppercase mb-2">Summary</h4>
                <p className="text-sm text-slate-300 leading-relaxed">{data.summary}</p>
              </div>

              <div className="col-span-8 grid grid-cols-2 gap-4">
                <div className="col-span-2 bg-red-600 p-6 rounded-2xl flex items-center justify-between">
                  <h3 className="text-3xl font-black italic">KEY THREATS</h3>
                  <div className="bg-black/20 px-4 py-1 rounded-full text-xs font-bold uppercase">Watch List</div>
                </div>
                {data.key_players.map((player: string, i: number) => (
                  <div key={i} className="bg-white/5 p-4 rounded-xl border border-white/10 flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-700 rounded-full flex items-center justify-center font-bold text-xl">
                      {player.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-lg">{player}</div>
                      <div className="text-xs text-red-400 font-mono uppercase">Danger Man</div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="col-span-12 flex items-center justify-center h-64 border-2 border-dashed border-white/10 rounded-3xl">
              <p className="text-slate-500 font-mono">Run analysis to generate preview data</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const SquadPage = () => (
    <div className="h-full w-full bg-white text-black p-8 overflow-y-auto">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-5xl font-black italic tracking-tighter">SQUAD<span className="text-slate-300">2026</span></h2>
        <div className="font-mono text-xs text-slate-500 uppercase tracking-widest">Official Roster • Updated Live</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {players.map(player => (
          <div key={player.id} className="relative group perspective-1000">
            {/* FIFA Card Style */}
            <div className="bg-gradient-to-b from-slate-100 to-slate-300 rounded-t-2xl p-4 relative overflow-hidden border border-slate-300 shadow-xl transition-transform hover:-translate-y-2 duration-300">
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
              
              {/* Image Area */}
              <div className="relative aspect-[3/4] mx-auto mb-4 overflow-hidden rounded-lg bg-slate-200 shadow-inner">
                <img 
                  src={player.image_url || `https://picsum.photos/seed/${player.id}/300/400`} 
                  alt={player.name}
                  className="w-full h-full object-cover"
                />
                {isEditorMode && (
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <button 
                      onClick={async () => {
                        const url = prompt("Enter new image URL:", player.image_url);
                        if (url) {
                          // Update locally first for immediate feedback
                          // In a real app, we'd wait for the API
                          await fetch(`/api/players/${player.id}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ ...player, image_url: url })
                          });
                          onUpdate();
                        }
                      }}
                      className="bg-white text-black px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 hover:scale-105 transition-transform"
                    >
                      <Camera size={12} /> Edit Photo
                    </button>
                  </div>
                )}
              </div>

              {/* Stats Overlay */}
              <div className="relative z-10">
                <div className="flex justify-between items-end mb-2">
                  <h3 className="font-black text-xl uppercase leading-none">{player.name}</h3>
                  <div className="text-2xl font-black text-slate-400 italic">{player.readiness_score}</div>
                </div>
                
                <div className="grid grid-cols-6 gap-1 text-[10px] font-bold text-center bg-white/50 p-2 rounded-lg backdrop-blur-sm">
                  <div>
                    <div className="text-slate-500">PAC</div>
                    <div>{player.stats?.pace || 0}</div>
                  </div>
                  <div>
                    <div className="text-slate-500">SHO</div>
                    <div>{player.stats?.shooting || 0}</div>
                  </div>
                  <div>
                    <div className="text-slate-500">PAS</div>
                    <div>{player.stats?.passing || 0}</div>
                  </div>
                  <div>
                    <div className="text-slate-500">DRI</div>
                    <div>{player.stats?.dribbling || 0}</div>
                  </div>
                  <div>
                    <div className="text-slate-500">DEF</div>
                    <div>{player.stats?.defending || 0}</div>
                  </div>
                  <div>
                    <div className="text-slate-500">PHY</div>
                    <div>{player.stats?.physical || 0}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const HighlightPage = ({ page }: { page: PageConfig }) => (
    <div className="h-full w-full bg-black text-white p-0 overflow-hidden relative group">
      {/* Video Background */}
      <div className="absolute inset-0">
        <video 
          src={page.data.videoUrl} 
          className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity duration-500"
          autoPlay 
          loop 
          muted 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/50" />
      </div>

      {/* Content Overlay */}
      <div className="absolute inset-0 p-8 flex flex-col justify-between z-10">
        <div className="flex justify-between items-start">
            <div className="bg-[#E21B4D] text-white text-xs font-bold px-3 py-1 uppercase tracking-widest transform -skew-x-12">
                Video Analysis
            </div>
            <div className="text-right">
                <p className="text-4xl font-black italic tracking-tighter">{page.data.timestamp}</p>
                <p className="text-xs font-mono text-slate-400 uppercase">Matchday Moment</p>
            </div>
        </div>

        <div>
            <h2 className="text-7xl font-black italic tracking-tighter leading-[0.85] mb-6 drop-shadow-2xl">
                {page.data.headline?.split(' ').map((word: string, i: number) => (
                    <span key={i} className={i % 2 === 0 ? 'text-white' : 'text-transparent bg-clip-text bg-gradient-to-r from-[#E21B4D] to-orange-500'}>
                        {word}<br/>
                    </span>
                ))}
            </h2>
            
            <div className="flex items-end gap-8">
                <div className="flex-1 bg-black/80 backdrop-blur-md p-6 border-l-4 border-[#E21B4D]">
                    <p className="font-serif text-xl leading-relaxed text-slate-200">
                        "{page.data.caption}"
                    </p>
                </div>
                
                {/* Biometrics Card */}
                <div className="w-48 bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                    <div className="flex items-center gap-2 mb-3 border-b border-white/10 pb-2">
                        <Activity size={16} className="text-[#E21B4D]" />
                        <span className="text-xs font-bold uppercase">Live Data</span>
                    </div>
                    <div className="space-y-2">
                        <div>
                            <p className="text-[10px] text-slate-400 uppercase">Heart Rate</p>
                            <p className="text-2xl font-black italic">{page.data.metrics?.heart_rate || 'N/A'} <span className="text-xs not-italic font-normal text-slate-400">BPM</span></p>
                        </div>
                        <div>
                            <p className="text-[10px] text-slate-400 uppercase">Top Speed</p>
                            <p className="text-2xl font-black italic">{page.data.metrics?.speed || 'N/A'} <span className="text-xs not-italic font-normal text-slate-400">KM/H</span></p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );

  const MedicalPage = ({ page }: { page: PageConfig }) => {
    const [loading, setLoading] = useState(false);

    const handleGenerate = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/journal/medical', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ players })
        });
        const data = await res.json();
        if (data.analysis) {
          updatePageData(page.id, { content: data.analysis });
        }
      } catch (e) {
        console.error("Medical analysis failed", e);
      }
      setLoading(false);
    };

    return (
      <div className="h-full w-full bg-[#0a0f16] text-white p-8 overflow-y-auto grid grid-cols-12 gap-8 font-sans relative">
        {/* Background Grid */}
        <div className="absolute inset-0 grid grid-cols-[repeat(20,1fr)] grid-rows-[repeat(13,1fr)] opacity-10 pointer-events-none">
          {Array.from({ length: 20 * 13 }).map((_, i) => (
            <div key={i} className="border-[0.5px] border-cyan-400/30" />
          ))}
        </div>

        {/* Header */}
        <div className="col-span-12 flex justify-between items-end border-b border-cyan-500/30 pb-6 mb-2 relative z-10">
          <div>
            <h2 className="text-5xl font-black italic tracking-tighter text-white">MEDICAL<span className="text-cyan-400">CORNER</span></h2>
            <p className="font-mono text-cyan-500 mt-2 uppercase tracking-widest text-xs">High-Performance Lab Report</p>
          </div>
          {isEditorMode && (
            <button 
              onClick={handleGenerate}
              disabled={loading}
              className="bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-400 border border-cyan-500/50 px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-all"
            >
              <Activity size={16} />
              {loading ? 'Analyzing...' : 'Generate Report'}
            </button>
          )}
        </div>

        {/* Content */}
        <div className="col-span-4 flex flex-col gap-6 relative z-10">
          <div className="bg-black/50 border border-cyan-500/20 p-6 rounded-xl backdrop-blur-sm">
            <h3 className="text-cyan-400 font-bold text-sm uppercase tracking-widest mb-4 flex items-center gap-2">
              <HeartPulse size={16} /> Squad Readiness
            </h3>
            <div className="space-y-4">
              {players.slice(0, 4).map(p => (
                <div key={p.id} className="flex items-center justify-between">
                  <span className="font-mono text-sm">{p.name}</span>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-16 bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${p.readiness_score >= 85 ? 'bg-emerald-400' : p.readiness_score >= 65 ? 'bg-amber-400' : 'bg-red-500'}`}
                        style={{ width: `${p.readiness_score}%` }}
                      />
                    </div>
                    <span className={`font-mono text-xs font-bold ${p.readiness_score >= 85 ? 'text-emerald-400' : p.readiness_score >= 65 ? 'text-amber-400' : 'text-red-500'}`}>
                      {p.readiness_score}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-auto">
            <div className="aspect-square bg-slate-900 rounded-full overflow-hidden mb-4 relative border-2 border-cyan-500/30">
               <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=DoctorToni" alt="Doctor Toni" className="w-full h-full object-cover opacity-80" />
            </div>
            <p className="font-bold uppercase text-sm text-cyan-400">Doctor-Toni</p>
            <p className="text-xs text-slate-400 font-mono">Head of Performance</p>
          </div>
        </div>

        <div className="col-span-8 relative z-10">
          <div className="bg-black/40 border border-cyan-500/20 p-8 rounded-xl backdrop-blur-sm h-full">
            {isEditorMode ? (
              <textarea 
                className="w-full h-full bg-transparent border-none resize-none focus:ring-0 font-mono text-sm text-cyan-50 leading-relaxed" 
                value={page.data.content || "Run analysis to generate the medical report..."}
                onChange={(e) => updatePageData(page.id, { content: e.target.value })}
              />
            ) : (
              <div className="prose prose-invert prose-cyan font-mono text-sm leading-relaxed max-w-none">
                {page.data.content ? (
                  page.data.content.split('\n').map((paragraph: string, i: number) => (
                    <p key={i} className="mb-4">{paragraph}</p>
                  ))
                ) : (
                  <p className="text-cyan-500/50 italic">No report generated yet.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Render Current Page
  const renderPage = (page: PageConfig) => {
    switch (page.type) {
      case 'COVER': return <CoverPage page={page} />;
      case 'ARTICLE': return <ArticlePage page={page} />;
      case 'INTERVIEW': return <InterviewPage page={page} />;
      case 'PREVIEW': return <MatchPreviewPage page={page} />;
      case 'SQUAD': return <SquadPage />;
      case 'HIGHLIGHTS': return <HighlightPage page={page} />;
      case 'MEDICAL': return <MedicalPage page={page} />;
      default: return <div className="p-8">Unknown Page Type</div>;
    }
  };

  return (
    <div className="h-full w-full bg-slate-900 flex flex-col relative">
      {/* Audio Player (Hidden) */}
      <audio ref={audioRef} onEnded={() => setIsPlaying(false)} className="hidden" />

      {/* Toolbar */}
      <div className="h-12 bg-black border-b border-white/10 flex items-center justify-between px-4 z-20">
        <div className="flex items-center gap-4">
          <span className="font-black text-white italic tracking-tighter">STARK<span className="text-red-600">JOURNAL</span></span>
          <div className="h-4 w-px bg-white/20" />
          
          {!isPreviewMode && (
            <button 
                onClick={() => setIsEditorMode(!isEditorMode)}
                className={`flex items-center gap-2 text-xs font-bold px-3 py-1 rounded-full transition-colors ${
                isEditorMode ? 'bg-red-600 text-white' : 'bg-white/10 text-slate-400 hover:bg-white/20'
                }`}
            >
                {isEditorMode ? <Edit3 size={12} /> : <Eye size={12} />}
                {isEditorMode ? 'EDITOR MODE' : 'VIEWER MODE'}
            </button>
          )}

          {isEditorMode && !isPreviewMode && (
            <div className="flex items-center gap-2 ml-4">
              <button onClick={() => addPage('ARTICLE')} className="text-xs bg-white/10 hover:bg-white/20 text-white px-2 py-1 rounded flex items-center gap-1">
                <Plus size={12} /> Article
              </button>
              <button onClick={() => addPage('INTERVIEW')} className="text-xs bg-white/10 hover:bg-white/20 text-white px-2 py-1 rounded flex items-center gap-1">
                <Plus size={12} /> Interview
              </button>
              <button onClick={() => addPage('PREVIEW')} className="text-xs bg-white/10 hover:bg-white/20 text-white px-2 py-1 rounded flex items-center gap-1">
                <Plus size={12} /> Preview
              </button>
              <button onClick={() => addPage('MEDICAL')} className="text-xs bg-cyan-900/50 hover:bg-cyan-900 text-cyan-200 px-2 py-1 rounded flex items-center gap-1">
                <Plus size={12} /> Medical
              </button>
              <button onClick={removePage} className="text-xs bg-red-900/50 hover:bg-red-900 text-red-200 px-2 py-1 rounded flex items-center gap-1 ml-2">
                <Trash2 size={12} /> Remove Page
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {!isPreviewMode ? (
            <>
                <button 
                    onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                    disabled={currentPage === 0}
                    className="p-2 text-white hover:bg-white/10 rounded-lg disabled:opacity-30"
                >
                    <ChevronLeft size={16} />
                </button>
                <span className="text-xs font-mono text-slate-400">PAGE {currentPage + 1} / {pages.length}</span>
                <button 
                    onClick={() => setCurrentPage(Math.min(pages.length - 1, currentPage + 1))}
                    disabled={currentPage === pages.length - 1}
                    className="p-2 text-white hover:bg-white/10 rounded-lg disabled:opacity-30"
                >
                    <ChevronRight size={16} />
                </button>
                <div className="h-4 w-px bg-white/20 mx-2" />
                <button 
                    onClick={handleEnterPreview}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-2"
                >
                    <Play size={12} /> PRESS PREVIEW
                </button>
            </>
          ) : (
            <div className="flex items-center gap-4">
                {audioUrl && (
                    <button 
                        onClick={() => {
                            if (audioRef.current) {
                                if (isPlaying) audioRef.current.pause();
                                else audioRef.current.play();
                                setIsPlaying(!isPlaying);
                            }
                        }}
                        className="text-white hover:text-red-500 animate-pulse"
                    >
                        {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                    </button>
                )}
                <button 
                    onClick={() => setIsPreviewMode(false)}
                    className="text-slate-400 hover:text-white px-3 py-1 rounded text-xs font-bold flex items-center gap-1"
                >
                    <ArrowLeft size={12} /> BACK TO EDITOR
                </button>
                <button 
                    onClick={handleFinalize}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-900/50"
                >
                    <CheckCircle size={12} /> FINALIZE & BRIEFCASE
                </button>
            </div>
          )}
        </div>
      </div>

      {/* Magazine Viewport */}
      <div className={`flex-1 overflow-hidden relative flex items-center justify-center p-8 transition-colors duration-500 ${isPreviewMode ? 'bg-black' : 'bg-slate-800'}`}>
        
        {/* Cinematic Background for Preview */}
        {isPreviewMode && (
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-800/20 to-black" />
            </div>
        )}

        <AnimatePresence mode="wait">
            <motion.div 
            key={pages[currentPage].id}
            initial={isPreviewMode ? { rotateY: -90, opacity: 0 } : { opacity: 0, scale: 0.95 }}
            animate={isPreviewMode ? { rotateY: 0, opacity: 1 } : { opacity: 1, scale: 1 }}
            exit={isPreviewMode ? { rotateY: 90, opacity: 0 } : { opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className={`w-full max-w-[1000px] aspect-[1.414] bg-white shadow-2xl overflow-hidden ${isPreviewMode ? 'shadow-white/5' : ''}`}
            style={{ transformStyle: 'preserve-3d' }}
            >
            {renderPage(pages[currentPage])}
            </motion.div>
        </AnimatePresence>

        {/* Preview Navigation Overlay */}
        {isPreviewMode && (
            <>
                <button 
                    onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                    disabled={currentPage === 0}
                    className="absolute left-8 top-1/2 -translate-y-1/2 p-4 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-all disabled:opacity-0"
                >
                    <ChevronLeft size={48} />
                </button>
                <button 
                    onClick={() => setCurrentPage(Math.min(pages.length - 1, currentPage + 1))}
                    disabled={currentPage === pages.length - 1}
                    className="absolute right-8 top-1/2 -translate-y-1/2 p-4 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-all disabled:opacity-0"
                >
                    <ChevronRight size={48} />
                </button>
                
                {/* Presse-Toni Avatar Overlay */}
                <motion.div 
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="absolute bottom-8 left-8 flex items-end gap-4 max-w-md pointer-events-none"
                >
                    <div className="w-16 h-16 rounded-full border-2 border-white/20 overflow-hidden shadow-xl bg-slate-900">
                        <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=PresseToni" className="w-full h-full object-cover" />
                    </div>
                    <div className="bg-black/80 backdrop-blur-md p-4 rounded-2xl rounded-bl-none border border-white/10 text-white shadow-2xl">
                        <p className="text-xs font-bold text-red-500 uppercase mb-1">Presse-Toni AI</p>
                        <p className="text-sm font-serif italic leading-relaxed">
                            {summary || "Analyzing journal content..."}
                        </p>
                    </div>
                </motion.div>
            </>
        )}
      </div>
    </div>
  );
}
