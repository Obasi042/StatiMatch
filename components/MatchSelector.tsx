import React, { useState, useMemo } from 'react';
import { Match } from '../types';
import { 
  Search, 
  ChevronRight, 
  ChevronLeft,
  BarChart3, 
  Clock, 
  Trophy, 
  Calendar, 
  Filter, 
  Star, 
  CalendarDays, 
  ChevronDown,
  Flame,
  Crown,
  Globe,
  Medal,
  Shield
} from 'lucide-react';

interface MatchSelectorProps {
  matches: Match[];
  onSelect: (match: Match) => void;
  onManualInput: (input: string) => void;
  isLoading: boolean;
  selectedDate: string;
  onDateChange: (date: string) => void;
}

// --- Visual Helpers ---

const getLeagueConfig = (league: string) => {
  const l = league.toLowerCase();
  if (l.includes('champions league') || l.includes('ucl')) {
    return { 
      icon: Star, 
      color: 'text-blue-400', 
      bg: 'bg-blue-500/10', 
      border: 'border-blue-500/20',
      label: 'Elite'
    };
  }
  if (l.includes('premier league') || l.includes('epl')) {
    return { 
      icon: Crown, 
      color: 'text-purple-400', 
      bg: 'bg-purple-500/10', 
      border: 'border-purple-500/20',
      label: 'Tier 1'
    };
  }
  if (l.includes('la liga') || l.includes('serie a') || l.includes('bundesliga') || l.includes('ligue 1')) {
    return { 
      icon: Medal, 
      color: 'text-emerald-400', 
      bg: 'bg-emerald-500/10', 
      border: 'border-emerald-500/20',
      label: 'Top 5'
    };
  }
  if (l.includes('nba')) {
    return { 
      icon: Trophy, 
      color: 'text-orange-400', 
      bg: 'bg-orange-500/10', 
      border: 'border-orange-500/20',
      label: 'Major'
    };
  }
  return { 
    icon: Globe, 
    color: 'text-slate-400', 
    bg: 'bg-slate-500/10', 
    border: 'border-white/10',
    label: 'Global'
  };
};

const getTeamColor = (name: string) => {
  // Deterministic color based on name hash for consistent "team colors"
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const gradients = [
    'from-red-600 to-red-800',       // Red teams (Liverpool, Bayern)
    'from-blue-600 to-blue-800',     // Blue teams (Chelsea, Everton)
    'from-sky-400 to-blue-600',      // Light Blue (Man City, Napoli)
    'from-white via-slate-200 to-slate-400 text-slate-900', // White (Real Madrid, Spurs)
    'from-yellow-400 to-amber-600 text-black', // Yellow (Dortmund)
    'from-red-600 to-blue-800',      // Red/Blue (Barca, PSG - rough approx)
    'from-emerald-600 to-green-800', // Green (Betis, Celtic)
    'from-purple-600 to-indigo-800', // Purple (Fiorentina)
    'from-orange-500 to-red-600',    // Orange (Wolves)
    'from-slate-800 to-black border-white/20', // Black (Juve - rough approx)
  ];
  
  return gradients[Math.abs(hash) % gradients.length];
};

const TeamCrest = ({ name, logoUrl, size = "md" }: { name: string, logoUrl?: string, size?: "sm" | "md" | "lg" }) => {
  const [imageError, setImageError] = useState(false);
  
  const sizeClasses = {
    sm: "w-8 h-8 text-[10px]",
    md: "w-12 h-12 text-xs",
    lg: "w-16 h-16 text-sm"
  };
  
  const bgClass = getTeamColor(name);
  const isLight = bgClass.includes('text-black') || bgClass.includes('text-slate-900');

  if (logoUrl && !imageError) {
      return (
        <div className={`${sizeClasses[size]} relative flex items-center justify-center shrink-0`}>
             <img 
                src={logoUrl} 
                alt={name} 
                className="w-full h-full object-contain drop-shadow-md"
                onError={() => setImageError(true)}
             />
        </div>
      );
  }

  return (
    <div className={`${sizeClasses[size]} relative flex items-center justify-center shrink-0`}>
      {/* Shield Shape CSS */}
      <div className={`absolute inset-0 bg-gradient-to-br ${bgClass} shadow-lg rounded-[15%] transform rotate-0 overflow-hidden border border-white/10`} 
           style={{ clipPath: 'path("M 50 0 C 100 0 100 35 100 35 C 100 70 50 100 50 100 C 50 100 0 70 0 35 C 0 35 0 0 50 0 Z")' }}>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 mix-blend-overlay"></div>
        <div className="absolute -inset-full bg-gradient-to-t from-black/50 to-transparent"></div>
      </div>
      <span className={`relative z-10 font-black tracking-tighter ${isLight ? 'text-black/80' : 'text-white'} drop-shadow-sm`}>
        {name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
      </span>
    </div>
  );
};

// --- Components ---

const MatchSelector: React.FC<MatchSelectorProps> = ({ matches, onSelect, onManualInput, isLoading, selectedDate, onDateChange }) => {
  const [manualInput, setManualInput] = useState('');
  const [filter, setFilter] = useState('');
  const [selectedLeague, setSelectedLeague] = useState('All');
  const [sortBy, setSortBy] = useState<'date' | 'importance'>('importance');

  // Extract unique leagues
  const leagues = useMemo(() => {
    const allLeagues = matches.map(m => m.league);
    const unique = Array.from(new Set(allLeagues.filter(Boolean))).sort();
    return ['All', ...unique];
  }, [matches]);

  // Group and Sort matches
  const groupedMatches = useMemo(() => {
    // 1. Filter
    const filtered = matches.filter(m => {
      const matchesSearch = `${m.home} ${m.away} ${m.league}`.toLowerCase().includes(filter.toLowerCase());
      const matchesLeague = selectedLeague === 'All' || m.league === selectedLeague;
      return matchesSearch && matchesLeague;
    });

    // 2. Sort & Group
    if (sortBy === 'date') {
       const sorted = filtered.sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return (a.time || '').localeCompare(b.time || '');
      });
      
      const grouped: Record<string, Match[]> = {};
      sorted.forEach(match => {
        if (!grouped[match.date]) grouped[match.date] = [];
        grouped[match.date].push(match);
      });
      return grouped;

    } else {
      // Importance sort: use original index as proxy for importance (API returns ranked list)
      const sorted = filtered.sort((a, b) => {
        return matches.indexOf(a) - matches.indexOf(b);
      });
      
      // If we have data, return a single group
      if (sorted.length > 0) {
        return { 'rank': sorted };
      }
      return {};
    }
  }, [matches, filter, selectedLeague, sortBy]);

  const handleSubmitManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualInput.trim()) {
      onManualInput(manualInput);
    }
  };

  const getDisplayDate = () => {
      const todayStr = new Date().toLocaleDateString('en-CA');
      if (selectedDate === todayStr) return "Today";
      const dateObj = new Date(selectedDate + 'T12:00:00'); 
      return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const changeDate = (days: number) => {
    // Safe date manipulation using parts to avoid timezone shifts
    const parts = selectedDate.split('-');
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // Months are 0-indexed
    const day = parseInt(parts[2], 10);
    
    const date = new Date(year, month, day);
    date.setDate(date.getDate() + days);
    
    const newYear = date.getFullYear();
    const newMonth = String(date.getMonth() + 1).padStart(2, '0');
    const newDay = String(date.getDate()).padStart(2, '0');
    
    onDateChange(`${newYear}-${newMonth}-${newDay}`);
  };

  const formatHeaderDate = (dateStr: string) => {
    if (dateStr === 'rank') return { label: 'Featured Matches', sub: 'Curated by AI Importance' };
    const d = new Date(dateStr + 'T12:00:00');
    return { 
      label: d.toLocaleDateString('en-US', { weekday: 'long' }), 
      sub: d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' }) 
    };
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
      
      {/* Search & Manual Input */}
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
        <div className="relative bg-[#131b2e] border border-white/10 p-6 rounded-2xl flex flex-col md:flex-row items-center gap-6 shadow-xl backdrop-blur-sm">
          <div className="flex-1 w-full">
            <h2 className="text-lg font-bold text-indigo-300 mb-1 flex items-center gap-2">
              <Search className="w-5 h-5" />
              Custom AI Analysis
            </h2>
            <p className="text-slate-400 text-sm">Input any match (past or future) to generate a deep report instantly.</p>
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

      {/* Main Content Area */}
      <div className="space-y-6">
        {/* Controls Toolbar */}
        <div className="flex flex-col gap-6 border-b border-white/5 pb-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3 tracking-tight">
                    <BarChart3 className="w-6 h-6 text-indigo-400" />
                    Matches
                </h2>
                
                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    {/* Date Picker Controls */}
                    <div className="flex items-center bg-[#131b2e] border border-white/10 rounded-lg p-1 gap-1 shadow-sm hover:shadow-md hover:shadow-indigo-900/20 transition-shadow">
                         <button 
                           onClick={() => changeDate(-1)} 
                           className="p-1.5 rounded-md hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                           title="Previous Day"
                         >
                           <ChevronLeft className="w-4 h-4" />
                         </button>
                         
                         <div className="relative group/date">
                             <div className="flex items-center gap-2 px-3 py-1.5 cursor-pointer rounded-md hover:bg-white/5 transition-colors">
                                <CalendarDays className="w-4 h-4 text-indigo-400" />
                                <span className="text-sm font-bold text-slate-200 min-w-[90px] text-center select-none">
                                    {getDisplayDate()}
                                </span>
                             </div>
                             <input 
                                type="date" 
                                value={selectedDate}
                                onChange={(e) => onDateChange(e.target.value)}
                                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                             />
                         </div>

                         <button 
                           onClick={() => changeDate(1)} 
                           className="p-1.5 rounded-md hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                           title="Next Day"
                         >
                           <ChevronRight className="w-4 h-4" />
                         </button>
                    </div>

                    {/* Team Search */}
                    <div className="relative flex-1 md:flex-none">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"/>
                        <input 
                        type="text" 
                        placeholder="Filter teams..." 
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="bg-[#131b2e] border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 w-full md:w-48 transition-all placeholder-slate-600"
                        />
                    </div>
                </div>
            </div>

            {/* Filter & Sort Bar */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                {/* League Scrolling List */}
                <div className="flex flex-wrap gap-2 items-center flex-1 min-w-0">
                    <span className="text-xs text-slate-500 font-bold uppercase tracking-wider mr-2 flex items-center gap-1 shrink-0">
                        <Filter className="w-3 h-3" /> Filter:
                    </span>
                    <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide mask-fade-right w-full md:w-auto">
                        {leagues.map(league => (
                            <button
                                key={league}
                                onClick={() => setSelectedLeague(league)}
                                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all border whitespace-nowrap ${
                                    selectedLeague === league 
                                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-900/20' 
                                    : 'bg-[#131b2e] text-slate-400 border-white/10 hover:border-white/20 hover:text-slate-200'
                                }`}
                            >
                                {league}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Sort Toggle */}
                <div className="flex items-center gap-1 bg-[#131b2e] p-1 rounded-lg border border-white/10 shrink-0">
                    <button 
                        onClick={() => setSortBy('importance')}
                        className={`px-3 py-1.5 text-xs font-bold rounded-md flex items-center gap-1.5 transition-all ${
                            sortBy === 'importance' 
                            ? 'bg-indigo-500/20 text-indigo-300 shadow-sm' 
                            : 'text-slate-500 hover:text-slate-300'
                        }`}
                    >
                        <Flame className="w-3.5 h-3.5" /> 
                        Top Matches
                    </button>
                    <button 
                        onClick={() => setSortBy('date')}
                        className={`px-3 py-1.5 text-xs font-bold rounded-md flex items-center gap-1.5 transition-all ${
                            sortBy === 'date' 
                            ? 'bg-indigo-500/20 text-indigo-300 shadow-sm' 
                            : 'text-slate-500 hover:text-slate-300'
                        }`}
                    >
                        <Clock className="w-3.5 h-3.5" /> 
                        By Time
                    </button>
                </div>
            </div>
        </div>
        
        {/* Loading State */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
             {[1,2,3,4,5,6].map(i => (
                 <div key={i} className="h-48 bg-white/5 rounded-2xl animate-pulse border border-white/5 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12 animate-shimmer"></div>
                 </div>
             ))}
          </div>
        ) : (
          <div className="pt-2">
            {Object.keys(groupedMatches).length === 0 ? (
               <div className="text-center py-24 text-slate-500 bg-[#131b2e]/50 rounded-2xl border border-dashed border-white/5 flex flex-col items-center">
                  <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                     <Filter className="w-8 h-8 opacity-20" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-1">No Matches Found</h3>
                  <p className="text-sm">Try adjusting your filters or date selection.</p>
                  <button onClick={() => { setFilter(''); setSelectedLeague('All'); }} className="text-indigo-400 text-xs font-bold mt-4 hover:underline">Clear Filters</button>
               </div>
            ) : (
              Object.keys(groupedMatches).map(groupKey => {
                const header = formatHeaderDate(groupKey);
                return (
                  <div key={groupKey} className="mb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center gap-3 mb-5 px-1">
                       <div className={`p-2 rounded-xl ${groupKey === 'rank' ? 'bg-amber-500/10 text-amber-500' : 'bg-indigo-500/10 text-indigo-500'}`}>
                          {groupKey === 'rank' ? <Star className="w-5 h-5" /> : <Calendar className="w-5 h-5" />}
                       </div>
                       <div>
                          <h3 className="text-lg font-bold text-white leading-none">{header.label}</h3>
                          <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mt-1">{header.sub}</p>
                       </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      {groupedMatches[groupKey].map((match, idx) => {
                         const leagueConfig = getLeagueConfig(match.league);
                         const LeagueIcon = leagueConfig.icon;
                         // Identify if this is a "Top Match" based on index in the unfiltered list
                         const isTopMatch = matches.indexOf(match) < 3;

                         return (
                            <button
                              key={match.id}
                              onClick={() => onSelect(match)}
                              className="group relative bg-[#131b2e] hover:bg-[#162035] border border-white/5 hover:border-indigo-500/30 rounded-2xl p-0 text-left transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-900/10 hover:-translate-y-1 flex flex-col w-full overflow-hidden"
                            >
                              {/* Top Border Indicator */}
                              {isTopMatch && <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 opacity-75"></div>}

                              {/* Card Header: League & Time */}
                              <div className="px-5 py-3 flex items-center justify-between border-b border-white/5 bg-white/[0.02]">
                                 <div className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-wider ${leagueConfig.color}`}>
                                    <LeagueIcon className="w-3 h-3" />
                                    <span className="truncate max-w-[140px]">{match.league}</span>
                                 </div>
                                 <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono bg-black/30 px-2 py-0.5 rounded border border-white/5">
                                    <Clock className="w-3 h-3" />
                                    {match.time}
                                    <span className="w-0.5 h-3 bg-white/10 mx-1"></span>
                                    {match.date.slice(5)} {/* Shows MM-DD */}
                                 </div>
                              </div>

                              {/* Card Body: Teams */}
                              <div className="p-5 flex items-center justify-between gap-2 relative">
                                 {/* Hover Glow Effect */}
                                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-indigo-500/10 rounded-full blur-[40px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

                                 {/* Home Team */}
                                 <div className="flex flex-col items-center gap-3 flex-1 min-w-0">
                                    <TeamCrest name={match.home} logoUrl={match.homeLogo} />
                                    <span className="text-sm font-bold text-slate-200 text-center leading-tight group-hover:text-white transition-colors line-clamp-2 w-full">
                                      {match.home}
                                    </span>
                                 </div>

                                 {/* VS Center */}
                                 <div className="flex flex-col items-center justify-center shrink-0 z-10 px-2">
                                    <div className="w-8 h-8 rounded-full bg-[#0b0f19] border border-white/10 flex items-center justify-center group-hover:border-indigo-500/50 group-hover:scale-110 transition-all">
                                      <span className="text-[9px] font-black text-slate-500 group-hover:text-indigo-400">VS</span>
                                    </div>
                                 </div>

                                 {/* Away Team */}
                                 <div className="flex flex-col items-center gap-3 flex-1 min-w-0">
                                    <TeamCrest name={match.away} logoUrl={match.awayLogo} />
                                    <span className="text-sm font-bold text-slate-200 text-center leading-tight group-hover:text-white transition-colors line-clamp-2 w-full">
                                      {match.away}
                                    </span>
                                 </div>
                              </div>

                              {/* Card Footer: Metadata/Cta */}
                              <div className="px-4 py-3 bg-black/20 border-t border-white/5 flex items-center justify-between">
                                  <div className="flex gap-2">
                                     {isTopMatch && (
                                       <span className="flex items-center gap-1 text-[9px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                                          <Flame className="w-3 h-3" /> Hot
                                       </span>
                                     )}
                                     <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${leagueConfig.bg} ${leagueConfig.color} ${leagueConfig.border}`}>
                                        {leagueConfig.label}
                                     </span>
                                  </div>
                                  <div className="flex items-center gap-1 text-[10px] font-bold text-indigo-400 group-hover:translate-x-1 transition-transform">
                                     Predict <ChevronRight className="w-3 h-3" />
                                  </div>
                              </div>
                            </button>
                         );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MatchSelector;