import React, { useState, useEffect } from 'react';
import { fetchUpcomingMatches, analyzeMatchDeeply } from './services/geminiService';
import MatchSelector from './components/MatchSelector';
import BookingCodeSection from './components/BookingCodeSection';
import AnalysisResult from './components/AnalysisResult';
import LoadingOverlay from './components/LoadingOverlay';
import BetBuilder from './components/BetBuilder';
import { Match, DeepAnalysis, AnalysisState, BetSelection } from './types';
import { Activity, BrainCircuit, Search, Ticket } from 'lucide-react';

const LOADING_MESSAGES = [
  "Searching global sports databases...",
  "Analyzing referee card distribution...",
  "Evaluating team form and H2H history...",
  "Simulating match scenarios (Monte Carlo)...",
  "Calculating Expected Goals (xG)...",
  "Finalizing market probabilities..."
];

type ViewMode = 'explore' | 'booking';

const App: React.FC = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<DeepAnalysis | null>(null);
  const [appState, setAppState] = useState<AnalysisState>({ status: 'loading_matches' });
  const [loadingMessage, setLoadingMessage] = useState(LOADING_MESSAGES[0]);
  const [viewMode, setViewMode] = useState<ViewMode>('explore');
  const [betSlip, setBetSlip] = useState<BetSelection[]>([]);

  useEffect(() => {
    // Initial fetch of matches
    const loadMatches = async () => {
      try {
        const data = await fetchUpcomingMatches();
        setMatches(data);
        setAppState({ status: 'idle' });
      } catch (e) {
        console.error(e);
        setAppState({ status: 'idle', error: 'Failed to load upcoming matches. You can still search manually.' });
      }
    };
    loadMatches();
  }, []);

  // Cycle loading messages when analyzing
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
    startAnalysis(`${match.home} vs ${match.away} (${match.league})`);
  };

  const handleManualInput = async (input: string) => {
    startAnalysis(input);
  };

  const startAnalysis = async (matchString: string) => {
    setSelectedMatch(matchString);
    setAppState({ status: 'analyzing' });
    setAnalysis(null);

    try {
      const result = await analyzeMatchDeeply(matchString);
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
      return [...prev, selection];
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
          <div className="hidden sm:flex items-center gap-3 text-[10px] font-bold tracking-widest text-gray-500 bg-gray-900 px-3 py-1.5 rounded-full border border-gray-800">
             <Activity className="w-3 h-3 text-emerald-500 animate-pulse" />
             <span>ENGINE: GEMINI 3 PRO</span>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {(appState.status === 'analyzing' || appState.status === 'processing_code') && (
          <LoadingOverlay message={appState.status === 'processing_code' ? 'Deciphering booking code...' : loadingMessage} />
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
            matchTitle={selectedMatch} 
            onReset={handleReset} 
            betSlip={betSlip}
            onToggleBet={handleToggleBet}
          />
        ) : (
          <div className="flex flex-col items-center min-h-[70vh] space-y-12 pt-8">
            <div className="text-center space-y-4 max-w-3xl px-4">
              <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight">
                Data-Driven <br/>
                <span className="gradient-text">Betting Intelligence</span>
              </h1>
              <p className="text-lg text-gray-400 font-light">
                Professional grade analytics. Load a booking code or search a match to get AI-powered probabilities, tactical breakdowns, and value predictions.
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