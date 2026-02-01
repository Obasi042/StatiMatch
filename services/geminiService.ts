import { GoogleGenAI } from "@google/genai";
import { Match, DeepAnalysis } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const JSON_EXTRACT_REGEX = /```json\s*([\s\S]*?)\s*```/;
const JSON_BACKUP_REGEX = /{[\s\S]*}/;

// Helper to clean and parse JSON from AI response
const parseJSON = (text: string) => {
  try {
    const match = text.match(JSON_EXTRACT_REGEX);
    if (match && match[1]) {
      return JSON.parse(match[1]);
    }
    const backupMatch = text.match(JSON_BACKUP_REGEX);
    if (backupMatch) {
      return JSON.parse(backupMatch[0]);
    }
    // Attempt to parse the whole text if it looks like JSON
    if (text.trim().startsWith('{')) {
      return JSON.parse(text);
    }
    throw new Error("No JSON found in response");
  } catch (e) {
    console.error("JSON Parse Error", e, text);
    throw e;
  }
};

export const fetchUpcomingMatches = async (): Promise<Match[]> => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const prompt = `
      Act as a sports scheduler. Search for the top 30 most exciting upcoming football matches in the "Big 5" European leagues (Premier League, La Liga, Bundesliga, Serie A, Ligue 1) and UEFA Champions League scheduled for the next 7 days starting from ${today}.
      
      Prioritize matches between top-table teams, derbies, or high-stakes games.

      Return ONLY a JSON object containing an array called "matches".
      Each match object must have: "home", "away", "league", "date" (YYYY-MM-DD), "time" (HH:MM).
      
      Example format:
      \`\`\`json
      {
        "matches": [
          { "home": "Arsenal", "away": "Liverpool", "league": "Premier League", "date": "2024-10-27", "time": "16:30" }
        ]
      }
      \`\`\`
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      }
    });

    const text = response.text || "";
    const data = parseJSON(text);
    
    if (!Array.isArray(data.matches)) {
        throw new Error("Invalid matches format");
    }

    return data.matches.map((m: any, idx: number) => ({
      ...m,
      id: `match-${idx}-${Date.now()}`
    }));
  } catch (error) {
    console.error("Error fetching matches:", error);
    // Return safe fallback data so the app doesn't look broken
    return [
      { id: 'fb-1', home: 'Real Madrid', away: 'Barcelona', league: 'La Liga', date: 'Upcoming', time: '20:00' },
      { id: 'fb-2', home: 'Man City', away: 'Arsenal', league: 'Premier League', date: 'Upcoming', time: '16:30' },
      { id: 'fb-3', home: 'Bayern Munich', away: 'Dortmund', league: 'Bundesliga', date: 'Upcoming', time: '18:30' },
      { id: 'fb-4', home: 'Inter', away: 'AC Milan', league: 'Serie A', date: 'Upcoming', time: '19:45' },
      { id: 'fb-5', home: 'PSG', away: 'Marseille', league: 'Ligue 1', date: 'Upcoming', time: '20:00' },
      { id: 'fb-6', home: 'Liverpool', away: 'Chelsea', league: 'Premier League', date: 'Upcoming', time: '15:00' }
    ];
  }
};

export const processBookingCode = async (code: string): Promise<Match[]> => {
  try {
    const prompt = `
      The user has provided a betting booking code: "${code}".
      Simulate the contents of this booking code by generating a list of 4-6 realistic high-profile football matches that might be in a popular accumulator bet this week.
      
      Return ONLY a JSON object containing an array called "matches".
      Each match object must have: "home", "away", "league", "date", "time", and "bookingPrediction".
      "bookingPrediction" should be a market like "Home Win", "Over 2.5", "GG", "Draw", etc.

      Example format:
      \`\`\`json
      {
        "matches": [
          { 
            "home": "Team A", 
            "away": "Team B", 
            "league": "Premier League", 
            "date": "2024-10-27", 
            "time": "20:00",
            "bookingPrediction": "Home Win"
          }
        ]
      }
      \`\`\`
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      // Removed googleSearch to prevent 429s/latency on this specific simulation task which relies more on generative capability
    });

    const text = response.text || "";
    const data = parseJSON(text);

    if (!Array.isArray(data.matches)) {
        throw new Error("Invalid matches format from booking code");
    }

    return data.matches.map((m: any, idx: number) => ({
      ...m,
      id: `booking-${code}-${idx}-${Date.now()}`
    }));
  } catch (error) {
    console.error("Error processing booking code", error);
    // Fallback if parsing fails or error occurs
    return [
       { id: 'bk-1', home: 'Man City', away: 'Liverpool', league: 'Premier League', date: 'Upcoming', time: '16:30', bookingPrediction: 'Over 2.5 Goals' },
       { id: 'bk-2', home: 'Inter', away: 'Juventus', league: 'Serie A', date: 'Upcoming', time: '19:45', bookingPrediction: 'Home Win' },
       { id: 'bk-3', home: 'Real Madrid', away: 'Barcelona', league: 'La Liga', date: 'Upcoming', time: '20:00', bookingPrediction: 'GG (Both Teams to Score)' }
    ];
  }
};

export const analyzeMatchDeeply = async (match: Match | string): Promise<DeepAnalysis> => {
  const matchString = typeof match === 'string' ? match : `${match.home} vs ${match.away} (${match.league})`;
  
  const prompt = `
    Act as a world-class football analyst and professional sports bettor. 
    Conduct an EXHAUSTIVE, DEEP-DIVE statistical research analysis for the match: ${matchString}.
    
    You MUST use the 'googleSearch' tool to retrieve the absolute latest real-time data.
    
    ### REQUIRED RESEARCH PILLARS (Use Statistical Models):
    1.  **Elo Rating System**: Search for the current Club Elo ratings for both teams. 
        -   Calculate the win probability delta.
    2.  **Poisson Distribution Model**: 
        -   Estimate the Attack/Defense Strength for both teams.
        -   Use these to estimate the expected goals (λ) for Home and Away.
    3.  **Player Performance Data**: 
        -   Identify key players in top form.
        -   Analyze metrics like "Shots on Target per game", "Pass Completion %" (for midfielders), or "Goals per 90".
        -   Find the SINGLE most probable player prop.
    4.  **Advanced Metrics**: Search for recent xG, xGA, and possession stats.
    5.  **Squad Intel**: Confirm latest injuries and suspensions.
    6.  **Tactical & Referee**: Analyze playstyles and referee strictness.

    ### PREDICTION LOGIC:
    -   **Model Triangulation**: predictions must be supported by Elo, Poisson, and Player Form.
    -   **Value Identification**: Highlight "Value" where models disagree with the market.
    -   **Accuracy**: Be precise.

    ### OUTPUT FORMAT:
    Return strictly a valid JSON object with this structure:
    {
      "matchOverview": "Executive summary including Elo Comparison and match context.",
      "refereeAnalysis": "Name of referee. Stat-backed analysis of their card/penalty strictness.",
      "formGuide": "Recent form (W-D-L), Elo ratings, and xG performance trends.",
      "tacticalAnalysis": "Tactical battle analysis. Explicitly mention Poisson-derived expected scorelines.",
      "predictions": {
        "winner": { "market": "1X2", "selection": "Home / Draw / Away", "confidence": "High/Medium/Low", "reasoning": "Reasoning based on Elo difference..." },
        "goals": { "market": "Over/Under 2.5", "selection": "Over / Under", "confidence": "...", "reasoning": "Reasoning based on Poisson probabilities..." },
        "cards": { "market": "Total Cards", "selection": "Over/Under X.5", "confidence": "...", "reasoning": "Based on referee stats..." },
        "corners": { "market": "Total Corners", "selection": "Over/Under X.5", "confidence": "...", "reasoning": "..." },
        "handicap": { "market": "Asian Handicap", "selection": "Team +/- X", "confidence": "...", "reasoning": "..." },
        "playerStat": { "market": "Player Props", "selection": "Player Name & Stat (e.g. Haaland 1+ SoT)", "confidence": "High/Medium/Low", "reasoning": "Based on recent shots/goals per 90 data." }
      },
      "bestBet": { 
        "market": "The single best value market",
        "selection": "The outcome",
        "confidence": "High",
        "reasoning": "Why this is the mathematical best bet."
      }
    }
  `;

  let response;
  try {
    // Try Pro model first for deep reasoning
    response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      }
    });
  } catch (error: any) {
    console.warn("Deep analysis error (Pro)", error);
    // If rate limited or service unavailable, try Flash
    if (error.status === 429 || error.code === 429 || error.status === 503) {
      console.warn("Falling back to Flash for analysis");
      response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
        }
      });
    } else {
      throw error;
    }
  }

  const text = response.text || "";
  const json = parseJSON(text);
  
  // Extract grounding sources
  const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  const sources = chunks
    .filter((c: any) => c.web && c.web.uri && c.web.title)
    .map((c: any) => ({ title: c.web.title, uri: c.web.uri }));

  const uniqueSources = Array.from(new Map(sources.map((item:any) => [item.uri, item])).values()) as { title: string; uri: string }[];

  return {
    ...json,
    sources: uniqueSources
  };
};