import React, { useState, useEffect } from 'react';
import { fetchMatches, analyzeMatchDeeply } from './services/geminiService';
import MatchSelector from './components/MatchSelector';
import BookingCodeSection from './components/BookingCodeSection';
import AnalysisResult from './components/AnalysisResult';
import LoadingOverlay from './components/LoadingOverlay';
import BetBuilder from './components/BetBuilder';
import { Match, DeepAnalysis, AnalysisState, BetSelection, Sport } from './types';
import { Activity, BrainCircuit, Search, Ticket, Trophy, Dribbble } from 'lucide-react';

const LOADING_MESSAGES = [
  "Searching global sports databases...",
  "Analyzing referee/officiating trends...",
  "Evaluating team form and H2H history...",
  "Simulating match scenarios (Monte Carlo)...",
  "Calculating Efficiency Metrics...",
  "Finalizing market probabilities..."
];

type ViewMode = 'explore' | 'booking';

const App: React.FC = () => {
  const [sport, setSport] = useState<Sport>('football');
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [analysis, setAnalysis] = useState<DeepAnalysis | null>(null);
  const [appState, setAppState] = useState<AnalysisState>({ status: 'loading_matches' });
  const [loadingMessage, setLoadingMessage] = useState(LOADING_MESSAGES[0]);
  const [viewMode, setViewMode] = useState<ViewMode>('explore');
  const [betSlip, setBetSlip] = useState<BetSelection[]>([]);
  
  // Date State - Default to local YYYY-MM-DD
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });

  // Reload matches when sport or date changes
  useEffect(() => {
    const loadMatches = async () => {
      setAppState({ status: 'loading_matches' });
      setMatches([]);
      try {
        const data = await fetchMatches(sport, selectedDate);
        // Strict client-side filtering to ensure no hallucinated dates slip through
        const filteredData = data.filter(m => m.date === selectedDate);
        setMatches(filteredData);
        setAppState({ status: 'idle' });
      } catch (e) {
        console.error(e);
        setAppState({ status: 'idle', error: `Failed to load ${sport} matches.` });
      }
    };
    loadMatches();
  }, [sport, selectedDate]);

  useEffect(() => {
    if (appState.status === 'analyzing') {
      let i = 0;
      const interval = setInterval(() => {
        i = (i + 1) % LOADING_MESSAGES.length;
        setLoadingMessage(LOADING_MESSAGES[i]);
      }, 2500);
      return () => clearInterval(interval);
    }
  }, [appState.status]);

  const handleMatchSelect = async (match: Match) => {
    setSelectedMatch(match);
    await startAnalysis(match);
  };

  const handleManualInput = async (input: string) => {
    // For manual input, we create a temporary match object
    const manualMatch: Match = {
      id: 'manual',
      home: input,
      away: '',
      league: 'Custom',
      date: selectedDate,
      sport: sport
    };
    setSelectedMatch(manualMatch);
    await startAnalysis(manualMatch, input);
  };

  const startAnalysis = async (match: Match, manualQuery?: string) => {
    setAppState({ status: 'analyzing' });
    setAnalysis(null);

    const matchString = manualQuery || `${match.home} vs ${match.away} (${match.league})`;

    try {
      const result = await analyzeMatchDeeply(matchString, match.sport);
      setAnalysis(result);
      setAppState({ status: 'complete' });
    } catch (e) {
      console.error(e);
      setAppState({ status: 'error', error: 'Analysis failed. Please try again later.' });
    }
  };

  const handleReset = () => {
    setSelectedMatch(null);
    setAnalysis(null);
    setAppState({ status: 'idle' });
  };

  const handleToggleBet = (selection: BetSelection) => {
    setBetSlip(prev => {
      const exists = prev.find(s => s.id === selection.id);
      if (exists) {
        return prev.filter(s => s.id !== selection.id);
      }
      return [...prev, { ...selection, sport }];
    });
  };

  const handleRemoveBet = (id: string) => {
    setBetSlip(prev => prev.filter(s => s.id !== id));
  };

  const handleClearSlip = () => {
    setBetSlip([]);
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-gray-200 selection:bg-indigo-500/30 pb-20">
      {/* Navbar */}
      <nav className="border-b border-gray-800 bg-[#0b0f19]/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={handleReset}>
            <div className="w-8 h-8 bg-gradient-to-tr from-indigo-600 to-violet-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-900/20">
              <BrainCircuit className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight text-white">Stati<span className="text-indigo-400">Match</span></span>
          </div>
          
          <div className="flex items-center gap-4">
             {/* Sport Switcher */}
             <div className="flex bg-gray-900 rounded-lg p-1 border border-gray-800">
                <button 
                  onClick={() => setSport('football')}
                  className={`px-3 py-1.5 rounded-md flex items-center gap-2 text-xs font-bold transition-all ${sport === 'football' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                >
                  <Trophy className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Football</span>
                </button>
                <button 
                  onClick={() => setSport('basketball')}
                  className={`px-3 py-1.5 rounded-md flex items-center gap-2 text-xs font-bold transition-all ${sport === 'basketball' ? 'bg-orange-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                >
                  <Dribbble className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Basketball</span>
                </button>
             </div>

             <div className="hidden md:flex items-center gap-3 text-[10px] font-bold tracking-widest text-gray-500 bg-gray-900 px-3 py-1.5 rounded-full border border-gray-800">
                <Activity className="w-3 h-3 text-emerald-500 animate-pulse" />
                <span>GEMINI 3 PRO</span>
             </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {(appState.status === 'analyzing' || appState.status === 'processing_code' || appState.status === 'loading_matches') && (
          <LoadingOverlay message={
            appState.status === 'processing_code' ? 'Deciphering booking code...' : 
            appState.status === 'loading_matches' ? `Fetching top ${sport} fixtures...` : 
            loadingMessage
          } />
        )}
        
        {appState.status === 'error' && (
           <div className="mb-8 p-4 bg-red-900/10 border border-red-500/20 rounded-xl text-red-200 flex items-center justify-between">
             <span className="flex items-center gap-2"><Activity className="w-4 h-4"/> {appState.error}</span>
             <button onClick={() => setAppState({status: 'idle'})} className="text-sm font-semibold hover:text-white transition-colors">DISMISS</button>
           </div>
        )}

        {appState.status === 'complete' && analysis && selectedMatch ? (
          <AnalysisResult 
            analysis={analysis} 
            matchTitle={selectedMatch.id === 'manual' ? selectedMatch.home : `${selectedMatch.home} vs ${selectedMatch.away}`}
            sport={selectedMatch.sport}
            onReset={handleReset} 
            betSlip={betSlip}
            onToggleBet={handleToggleBet}
            homeLogo={selectedMatch.homeLogo}
            awayLogo={selectedMatch.awayLogo}
          />
        ) : (
          <div className="flex flex-col items-center min-h-[70vh] space-y-12 pt-8">
            <div className="text-center space-y-4 max-w-3xl px-4">
              <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight">
                {sport === 'basketball' ? 'Courtside' : 'Pitchside'} <br/>
                <span className={`gradient-text ${sport === 'basketball' ? 'from-orange-500 to-amber-500' : ''}`}>Intelligence</span>
              </h1>
              <p className="text-lg text-gray-400 font-light">
                Professional grade analytics for {sport}. 
                {sport === 'football' ? ' Expected Goals, Referee stats, and tactical breakdowns.' : ' Pace, Efficiency, Four Factors, and Injury impact.'}
              </p>
            </div>

            {/* View Switcher */}
            <div className="bg-gray-900 p-1.5 rounded-xl border border-gray-800 flex gap-1 w-full max-w-md mx-auto">
              <button 
                onClick={() => setViewMode('explore')}
                className={`flex-1 py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${viewMode === 'explore' ? 'bg-gray-800 text-white shadow-sm border border-gray-700' : 'text-gray-500 hover:text-gray-300'}`}
              >
                <Search className="w-4 h-4" /> Explore
              </button>
              <button 
                onClick={() => setViewMode('booking')}
                className={`flex-1 py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${viewMode === 'booking' ? 'bg-gray-800 text-white shadow-sm border border-gray-700' : 'text-gray-500 hover:text-gray-300'}`}
              >
                <Ticket className="w-4 h-4" /> Load Code
              </button>
            </div>
            
            <div className="w-full">
              {viewMode === 'explore' ? (
                <MatchSelector 
                  matches={matches} 
                  isLoading={appState.status === 'loading_matches'}
                  onSelect={handleMatchSelect}
                  onManualInput={handleManualInput}
                  selectedDate={selectedDate}
                  onDateChange={setSelectedDate}
                />
              ) : (
                <BookingCodeSection 
                  onSelectMatch={handleMatchSelect}
                  setAppState={setAppState}
                  isLoading={appState.status === 'processing_code'}
                />
              )}
            </div>
          </div>
        )}
      </main>

      <BetBuilder 
        selections={betSlip} 
        onRemove={handleRemoveBet} 
        onClear={handleClearSlip} 
      />

      <footer className="border-t border-gray-800 mt-auto py-8 bg-[#0b0f19]">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-600 text-sm">
          <p className="font-semibold">&copy; {new Date().getFullYear()} StatiMatch. <span className="text-gray-700">Powered by saferstake.com philosophy</span></p>
          <p className="mt-2 text-xs opacity-60">
            Predictions are based on statistics and AI analysis. Sports betting involves risk. Please gamble responsibly. 18+
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;