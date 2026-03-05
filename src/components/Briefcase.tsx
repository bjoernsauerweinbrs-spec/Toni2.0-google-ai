import React, { useState, useEffect } from 'react';
import { Briefcase as BriefcaseIcon, TrendingUp, FileText, PieChart, Upload, Search, Film, BrainCircuit, DollarSign, Award } from 'lucide-react';
import { Sponsor, Article, Player, MediaEntry } from '../types';
import MediaArchive from './MediaArchive';
import { ManagerToniAI } from '../services/GeminiService';
import { motion, AnimatePresence } from 'motion/react';

// Mock Players for Analysis
const MOCK_PLAYERS: Player[] = [
  { id: 'p1', name: 'Erling H.', category: 'PRO', readiness_score: 95, tactical_position: 'ST', hrv_data: [], sleep_cycles: { deep_sleep: '2h', rem: '2h' }, scouting_metrics: {}, stats: { pace: 89, shooting: 93, passing: 65, dribbling: 80, defending: 45, physical: 88 } },
  { id: 'p2', name: 'Kevin D.', category: 'PRO', readiness_score: 88, tactical_position: 'CM', hrv_data: [], sleep_cycles: { deep_sleep: '1.5h', rem: '2h' }, scouting_metrics: {}, stats: { pace: 74, shooting: 86, passing: 94, dribbling: 87, defending: 64, physical: 74 } },
  { id: 'p3', name: 'Ruben D.', category: 'PRO', readiness_score: 92, tactical_position: 'CB', hrv_data: [], sleep_cycles: { deep_sleep: '2h', rem: '1.5h' }, scouting_metrics: {}, stats: { pace: 72, shooting: 35, passing: 70, dribbling: 68, defending: 89, physical: 86 } },
];

