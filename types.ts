export interface Match {
  home: string;
  away: string;
  league: string;
  date: string;
  time?: string;
  id: string;
  // Optional field for matches loaded from a booking code
  bookingPrediction?: string; 
}

export interface PredictionDetail {
  market: string;
  selection: string;
  confidence: 'High' | 'Medium' | 'Low';
  reasoning: string;
}

export interface DeepAnalysis {
  matchOverview: string;
  refereeAnalysis: string;
  formGuide: string;
  tacticalAnalysis: string;
  predictions: {
    winner: PredictionDetail;
    goals: PredictionDetail;
    cards: PredictionDetail;
    corners: PredictionDetail;
    handicap: PredictionDetail;
    playerStat: PredictionDetail;
  };
  bestBet: PredictionDetail;
  sources: { title: string; uri: string }[];
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
}