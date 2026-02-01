import React, { useState } from 'react';
import { Match } from '../types';
import { Search, ChevronRight, BarChart3, Clock, Trophy, Calendar } from 'lucide-react';

interface MatchSelectorProps {
  matches: Match[];
  onSelect: (match: Match) => void;
  onManualInput: (input: string) => void;
  isLoading: boolean;
}

const getTeamColor = (name: string) => {
  const colors = [
    'from-red-500 to-rose-600',
    'from-blue-500 to-cyan-600',
    'from-emerald-500 to-green-600',
    'from-amber-500 to-orange-600',
    'from-purple-500 to-violet-600',
    'from-pink-500 to-fuchsia-600',
    'from-indigo-500 to-blue-600',
    'from-slate-600 to-gray-700',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

const TeamAvatar = ({ name, size = "md" }: { name: string, size?: "sm" | "md" | "lg" }) => {
  const sizeClasses = {
    sm: "w-8 h-8 text-[10px]",
    md: "w-10 h-10 text-xs",
    lg: "w-16 h-16 text-lg"
  };

  return (
    <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br ${getTeamColor(name)} flex items-center justify-center shadow-lg border border-white/10 shrink-0 relative overflow-hidden group`}>
      <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
      <span className="font-black text-white tracking-tighter drop-shadow-md">
        {name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
      </span>
    </div>
  );
};

const MatchSelector: React.FC<MatchSelectorProps> = ({ matches, onSelect, onManualInput, isLoading }) => {
  const [manualInput, setManualInput] = useState('');
  const [filter, setFilter] = useState('');

  const filteredMatches = matches.filter(m => 
    `${m.home} ${m.away} ${m.league}`.toLowerCase().includes(filter.toLowerCase())
  );

  const handleSubmitManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualInput.trim()) {
      onManualInput(manualInput);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
      {/* Search / Manual Input Section */}
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
        <div className="relative bg-[#131b2e] border border-white/10 p-6 rounded-2xl flex flex-col md:flex-row items-center gap-6 shadow-xl backdrop-blur-sm">
          <div className="flex-1 w-full">
            <h2 className="text-lg font-bold text-indigo-300 mb-1 flex items-center gap-2">
              <Search className="w-5 h-5" />
              Custom AI Analysis
            </h2>
            <p className="text-slate-400 text-sm">Input any match to generate a deep report instantly.</p>
          </div>
          
          <form onSubmit={handleSubmitManual} className="flex-1 w-full flex gap-3">
            <input
              type="text"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              placeholder="e.g. Real Madrid vs Barcelona"
              className="flex-1 bg-black/40 border border-white/10 rounded-xl px-5 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all text-sm font-medium"
            />
            <button
              type="submit"
              disabled={!manualInput.trim() || isLoading}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-8 py-3 rounded-xl transition-all shadow-lg shadow-indigo-900/20 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap active:scale-95"
            >
              Analyze
            </button>
          </form>
        </div>
      </div>

      {/* Upcoming Matches Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-1 border-b border-white/5 pb-4">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3 tracking-tight">
            <BarChart3 className="w-6 h-6 text-indigo-400" />
            Trending Fixtures
          </h2>
          <div className="relative">
             <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"/>
             <input 
               type="text" 
               placeholder="Filter..." 
               value={filter}
               onChange={(e) => setFilter(e.target.value)}
               className="bg-[#131b2e] border border-white/10 rounded-full pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 w-32 sm:w-48 transition-all"
             />
          </div>
        </div>
        
        {isLoading && matches.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
             {[1,2,3,4,5,6].map(i => (
               <div key={i} className="h-40 bg-white/5 rounded-2xl animate-pulse"></div>
             ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredMatches.map((match) => (
              <button
                key={match.id}
                onClick={() => onSelect(match)}
                className="group relative bg-[#131b2e] hover:bg-[#1a2438] border border-white/5 hover:border-indigo-500/30 rounded-2xl p-0 text-left transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-900/10 hover:-translate-y-1 flex flex-col overflow-hidden"
              >
                {/* Header Strip */}
                <div className="bg-white/5 px-4 py-3 flex items-center justify-between border-b border-white/5 group-hover:bg-white/10 transition-colors">
                   <div className="flex items-center gap-2 text-xs font-bold text-indigo-300 uppercase tracking-wider">
                     <Trophy className="w-3.5 h-3.5" />
                     <span className="truncate max-w-[120px]">{match.league}</span>
                   </div>
                   <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono bg-black/20 px-2 py-0.5 rounded">
                     <Calendar className="w-3 h-3" />
                     {match.date.slice(5).replace('-','/')} • {match.time}
                   </div>
                </div>

                {/* Match Body */}
                <div className="p-5 flex items-center justify-between gap-4 relative">
                   {/* Background Glow */}
                   <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-indigo-500/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                   <div className="flex flex-col items-center gap-2 flex-1">
                      <TeamAvatar name={match.home} />
                      <span className="text-sm font-bold text-slate-200 text-center leading-tight group-hover:text-white transition-colors">{match.home}</span>
                   </div>

                   <div className="flex flex-col items-center justify-center">
                      <span className="text-xs font-black text-slate-600 uppercase tracking-widest mb-1 group-hover:text-indigo-400 transition-colors">VS</span>
                      <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-indigo-500 group-hover:text-white transition-all">
                        <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white" />
                      </div>
                   </div>

                   <div className="flex flex-col items-center gap-2 flex-1">
                      <TeamAvatar name={match.away} />
                      <span className="text-sm font-bold text-slate-200 text-center leading-tight group-hover:text-white transition-colors">{match.away}</span>
                   </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MatchSelector;