export default function Briefcase() {
  const [activeTab, setActiveTab] = useState<'SPONSORING' | 'ANALYSIS' | 'NEWSPAPER' | 'ARCHIVE'>('SPONSORING');
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  
  // Manager AI State
  const [isManagerMode, setIsManagerMode] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [marketValueReport, setMarketValueReport] = useState<{ totalValue: string; report: string; topAssets: any[] } | null>(null);
  const [sponsorshipReport, setSponsorshipReport] = useState<{ impactScore: number; analysis: string; brandVisibility: string } | null>(null);

  useEffect(() => {
    // Fetch mock data
    // In a real app, these would be API calls
    setSponsors([
      { id: 's1', name: 'Red Bull', tier: 'PLATINUM', value: '€15M', roi: 12, status: 'ACTIVE' },
      { id: 's2', name: 'Audi', tier: 'GOLD', value: '€8M', roi: 8, status: 'ACTIVE' },
      { id: 's3', name: 'Allianz', tier: 'GOLD', value: '€7.5M', roi: 5, status: 'NEGOTIATION' },
    ]);
    setArticles([
      { id: 'a1', title: 'The Future is Now', subtitle: 'Youth Academy Investment Pays Off', content: '...', author: 'Toni', date: '2025-03-15', tags: ['FINANCE'] }
    ]);
  }, []);

  const handleMarketValueAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const result = await ManagerToniAI.calculateMarketValue(MOCK_PLAYERS);
      setMarketValueReport(result);
    } catch (error) {
      console.error("Analysis failed", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSponsorshipAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      // Mock media for analysis
      const mockMedia: MediaEntry = {
        id: 'm_demo',
        title: 'Press Conference: New Kit Launch',
        thumbnailUrl: '',
        videoUrl: '',
        date: '2025-03-21',
        duration: '10:00',
        type: 'PRESS',
        persona: 'MANAGER',
        tags: ['#KitLaunch', '#RedBull', '#Audi'],
        impactScore: 0
      };
      const result = await ManagerToniAI.analyzeSponsorshipImpact(mockMedia);
      setSponsorshipReport(result);
    } catch (error) {
      console.error("Sponsorship analysis failed", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className={`h-full w-full bg-slate-900 text-slate-100 p-6 overflow-y-auto transition-colors duration-500 ${isManagerMode ? 'bg-[#0a0502]' : ''}`}>
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <BriefcaseIcon className={isManagerMode ? "text-red-600" : "text-amber-500"} />
            {isManagerMode ? "MANAGER OFFICE" : "THE BRIEFCASE"}
          </h2>
          <p className="text-slate-400 mt-1 font-mono text-sm">
            {isManagerMode ? "HOENEß MODE // STRATEGIC COMMAND" : "DIE AKTENTASCHE // STRATEGY // FINANCE"}
          </p>
        </div>

        {/* Manager Mode Toggle */}
        <button
          onClick={() => setIsManagerMode(!isManagerMode)}
          className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm transition-all ${
            isManagerMode 
              ? 'bg-red-600 text-white shadow-[0_0_20px_rgba(220,38,38,0.5)]' 
              : 'bg-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <BrainCircuit size={18} />
          {isManagerMode ? "AI MANAGER ACTIVE" : "ACTIVATE AI MANAGER"}
        </button>
      </div>

      {/* AI Dashboard Overlay (Manager Mode) */}
      <AnimatePresence>
        {isManagerMode && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-8 overflow-hidden"
          >
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 border border-amber-500/30 rounded-2xl p-6 relative">
              <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />
              
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-2xl font-black text-white uppercase italic tracking-wider">
                    <span className="text-amber-500 mr-2">///</span>
                    Financial Intelligence Unit
                  </h3>
                  <p className="text-amber-500/80 font-mono text-xs mt-1">POWERED BY GEMINI 3.1 PRO</p>
                </div>
                <button 
                  onClick={handleMarketValueAnalysis}
                  disabled={isAnalyzing}
                  className="bg-amber-500 hover:bg-amber-400 text-black px-6 py-3 rounded-lg font-black uppercase tracking-wider flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isAnalyzing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      Analyzing Market...
                    </>
                  ) : (
                    <>
                      <DollarSign size={20} />
                      Calculate Squad Value
                    </>
                  )}
                </button>
              </div>

              {/* Analysis Result */}
              {marketValueReport && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="grid grid-cols-1 lg:grid-cols-3 gap-6"
                >
                  {/* Total Value Card */}
                  <div className="bg-black/40 p-6 rounded-xl border border-amber-500/20">
                    <div className="text-slate-400 text-xs font-bold uppercase mb-2">Total Squad Value</div>
                    <div className="text-5xl font-black text-white tracking-tighter">{marketValueReport.totalValue}</div>
                    <div className="mt-4 text-emerald-400 text-sm font-bold flex items-center gap-1">
                      <TrendingUp size={14} />
                      +12% vs Last Season
                    </div>
                  </div>

                  {/* Executive Summary */}
                  <div className="lg:col-span-2 bg-black/40 p-6 rounded-xl border border-amber-500/20 relative">
                    <div className="absolute -top-3 -right-3 bg-red-600 text-white text-[10px] font-black px-2 py-1 uppercase transform rotate-3">
                      Confidential
                    </div>
                    <h4 className="text-amber-500 font-bold uppercase text-sm mb-3">Executive Summary (Hoeneß Style)</h4>
                    <p className="text-slate-200 font-serif text-lg leading-relaxed italic">
                      "{marketValueReport.report}"
                    </p>
                  </div>

                  {/* Top Assets */}
                  <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                    {marketValueReport.topAssets.map((asset, idx) => (
                      <div key={idx} className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 flex items-center gap-4">
                        <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center font-bold text-slate-300">
                          #{idx + 1}
                        </div>
                        <div>
                          <div className="font-bold text-white">{asset.name}</div>
                          <div className="text-amber-500 font-mono font-bold">{asset.value}</div>
                          <div className="text-xs text-slate-400 mt-1">{asset.reason}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs */}
      <div className="flex gap-4 mb-8 border-b border-slate-800 pb-1">
        {[
          { id: 'SPONSORING', label: 'Sponsoring & ROI', icon: <TrendingUp size={16} /> },
          { id: 'ANALYSIS', label: 'Analysis Center', icon: <PieChart size={16} /> },
          { id: 'NEWSPAPER', label: 'Stadium Newspaper', icon: <FileText size={16} /> },
          { id: 'ARCHIVE', label: 'Media Archive', icon: <Film size={16} /> },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-t-lg flex items-center gap-2 font-medium transition-colors relative ${
              activeTab === tab.id 
                ? 'text-amber-400 bg-slate-800/50' 
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {tab.icon}
            {tab.label}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500" />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="min-h-[400px]">
        {activeTab === 'SPONSORING' && (
          <div className="space-y-6">
            {/* AI Analysis Trigger */}
            {isManagerMode && (
              <div className="bg-gradient-to-r from-slate-900 to-slate-800 border border-amber-500/30 rounded-xl p-6 mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-black text-white uppercase italic">
                    <span className="text-amber-500 mr-2">///</span>
                    AI Brand Impact Analysis
                  </h3>
                  <button 
                    onClick={handleSponsorshipAnalysis}
                    disabled={isAnalyzing}
                    className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors border border-slate-700 hover:border-amber-500"
                  >
                    {isAnalyzing ? <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> : <Award size={16} />}
                    Analyze Latest Press Event
                  </button>
                </div>

                {sponsorshipReport && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="bg-black/40 rounded-lg p-4 border border-amber-500/20"
                  >
                    <div className="flex items-center gap-4 mb-3">
                      <div className="text-3xl font-black text-white">{sponsorshipReport.impactScore}/100</div>
                      <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                        sponsorshipReport.brandVisibility === 'HIGH' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        Visibility: {sponsorshipReport.brandVisibility}
                      </div>
                    </div>
                    <p className="text-slate-300 font-serif italic text-sm border-l-2 border-amber-500 pl-3">
                      "{sponsorshipReport.analysis}"
                    </p>
                  </motion.div>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {sponsors.map(sponsor => (
                <div key={sponsor.id} className="bg-slate-800 border border-slate-700 p-6 rounded-xl relative overflow-hidden group hover:border-amber-500/50 transition-all">
                  <div className={`absolute top-0 right-0 px-3 py-1 text-[10px] font-bold uppercase rounded-bl-lg ${
                    sponsor.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {sponsor.status}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-1">{sponsor.name}</h3>
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">{sponsor.tier} PARTNER</div>
                  
                  <div className="flex justify-between items-end">
                    <div>
                      <div className="text-slate-400 text-xs">Annual Value</div>
                      <div className="text-2xl font-mono text-white">{sponsor.value}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-slate-400 text-xs">ROI</div>
                      <div className="text-xl font-mono text-emerald-400">+{sponsor.roi}%</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'ANALYSIS' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-slate-800/50 border border-slate-700 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center hover:bg-slate-800/80 transition-colors cursor-pointer group">
              <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mb-4 group-hover:bg-amber-500/20 group-hover:text-amber-400 transition-colors">
                <Upload size={32} />
              </div>
              <h3 className="text-lg font-bold text-white">Upload Match Report</h3>
              <p className="text-slate-400 text-sm mt-2 max-w-xs">
                Drag & drop PDF or CSV files here for AI analysis by Toni-Coach and Toni-Manager.
              </p>
              <button className="mt-6 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-medium transition-colors">
                Select Files
              </button>
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Search size={18} className="text-cyan-400" />
                Closed-Loop Analysis Log
              </h3>
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-slate-900/50 rounded-lg border border-slate-800">
                    <div className="w-2 h-2 mt-2 rounded-full bg-emerald-500" />
                    <div>
                      <div className="text-sm font-bold text-slate-200">Match_Report_MD24.pdf</div>
                      <div className="text-xs text-slate-500 mt-1">Analyzed by Coach & Manager • Optimized version generated</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'NEWSPAPER' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {articles.map(article => (
              <div key={article.id} className="bg-slate-100 text-slate-900 p-8 rounded-sm shadow-xl relative overflow-hidden">
                {/* Magazine Layout Style */}
                <div className="absolute top-0 left-0 w-full h-2 bg-red-600" />
                <div className="flex justify-between items-start mb-6">
                  <div className="text-xs font-black uppercase tracking-widest text-red-600 border-b-2 border-red-600 pb-1">
                    {article.tags[0]}
                  </div>
                  <div className="font-serif italic text-slate-500 text-sm">{article.date}</div>
                </div>
                
                <h3 className="text-3xl font-black leading-none mb-2 font-serif">{article.title}</h3>
                <h4 className="text-lg font-medium text-slate-600 mb-6 italic">{article.subtitle}</h4>
                
                <p className="font-serif text-lg leading-relaxed text-slate-800 line-clamp-4">
                  {article.content}
                </p>
                
                <div className="mt-6 pt-6 border-t border-slate-300 flex justify-between items-center">
                  <div className="text-xs font-bold uppercase text-slate-500">By {article.author}</div>
                  <button className="text-red-600 font-bold text-sm hover:underline">Read Full Issue →</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'ARCHIVE' && <MediaArchive />}
      </div>
    </div>
  );
}
