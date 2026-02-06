export type Sport = 'football' | 'basketball';

export interface Match {
  home: string;
  away: string;
  league: string;
  date: string;
  time?: string;
  id: string;
  sport: Sport;
  homeLogo?: string;
  awayLogo?: string;
  // Optional field for matches loaded from a booking code
  bookingPrediction?: string; 
}

export interface PredictionDetail {
  market: string;
  selection: string;
  confidence: 'High' | 'Medium' | 'Low';
  reasoning: string;
}

export interface Visualization {
  footballMomentum?: number[]; // Array of 6 numbers (0-100) representing Home dominance per 15min
  basketballTrend?: number[]; // Array of last 5 games stats
  trendLabel?: string; // e.g. "Points in Last 5"
}

export interface DeepAnalysis {
  matchOverview: string;
  refereeAnalysis: string; // Used for Football
  formGuide: string;
  tacticalAnalysis: string;
  predictions: {
    winner: PredictionDetail;
    goals: PredictionDetail; // Football: O/U Goals | Basketball: Fulltime O/U
    cards?: PredictionDetail; // Football Only
    corners?: PredictionDetail; // Football Only
    handicap: PredictionDetail;
    playerStat: PredictionDetail;
    // Basketball Specific
    halftime?: PredictionDetail; 
    teamPoints?: PredictionDetail;
  };
  bestBet: PredictionDetail;
  sources: { title: string; uri: string }[];
  visualization?: Visualization;
}

export interface AnalysisState {
  status: 'idle' | 'loading_matches' | 'processing_code' | 'analyzing' | 'complete' | 'error';
  error?: string;
  currentStep?: string; 
}

export interface BetSelection {
  id: string;
  matchTitle: string;
  selection: string;
  market: string;
  confidence: 'High' | 'Medium' | 'Low';
  sport?: Sport;
}