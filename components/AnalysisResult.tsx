import React, { useState } from 'react';
import { DeepAnalysis, PredictionDetail, BetSelection, Sport } from '../types';
import { 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp, 
  Shield, 
  Flag, 
  Activity, 
  Info,
  ExternalLink,
  Trophy,
  ArrowLeft,
  Target,
  Plus,
  Check,
  BrainCircuit,
  Share2,
  User,
  Clock,
  Dribbble,
  BarChart2,
  Zap,
  ShieldCheck,
  Thermometer,
  Crown
} from 'lucide-react';

interface AnalysisResultProps {
  analysis: DeepAnalysis;
  matchTitle: string;
  sport: Sport;
  onReset: () => void;
  betSlip: BetSelection[];
  onToggleBet: (selection: BetSelection) => void;
  homeLogo?: string;
  awayLogo?: string;
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

const TeamAvatar = ({ name, logoUrl, size = "md" }: { name: string, logoUrl?: string, size?: "md" | "lg" | "xl" }) => {
  const [imageError, setImageError] = useState(false);
  
  const sizeClasses = {
    md: "w-10 h-10 md:w-12 md:h-12 text-xs md:text-sm",
    lg: "w-12 h-12 md:w-16 md:h-16 text-sm md:text-xl",
    xl: "w-16 h-16 md:w-24 md:h-24 text-lg md:text-3xl"
  };

  if (logoUrl && !imageError) {
      return (
        <div className={`${sizeClasses[size]} rounded-2xl bg-[#131b2e] flex items-center justify-center shadow-2xl border-2 border-white/10 shrink-0 relative overflow-hidden transition-all duration-300 p-2`}>
           <img 
               src={logoUrl} 
               alt={name} 
               className="w-full h-full object-contain drop-shadow-lg"
               onError={() => setImageError(true)} 
           />
        </div>
      );
  }

  return (
    <div className={`${sizeClasses[size]} rounded-2xl bg-gradient-to-br ${getTeamColor(name)} flex items-center justify-center shadow-2xl border-2 border-white/10 shrink-0 relative overflow-hidden transition-all duration-300`}>
       <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
       <div className="absolute -inset-2 bg-gradient-to-t from-black/40 to-transparent"></div>
      <span className="font-black text-white tracking-tighter drop-shadow-lg relative z-10 select-none">
        {name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
      </span>
    </div>
  );
};

const ConfidenceBadge: React.FC<{ level: string }> = ({ level }) => {
  const l = level.toLowerCase();
  
  if (l === 'high') {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.15)] group/badge backdrop-blur-sm">
        <Zap className="w-3.5 h-3.5 fill-emerald-500/20 animate-[pulse_3s_ease-in-out_infinite]" />
        <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest">High</span>
      </div>
    );
  }

  if (l === 'medium') {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 backdrop-blur-sm">
        <ShieldCheck className="w-3.5 h-3.5" />
        <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest">Medium</span>
      </div>
    );
  }

  // Low
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 backdrop-blur-sm">
      <AlertTriangle className="w-3.5 h-3.5" />
      <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest">Low</span>
    </div>
  );
};

const AnalysisCard: React.FC<{
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  accentColor: string;
}> = ({ title, icon: Icon, children, accentColor }) => (
  <div className="bg-[#131b2e]/80 border border-white/5 rounded-2xl p-5 md:p-6 backdrop-blur-sm hover:border-white/10 transition-colors h-full flex flex-col relative overflow-hidden group shadow-lg">
    <div className={`absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity ${accentColor}`}>
       <Icon className="w-20 h-20 md:w-24 md:h-24 transform translate-x-6 -translate-y-6" />
    </div>
    <h3 className={`font-bold flex items-center gap-2 mb-3 md:mb-4 uppercase tracking-wider text-[10px] md:text-xs ${accentColor} relative z-10`}>
      <Icon className="w-3.5 h-3.5 md:w-4 md:h-4" /> {title}
    </h3>
    <div className="text-slate-300 leading-relaxed text-sm flex-1 relative z-10 break-words font-medium">
      {children}
    </div>
  </div>
);

// --- Visualizations ---

