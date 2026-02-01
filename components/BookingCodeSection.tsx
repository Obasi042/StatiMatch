import React, { useState } from 'react';
import { Match } from '../types';
import { processBookingCode } from '../services/geminiService';
import { Ticket, ArrowRight, BrainCircuit, AlertCircle, Loader2, Check } from 'lucide-react';

interface BookingCodeSectionProps {
  onSelectMatch: (match: Match) => void;
  setAppState: (state: any) => void; 
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

const TeamAvatar = ({ name }: { name: string }) => (
  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getTeamColor(name)} flex items-center justify-center shadow-lg border border-white/10 shrink-0`}>
    <span className="text-xs font-bold text-white tracking-tighter">
      {name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
    </span>
  </div>
);

const BookingCodeSection: React.FC<BookingCodeSectionProps> = ({ onSelectMatch, setAppState, isLoading }) => {
  const [code, setCode] = useState('');
  const [loadedMatches, setLoadedMatches] = useState<Match[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const handleLoadCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setAppState({ status: 'processing_code' });
    setHasSearched(false);
    setLoadedMatches([]);

    try {
      const matches = await processBookingCode(code);
      setLoadedMatches(matches);
      setHasSearched(true);
      setAppState({ status: 'idle' });
    } catch (err) {
      console.error(err);
      setAppState({ status: 'error', error: 'Failed to process booking code' });
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
      
      {/* Code Input Card */}
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-1000"></div>
        <div className="relative bg-[#131b2e] border border-white/10 p-8 rounded-2xl text-center overflow-hidden backdrop-blur-sm">
          
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-500"></div>

          <div className="flex justify-center mb-4">
             <div className="bg-orange-500/10 p-3 rounded-full border border-orange-500/20 shadow-[0_0_20px_rgba(249,115,22,0.2)]">
               <Ticket className="w-8 h-8 text-orange-400" />
             </div>
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-2">Import Booking Code</h2>
          <p className="text-slate-400 text-sm max-w-md mx-auto mb-6">
            Enter a Sportybet or standard booking code to identify matches for AI analysis.
          </p>

          <form onSubmit={handleLoadCode} className="max-w-sm mx-auto space-y-4">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. BC8H2..."
              className="w-full bg-black/40 border-2 border-white/10 rounded-xl px-4 py-4 text-center text-2xl tracking-[0.2em] font-mono text-white placeholder-white/20 focus:outline-none focus:border-orange-500 transition-all uppercase"
            />
            <button
              type="submit"
              disabled={!code.trim() || isLoading}
              className="w-full bg-white hover:bg-slate-200 text-[#131b2e] font-bold py-3.5 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
              {isLoading ? 'Scanning Code...' : 'Load Slip'}
            </button>
          </form>
        </div>
      </div>

      {/* Results List */}
      {hasSearched && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-white">Slip Matches</span>
              <span className="text-xs bg-orange-500/10 text-orange-400 px-2 py-0.5 rounded border border-orange-500/20">
                {loadedMatches.length} Found
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {loadedMatches.map((match) => (
              <div 
                key={match.id}
                className="bg-[#131b2e] hover:bg-[#1a2438] border border-white/5 rounded-xl p-0 flex flex-col sm:flex-row overflow-hidden transition-all group shadow-lg"
              >
                {/* Left Side: Match Info */}
                <div className="flex-1 p-5 relative flex flex-col justify-center">
                  {/* Pseudo-perforation line effect */}
                  <div className="absolute right-0 top-2 bottom-2 w-px border-r-2 border-dashed border-white/5 hidden sm:block"></div>

                  <div className="flex items-center gap-2 text-[10px] font-bold tracking-wider text-slate-500 mb-3">
                    <span className="text-orange-400/80">{match.league}</span>
                    <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                    <span>{match.date} • {match.time}</span>
                  </div>

                  <div className="flex items-center gap-4 mb-4">
                     <TeamAvatar name={match.home} />
                     <div className="flex flex-col">
                        <span className="text-lg font-bold text-white leading-none">{match.home}</span>
                        <span className="text-xs text-slate-500 font-black">VS</span>
                        <span className="text-lg font-bold text-white leading-none">{match.away}</span>
                     </div>
                     <TeamAvatar name={match.away} />
                  </div>

                  {match.bookingPrediction && (
                    <div className="inline-flex items-center gap-2 bg-black/30 px-3 py-1.5 rounded-lg border border-white/5 self-start">
                      <span className="text-xs text-slate-400">Slip Selection:</span>
                      <span className="text-sm font-bold text-orange-300">{match.bookingPrediction}</span>
                    </div>
                  )}
                </div>
                
                {/* Right Side: Action */}
                <div className="bg-black/20 p-4 sm:w-48 flex items-center justify-center border-t sm:border-t-0 sm:border-l border-white/5">
                  <button
                    onClick={() => onSelectMatch(match)}
                    className="w-full h-full bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white border border-indigo-500/30 hover:border-indigo-500 rounded-lg px-4 py-3 text-sm font-bold transition-all flex items-center justify-center gap-2 group/btn"
                  >
                    <BrainCircuit className="w-4 h-4" />
                    Analyze
                    <ArrowRight className="w-3 h-3 group-hover/btn:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          <div className="bg-blue-500/5 border border-blue-500/10 p-4 rounded-xl flex gap-3 text-sm text-blue-200/60 items-start">
             <AlertCircle className="w-5 h-5 text-blue-400/50 shrink-0 mt-0.5" />
             <p>
               StatiMatch runs independent analysis. The "Slip Selection" is what was found in the code, but our AI might provide a different perspective based on deep stats.
             </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingCodeSection;