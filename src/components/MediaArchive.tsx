import React, { useState, useMemo } from 'react';
import { Play, Search, Filter, Share2, Download, TrendingUp, User, Calendar, Clock } from 'lucide-react';
import { MediaEntry } from '../types';
import { motion, AnimatePresence } from 'motion/react';

// Mock Data
const MOCK_MEDIA: MediaEntry[] = [
  {
    id: 'm1',
    title: 'Tactical Analysis: 4-4-2 vs High Press',
    thumbnailUrl: 'https://picsum.photos/seed/tactic1/800/450',
    videoUrl: '#',
    date: '2025-03-10',
    duration: '12:45',
    type: 'TACTICAL',
    persona: 'TRAINER',
    tags: ['#Gegenpressing', '#DefensiveLine', '#Transition'],
    impactScore: 88,
    sponsorVisibility: 'LOW'
  },
  {
    id: 'm2',
    title: 'Exclusive: Erling H. on Fitness',
    thumbnailUrl: 'https://picsum.photos/seed/press1/800/450',
    videoUrl: '#',
    date: '2025-03-12',
    duration: '05:30',
    type: 'PRESS',
    persona: 'PRESS',
    tags: ['#Interview', '#Fitness', '#Recovery'],
    impactScore: 95,
    sponsorVisibility: 'HIGH'
  },
  {
    id: 'm3',
    title: 'Sponsor ROI Report: Q1 2025',
    thumbnailUrl: 'https://picsum.photos/seed/sponsor1/800/450',
    videoUrl: '#',
    date: '2025-03-15',
    duration: '20:00',
    type: 'SPONSOR',
    persona: 'CFO',
    tags: ['#ROI', '#BrandValue', '#Partnership'],
    impactScore: 72,
    sponsorVisibility: 'MEDIUM'
  },
  {
    id: 'm4',
    title: 'Post-Match Analysis: 3-4-3 Breakdown',
    thumbnailUrl: 'https://picsum.photos/seed/tactic2/800/450',
    videoUrl: '#',
    date: '2025-03-18',
    duration: '15:10',
    type: 'TACTICAL',
    persona: 'TRAINER',
    tags: ['#Formation', '#Attack', '#WingPlay'],
    impactScore: 82,
    sponsorVisibility: 'LOW'
  },
  {
    id: 'm5',
    title: 'Press Conference: New Signing',
    thumbnailUrl: 'https://picsum.photos/seed/press2/800/450',
    videoUrl: '#',
    date: '2025-03-20',
    duration: '08:45',
    type: 'PRESS',
    persona: 'MANAGER',
    tags: ['#Transfer', '#Vision', '#Future'],
    impactScore: 91,
    sponsorVisibility: 'HIGH'
  }
];

export default function MediaArchive() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'TACTICAL' | 'PRESS' | 'SPONSOR'>('ALL');
  const [selectedMedia, setSelectedMedia] = useState<MediaEntry | null>(null);

  const filteredMedia = useMemo(() => {
    return MOCK_MEDIA.filter(media => {
      const matchesSearch = media.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            media.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesFilter = activeFilter === 'ALL' || media.type === activeFilter;
      return matchesSearch && matchesFilter;
    });
  }, [searchQuery, activeFilter]);

  return (
    <div className="h-full w-full bg-[#0a0a0a] text-slate-100 p-6 overflow-y-auto font-sans">
      {/* Header & Manager-Toni Insight */}
      <div className="flex justify-between items-end mb-8 border-b border-slate-800 pb-6">
        <div>
          <h2 className="text-4xl font-black text-white tracking-tighter uppercase italic">
            <span className="text-red-600 mr-2">///</span>
            Media Archive
          </h2>
          <p className="text-slate-400 mt-2 font-mono text-xs tracking-widest uppercase">
            Managed by Manager-Toni // Brand Value Optimization
          </p>
        </div>
        
        <div className="flex items-center gap-4">
           <div className="bg-slate-900 border border-slate-700 rounded-full px-4 py-2 flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
             <span className="text-xs font-bold text-slate-300 uppercase">Cloud Storage: Active</span>
           </div>
           <button className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors">
             <Download size={16} />
             Export Impact Report
           </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
          <input
            type="text"
            placeholder="Search transcripts, tags, or titles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-12 pr-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-all font-medium"
          />
        </div>
        
        <div className="flex gap-2 bg-slate-900 p-1 rounded-xl border border-slate-800">
          {(['ALL', 'TACTICAL', 'PRESS', 'SPONSOR'] as const).map(filter => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-6 py-2 rounded-lg text-sm font-bold uppercase tracking-wider transition-all ${
                activeFilter === filter
                  ? 'bg-red-600 text-white shadow-lg shadow-red-900/20'
                  : 'text-slate-500 hover:text-white hover:bg-slate-800'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Grid View */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <AnimatePresence>
          {filteredMedia.map(media => (
            <motion.div
              key={media.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className="group relative bg-slate-900 rounded-xl overflow-hidden border border-slate-800 hover:border-red-600/50 transition-all cursor-pointer shadow-xl"
              onClick={() => setSelectedMedia(media)}
            >
              {/* Thumbnail */}
              <div className="aspect-video relative overflow-hidden">
                <img 
                  src={media.thumbnailUrl} 
                  alt={media.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80" />
                
                {/* Play Button Overlay */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center shadow-2xl transform group-hover:scale-110 transition-transform">
                    <Play fill="white" className="ml-1" size={32} />
                  </div>
                </div>

                {/* Duration Badge */}
                <div className="absolute bottom-3 right-3 bg-black/80 backdrop-blur-sm px-2 py-1 rounded text-xs font-mono font-bold text-white border border-white/10">
                  {media.duration}
                </div>

                {/* Persona Tag */}
                <div className="absolute top-3 left-3">
                   <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider border ${
                     media.persona === 'TRAINER' ? 'bg-blue-600/20 border-blue-500 text-blue-400' :
                     media.persona === 'PRESS' ? 'bg-amber-600/20 border-amber-500 text-amber-400' :
                     media.persona === 'CFO' ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400' :
                     'bg-slate-600/20 border-slate-500 text-slate-400'
                   }`}>
                     #{media.persona}
                   </span>
                </div>
              </div>

              {/* Content Info */}
              <div className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                    <Calendar size={12} />
                    {media.date}
                  </div>
                  
                  {/* Impact Score */}
                  <div className="flex items-center gap-1">
                    <TrendingUp size={12} className={media.impactScore > 80 ? 'text-emerald-400' : 'text-yellow-400'} />
                    <span className={`text-xs font-black font-mono ${
                      media.impactScore > 80 ? 'text-emerald-400' : 'text-yellow-400'
                    }`}>
                      IMPACT: {media.impactScore}
                    </span>
                  </div>
                </div>

                <h3 className="text-lg font-bold text-white leading-tight mb-3 group-hover:text-red-500 transition-colors line-clamp-2">
                  {media.title}
                </h3>

                <div className="flex flex-wrap gap-2 mt-auto">
                  {media.tags.map(tag => (
                    <span key={tag} className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Video Modal (Simulated) */}
      <AnimatePresence>
        {selectedMedia && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 md:p-12"
          >
            <div className="w-full max-w-6xl bg-[#111] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col max-h-full">
              {/* Modal Header */}
              <div className="flex justify-between items-center p-6 border-b border-slate-800 bg-[#0a0a0a]">
                <div>
                  <h3 className="text-2xl font-black text-white italic uppercase tracking-tight">{selectedMedia.title}</h3>
                  <div className="flex items-center gap-4 mt-2 text-sm text-slate-400">
                    <span className="flex items-center gap-1"><User size={14} /> {selectedMedia.persona}</span>
                    <span className="flex items-center gap-1"><Clock size={14} /> {selectedMedia.duration}</span>
                    <span className="text-emerald-500 font-bold">Impact Score: {selectedMedia.impactScore}</span>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedMedia(null)}
                  className="p-2 hover:bg-slate-800 rounded-full transition-colors"
                >
                  <span className="text-2xl text-slate-400 hover:text-white">×</span>
                </button>
              </div>

              {/* Player Area */}
              <div className="flex-1 bg-black relative aspect-video flex items-center justify-center group">
                <img 
                  src={selectedMedia.thumbnailUrl} 
                  alt="Video Placeholder" 
                  className="absolute inset-0 w-full h-full object-cover opacity-50"
                  referrerPolicy="no-referrer"
                />
                <div className="relative z-10 text-center">
                  <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4 cursor-pointer hover:scale-110 transition-transform shadow-[0_0_40px_rgba(220,38,38,0.5)]">
                    <Play fill="white" size={40} className="ml-2" />
                  </div>
                  <p className="text-slate-300 font-mono text-sm uppercase tracking-widest">Click to Play Stream</p>
                </div>
                
                {/* Telestrator Tools (Mock) */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur border border-white/10 rounded-full px-6 py-3 flex gap-6 opacity-0 group-hover:opacity-100 transition-opacity">
                   {['Draw', 'Arrow', 'Circle', 'Clear'].map(tool => (
                     <button key={tool} className="text-slate-400 hover:text-white text-xs font-bold uppercase tracking-wider hover:text-red-500 transition-colors">
                       {tool}
                     </button>
                   ))}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-6 bg-[#0a0a0a] border-t border-slate-800 flex justify-between items-center">
                <div className="flex gap-2">
                   {selectedMedia.tags.map(tag => (
                     <span key={tag} className="px-3 py-1 bg-slate-900 border border-slate-700 rounded-full text-xs text-slate-300">
                       {tag}
                     </span>
                   ))}
                </div>
                <button className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
                  <Share2 size={18} />
                  <span className="text-sm font-medium">Share Clip</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