const PlayerTrendChart: React.FC<{ data?: number[], label?: string, selection?: string }> = ({ data, label, selection }) => {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data) * 1.1 || 10;
  
  // Extract line from selection if possible "Over 20.5" -> 20.5
  const lineMatch = selection?.match(/(\d+\.?\d*)/);
  const line = lineMatch ? parseFloat(lineMatch[0]) : 0;

  return (
    <div className="mt-3 pt-3 border-t border-white/5">
        <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center justify-between">
            {label || 'Last 5 Games'}
            <span className="text-white/40 font-mono">L5</span>
        </h5>
        <div className="h-12 flex items-end justify-between gap-1">
            {data.map((val, i) => {
               const isHit = line > 0 ? val > line : true; // Simple logic, assumes Over. For Under would need more context but Over is most common for props.
               return (
                <div key={i} className="flex-1 flex flex-col justify-end h-full group relative">
                    <div 
                        className={`w-full rounded-sm transition-all ${isHit ? 'bg-emerald-500' : 'bg-slate-600'}`} 
                        style={{ height: `${(val / max) * 100}%` }}
                    ></div>
                    <div className="opacity-0 group-hover:opacity-100 absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-black text-white text-[9px] px-1 py-0.5 rounded pointer-events-none">
                        {val}
                    </div>
                </div>
               );
            })}
        </div>
        {line > 0 && (
            <div className="flex items-center gap-1.5 mt-1">
                 <div className="h-px flex-1 bg-white/10 border-t border-dashed border-white/20"></div>
                 <span className="text-[9px] text-slate-500 font-mono">Line: {line}</span>
            </div>
        )}
    </div>
  );
}

const PredictionCard: React.FC<{ 
  title: string; 
  data?: PredictionDetail; 
  icon: React.ElementType;
  isBestBet?: boolean;
  isSelected: boolean;
  onToggle: () => void;
  // Extra vis data for specific cards
  trendData?: number[];
  trendLabel?: string;
}> = ({ title, data, icon: Icon, isBestBet, isSelected, onToggle, trendData, trendLabel }) => {
  if (!data) return null;

  // Helper to parse the advanced reasoning format
  const formatReasoning = (text: string) => {
    if (text.includes('PROJ:') && text.includes('LINE:')) {
      const parts = text.split(/\n/);
      const statsLine = parts[0];
      const analysis = parts.slice(1).join('\n').trim();
      
      const stats = statsLine.split('|').map(s => s.trim());
      
      return (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2 text-[10px] font-mono font-bold">
             {stats.map((stat, i) => (
               <span key={i} className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-1 rounded shadow-sm">
                 {stat}
               </span>
             ))}
          </div>
          <p className="mt-2">{analysis}</p>
        </div>
      );
    }
    return <p>{text}</p>;
  }

  return (
    <div className={`relative p-4 md:p-5 rounded-2xl border transition-all duration-300 group w-full ${
      isBestBet 
        ? 'bg-gradient-to-br from-amber-500/10 via-[#131b2e] to-orange-500/10 border-amber-500/30 shadow-xl shadow-amber-900/10 overflow-hidden ring-1 ring-amber-500/20' 
        : 'bg-[#131b2e]/60 border-white/5 hover:bg-[#1a2438] hover:border-white/10 shadow-md'
    } ${isSelected ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-[#0b0f19]' : ''} flex flex-col gap-3 min-w-0`}>
      
      {isBestBet && (
        <>
          <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-amber-500/20 transition-colors duration-700"></div>
          <div className="absolute -top-3 left-4 md:left-6 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[9px] md:text-[10px] font-black px-3 py-1 rounded-full shadow-lg flex items-center gap-1 uppercase tracking-wider z-10 border border-amber-400/30 text-shadow-sm">
            <Crown className="w-3 h-3 fill-white/20" /> Highest Probability
          </div>
        </>
      )}
      
      <div className="flex justify-between items-start z-10 relative gap-2">
        <div className="flex items-center gap-2 text-slate-400 min-w-0">
          <Icon className={`w-3.5 h-3.5 md:w-4 md:h-4 shrink-0 ${isBestBet ? 'text-amber-400' : ''}`} />
          <span className={`text-[9px] md:text-[10px] font-bold uppercase tracking-widest truncate ${isBestBet ? 'text-amber-200/80' : ''}`}>{title}</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <ConfidenceBadge level={data.confidence} />
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            className={`w-6 h-6 rounded-full flex items-center justify-center transition-all active:scale-90 ${
              isSelected 
                ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25' 
                : isBestBet 
                   ? 'bg-amber-500/20 hover:bg-amber-500 text-amber-500 hover:text-white' 
                   : 'bg-white/5 hover:bg-white/10 text-white/50 hover:text-white'
            }`}
            title={isSelected ? "Remove from slip" : "Add to slip"}
          >
            {isSelected ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
      
      <div className="z-10 relative py-1">
        <div className={`text-lg md:text-2xl font-black tracking-tight ${isBestBet ? 'text-amber-50 drop-shadow-sm scale-[1.02] origin-left transition-transform' : 'text-slate-200'} leading-none break-words`}>
          {data.selection}
        </div>
        <div className={`text-[10px] md:text-xs mt-1.5 font-mono uppercase tracking-wide truncate ${isBestBet ? 'text-amber-500/60' : 'text-slate-500'}`}>{data.market}</div>
      </div>
      
      <div className={`text-xs leading-relaxed mt-auto border-t pt-3 z-10 relative transition-colors ${isBestBet ? 'text-amber-200/60 border-amber-500/10 group-hover:text-amber-100/80' : 'text-slate-400 border-white/5 group-hover:text-slate-300'}`}>
        {formatReasoning(data.reasoning)}
      </div>

      {/* Embedded Chart for Player Props */}
      {trendData && (
          <div className="relative z-10">
              <PlayerTrendChart data={trendData} label={trendLabel} selection={data.selection} />
          </div>
      )}
    </div>
  );
};

const AnalysisResult: React.FC<AnalysisResultProps> = ({ analysis, matchTitle, sport, onReset, betSlip, onToggleBet, homeLogo, awayLogo }) => {
  
  const isSelected = (market: string, selection: string) => {
    return betSlip.some(
      s => s.matchTitle === matchTitle && s.market === market && s.selection === selection
    );
  };

  const createSelection = (market: string, detail: PredictionDetail): BetSelection => ({
    id: `${matchTitle}-${market}-${detail.selection}`.replace(/\s+/g, '-').toLowerCase(),
    matchTitle,
    market,
    selection: detail.selection,
    confidence: detail.confidence
  });

  const getTeamNames = (title: string) => {
    const parts = title.split(/\s+vs\.?\s+|\s+-\s+|\s+v\.?\s+/i);
    if (parts.length >= 2) return [parts[0], parts[1]];
    return [title, ''];
  };

  const [homeTeam, awayTeam] = getTeamNames(matchTitle);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 md:space-y-8 pb-32 px-1 sm:px-4 animate-in fade-in zoom-in-95 duration-500">
      
      {/* Navigation */}
      <div className="flex items-center justify-between">
         <button 
            onClick={onReset}
            className="text-xs font-bold text-slate-500 hover:text-white flex items-center gap-1 transition-colors uppercase tracking-wider bg-white/5 px-3 py-1.5 rounded-lg border border-white/5 hover:bg-white/10"
          >
            <ArrowLeft className="w-3 h-3" /> Back
          </button>
          <div className="flex gap-2">
             <button className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors">
                <Share2 className="w-4 h-4" />
             </button>
          </div>
      </div>

      {/* Match Header Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-[#131b2e] border border-white/5 p-6 md:p-10 text-center shadow-2xl">
         <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent"></div>
         <div className="absolute top-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
         <div className="absolute bottom-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-[100px] translate-x-1/2 translate-y-1/2 pointer-events-none"></div>
         
         <div className="relative z-10 flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12 lg:gap-16">
            <div className="flex flex-col items-center gap-3 flex-1 min-w-0 w-full md:w-auto">
               <TeamAvatar name={homeTeam} size="xl" logoUrl={homeLogo} />
               <h2 className="text-xl md:text-3xl font-black text-white tracking-tight break-words w-full px-2">{homeTeam}</h2>
            </div>

            <div className="flex flex-col items-center shrink-0 my-2 md:my-0">
               <div className="text-3xl md:text-4xl font-black text-slate-700/50">VS</div>
               <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mt-2 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20 whitespace-nowrap">
                  {sport === 'basketball' ? 'Courtside Analysis' : 'Pitchside Analysis'}
               </div>
            </div>

            <div className="flex flex-col items-center gap-3 flex-1 min-w-0 w-full md:w-auto">
               <TeamAvatar name={awayTeam} size="xl" logoUrl={awayLogo} />
               <h2 className="text-xl md:text-3xl font-black text-white tracking-tight break-words w-full px-2">{awayTeam}</h2>
            </div>
         </div>
         
         <div className="relative z-10 mt-6 md:mt-8 max-w-2xl mx-auto">
           <p className="text-slate-400 text-sm leading-relaxed border-t border-white/5 pt-6">
              {analysis.matchOverview}
           </p>
         </div>
      </div>

      {/* Main Content Grid - Changed to lg: for better laptop support */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        
        {/* Left Column: Analysis (Span 8) */}
        <div className="lg:col-span-8 space-y-6 min-w-0">
          
          {/* Best Bet - Mobile Only */}
          <div className="block lg:hidden">
            <PredictionCard 
              title="AI's Highest Probability" 
              data={analysis.bestBet} 
              icon={Target} 
              isBestBet={true} 
              isSelected={isSelected(analysis.bestBet.market, analysis.bestBet.selection)}
              onToggle={() => onToggleBet(createSelection(analysis.bestBet.market, analysis.bestBet))}
            />
          </div>

          {/* Deep Analysis Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 auto-rows-fr">
            <div className="md:col-span-2">
              <AnalysisCard title="Form & Momentum" icon={Activity} accentColor="text-emerald-400">
                {analysis.formGuide}
              </AnalysisCard>
            </div>
            <AnalysisCard title="Tactical Outlook" icon={Flag} accentColor="text-blue-400">
              {analysis.tacticalAnalysis}
            </AnalysisCard>
            
            <AnalysisCard 
               title={sport === 'football' ? "Referee & Discipline" : "Officiating & Trends"} 
               icon={Shield} 
               accentColor="text-yellow-400"
            >
              {analysis.refereeAnalysis}
            </AnalysisCard>
          </div>
          
           {/* Sources */}
           {analysis.sources && analysis.sources.length > 0 && (
            <div className="pt-6 border-t border-white/5">
              <h4 className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                <Activity className="w-3 h-3" />
                Live Intelligence Sources
              </h4>
              <div className="flex flex-wrap gap-2">
                {analysis.sources.map((source, idx) => (
                  <a 
                    key={idx}
                    href={source.uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 bg-[#131b2e] hover:bg-[#1a2438] border border-white/5 rounded-md px-3 py-1.5 text-xs text-slate-400 hover:text-indigo-400 transition-all truncate max-w-[200px]"
                  >
                    <ExternalLink className="w-3 h-3" />
                    {source.title}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Predictions Sidebar (Span 4) */}
        <div className="lg:col-span-4 space-y-4 min-w-0 sticky top-24">
           {/* Best Bet - Desktop Only */}
          <div className="hidden lg:block">
             <PredictionCard 
              title="AI's Highest Probability" 
              data={analysis.bestBet} 
              icon={Target} 
              isBestBet={true} 
              isSelected={isSelected(analysis.bestBet.market, analysis.bestBet.selection)}
              onToggle={() => onToggleBet(createSelection(analysis.bestBet.market, analysis.bestBet))}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
            <PredictionCard 
              title="Winner" 
              data={analysis.predictions.winner} 
              icon={Trophy} 
              isSelected={isSelected('1X2', analysis.predictions.winner.selection)}
              onToggle={() => onToggleBet(createSelection('1X2', analysis.predictions.winner))}
            />
            
            <PredictionCard 
              title={sport === 'football' ? "Goals" : "Total Points"} 
              data={analysis.predictions.goals} 
              icon={TrendingUp} 
              isSelected={isSelected(sport === 'football' ? 'Goals' : 'Total Points', analysis.predictions.goals.selection)}
              onToggle={() => onToggleBet(createSelection(sport === 'football' ? 'Goals' : 'Total Points', analysis.predictions.goals))}
            />

            <PredictionCard 
              title="Handicap" 
              data={analysis.predictions.handicap} 
              icon={Info} 
              isSelected={isSelected('Handicap', analysis.predictions.handicap.selection)}
              onToggle={() => onToggleBet(createSelection('Handicap', analysis.predictions.handicap))}
            />

            {sport === 'football' ? (
              <>
                <PredictionCard 
                  title="Corners" 
                  data={analysis.predictions.corners} 
                  icon={Flag} 
                  isSelected={isSelected('Corners', analysis.predictions.corners?.selection || '')}
                  onToggle={() => analysis.predictions.corners && onToggleBet(createSelection('Corners', analysis.predictions.corners))}
                />
                <PredictionCard 
                  title="Cards" 
                  data={analysis.predictions.cards} 
                  icon={AlertTriangle} 
                  isSelected={isSelected('Cards', analysis.predictions.cards?.selection || '')}
                  onToggle={() => analysis.predictions.cards && onToggleBet(createSelection('Cards', analysis.predictions.cards))}
                />
              </>
            ) : (
              <>
                 <PredictionCard 
                  title="1st Half Total" 
                  data={analysis.predictions.halftime} 
                  icon={Clock} 
                  isSelected={isSelected('Halftime', analysis.predictions.halftime?.selection || '')}
                  onToggle={() => analysis.predictions.halftime && onToggleBet(createSelection('Halftime', analysis.predictions.halftime))}
                />
                <PredictionCard 
                  title="Team Total" 
                  data={analysis.predictions.teamPoints} 
                  icon={Dribbble} 
                  isSelected={isSelected('Team Points', analysis.predictions.teamPoints?.selection || '')}
                  onToggle={() => analysis.predictions.teamPoints && onToggleBet(createSelection('Team Points', analysis.predictions.teamPoints))}
                />
              </>
            )}

            {analysis.predictions.playerStat && (
              <PredictionCard 
                title="Star Player Prop" 
                data={analysis.predictions.playerStat} 
                icon={User} 
                isSelected={isSelected('Player Props', analysis.predictions.playerStat.selection)}
                onToggle={() => onToggleBet(createSelection('Player Props', analysis.predictions.playerStat))}
                trendData={sport === 'basketball' ? analysis.visualization?.basketballTrend : undefined}
                trendLabel={sport === 'basketball' ? analysis.visualization?.trendLabel : undefined}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisResult;