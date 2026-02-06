import { GoogleGenAI } from "@google/genai";
import { Match, DeepAnalysis, Sport } from "../types";

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

// Helper to sanitize strings and prevent objects from crashing React
const sanitizeString = (val: any, fallback: string): string => {
  if (typeof val === 'string') return val;
  if (typeof val === 'number') return String(val);
  if (val && typeof val === 'object') {
    // If AI incorrectly returns an object (e.g. { name: "Team" } or { home: "Team", away: "..." })
    if (val.name) return String(val.name);
    if (val.team) return String(val.team);
    // If the AI nested the match object inside the home field
    if (val.home && typeof val.home === 'string') return val.home; 
    // Fallback: try to stringify or just return fallback to prevent crash
    return fallback;
  }
  return fallback;
};

export const fetchMatches = async (sport: Sport = 'football', date: string): Promise<Match[]> => {
  try {
    let prompt = "";
    // Create a date object set to noon to avoid timezone shifts when formatting
    const dateObj = new Date(date + 'T12:00:00');
    const targetDate = dateObj.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    
    if (sport === 'football') {
        prompt = `
          Act as a sports data engine. Find the schedule for ${sport} matches on EXACTLY ${targetDate} (YYYY-MM-DD: ${date}).
          
          You MUST use the 'googleSearch' tool. 
          Perform a search query like: "${sport} fixtures ${targetDate}".
          
          STRICT DATE FILTERING RULES:
          1.  **EXACT MATCH**: Only include matches where the kick-off is on ${date} (local/UTC).
          2.  **EXCLUDE SURROUNDING DAYS**: Do NOT include matches from the day before or the day after, even if they are part of the same "Matchday".
          3.  **QUANTITY**: Find up to 30 matches if available.
          
          LEAGUE PRIORITY:
          1.  Big 5 Europe (Premier League, La Liga, Bundesliga, Serie A, Ligue 1).
          2.  European Competitions (UCL, UEL, Conference).
          3.  Major Global Leagues (MLS, Saudi Pro League, Brasileirão, Eredivisie, Liga Portugal).
          4.  International Friendlies/Qualifiers.
        `;
    } else {
        prompt = `
          Act as a sports data engine. Find the schedule for Basketball matches on EXACTLY ${targetDate} (YYYY-MM-DD: ${date}).
          
          You MUST use the 'googleSearch' tool.
          
          STRICT RULES:
          1. Include ALL NBA games scheduled for ${date}.
          2. Include top EuroLeague games on ${date}.
          3. Exclude games not played on this specific calendar date.
        `;
    }

    prompt += `
      Return ONLY a valid JSON object. No markdown formatting outside the JSON block.
      Format:
      \`\`\`json
      {
        "matches": [
          { 
            "home": "Team A", 
            "away": "Team B", 
            "league": "Competition Name", 
            "date": "${date}", 
            "time": "HH:MM",
            "homeLogo": "url_to_logo_png",
            "awayLogo": "url_to_logo_png"
          }
        ]
      }
      \`\`\`
      
      CRITICAL: The "date" field in the JSON MUST be exactly "${date}". If a match is on a different date, DO NOT include it in the list.
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

    // Map and Sanitize data to prevent React Object Errors
    return data.matches.map((m: any, idx: number) => ({
      home: sanitizeString(m.home, 'Unknown Home'),
      away: sanitizeString(m.away, 'Unknown Away'),
      league: sanitizeString(m.league, 'Unknown League'),
      date: sanitizeString(m.date, date),
      time: sanitizeString(m.time, '00:00'),
      homeLogo: typeof m.homeLogo === 'string' ? m.homeLogo : undefined,
      awayLogo: typeof m.awayLogo === 'string' ? m.awayLogo : undefined,
      sport,
      id: `match-${sport}-${idx}-${Date.now()}`
    }));
  } catch (error) {
    console.error(`Error fetching ${sport} matches:`, error);
    return [];
  }
};

export const processBookingCode = async (code: string): Promise<Match[]> => {
  try {
    const prompt = `
      The user has provided a betting booking code: "${code}".
      Simulate the contents of this booking code by generating a list of 4-6 realistic high-profile matches (Football or Basketball) that might be in a popular accumulator bet this week.
      
      Return ONLY a JSON object containing an array called "matches".
      Each match object must have: 
      - "home", "away", "league", "date", "time", "sport" ('football' or 'basketball'), "bookingPrediction".
      - "homeLogo", "awayLogo" (URL strings).
      
      "bookingPrediction" should be a market like "Home Win", "Over 2.5", "GG", "Draw", etc.

      Example format:
      \`\`\`json
      {
        "matches": [
          { 
            "home": "Team A", 
            "away": "Team B", 
            "league": "NBA", 
            "date": "2024-10-27", 
            "time": "20:00",
            "sport": "basketball",
            "bookingPrediction": "Home Win",
            "homeLogo": "...",
            "awayLogo": "..."
          }
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
        throw new Error("Invalid matches format from booking code");
    }

    return data.matches.map((m: any, idx: number) => ({
      home: sanitizeString(m.home, 'Team A'),
      away: sanitizeString(m.away, 'Team B'),
      league: sanitizeString(m.league, 'League'),
      date: sanitizeString(m.date, new Date().toISOString().split('T')[0]),
      time: sanitizeString(m.time, '00:00'),
      bookingPrediction: sanitizeString(m.bookingPrediction, ''),
      homeLogo: typeof m.homeLogo === 'string' ? m.homeLogo : undefined,
      awayLogo: typeof m.awayLogo === 'string' ? m.awayLogo : undefined,
      sport: m.sport === 'basketball' ? 'basketball' : 'football',
      id: `booking-${code}-${idx}-${Date.now()}`
    }));
  } catch (error) {
    console.error("Error processing booking code", error);
    return [];
  }
};

export const analyzeMatchDeeply = async (match: Match | string, sport: Sport = 'football'): Promise<DeepAnalysis> => {
  const matchString = typeof match === 'string' ? match : `${match.home} vs ${match.away} (${match.league})`;
  
  let prompt = "";

  if (sport === 'football') {
    prompt = `
    Act as a Professional Sports Quantitative Analyst and Handicapper. 
    Perform a rigorous, "Exhaustive Deep-Dive" analysis for: ${matchString}.
    
    You MUST use 'googleSearch' to gather the following real-time data points:
    1.  **Confirmed Injuries/Suspensions**: Identify key missing players and calculate their "Value Above Replacement" impact.
    2.  **Referee Statistics**: Find the appointed referee. Retrieve their "Yellow Cards per Game" and "Fouls per Game" average for the current season.
    3.  **Advanced Team Metrics**:
        -   Expected Goals (xG) for and against (Last 5 games).
        -   Home/Away splits (Home Advantage factor).
        -   Recent tactical shifts (e.g. Change in formation).
    4.  **H2H & Psychology**: Historical dominance and current motivation (e.g. "Relegation fight" vs "Mid-table comfort").

    **ANALYSIS & MODELING (Reasoning Process):**
    -   **Tactical Simulation**: Predict how the styles clash (e.g. "Counter-attack vs High Line").
    -   **Poisson Distribution**: Estimate the probability of 0, 1, 2, 3+ goals for each team.
    -   **Market Value**: Compare your calculated probabilities against standard market odds to find "Value".

    **OUTPUT INSTRUCTION:**
    Return a VALID JSON object (no markdown text outside) with this EXACT structure:

    {
      "matchOverview": "A high-level executive summary of the match context, stakes, and narrative.",
      "refereeAnalysis": "Name the referee. Cite their stats (e.g. 'Avg 4.5 cards/game'). conclude on card potential.",
      "formGuide": "Deep analysis of recent form using xG. (e.g. 'Team A won last 2 but xG suggests they were lucky').",
      "tacticalAnalysis": "Detailed tactical breakdown. Key matchups (e.g. 'Winger X vs Fullback Y').",
      "predictions": {
        "winner": { 
            "market": "1X2 / Moneyline", 
            "selection": "The prediction", 
            "confidence": "High/Medium/Low", 
            "reasoning": "Quantitative reasoning. e.g. 'Model gives 60% win prob, implied odds are 50%.'"
        },
        "goals": { 
            "market": "Total Goals", 
            "selection": "e.g. Over 2.5", 
            "confidence": "...", 
            "reasoning": "Based on xG trends and defensive absentee analysis."
        },
        "cards": { 
            "market": "Bookings / Cards", 
            "selection": "e.g. Over 4.5 Cards", 
            "confidence": "...", 
            "reasoning": "Referee strictness + Team foul averages + Match importance."
        },
        "corners": { 
            "market": "Corners", 
            "selection": "e.g. Home Over 5.5", 
            "confidence": "...", 
            "reasoning": "Based on 'Shots Deflected' rate and 'Crosses Attempted' stats."
        },
        "handicap": { 
            "market": "Asian Handicap", 
            "selection": "e.g. Away +0.5", 
            "confidence": "...", 
            "reasoning": "Why the underdog is undervalued or favorite is overvalued."
        },
        "playerStat": { 
           "market": "Player Prop", 
           "selection": "e.g. Player X Over 0.5 Assists", 
           "confidence": "...", 
           "reasoning": "Player recent form + Opponent defensive weakness in that zone."
        }
      },
      "bestBet": { 
        "market": "Best Value Market", 
        "selection": "The single best bet", 
        "confidence": "High", 
        "reasoning": "Why this specific bet offers the highest positive expected value (EV+) and probability." 
      },
      "visualization": {
         "footballMomentum": [/* 6 integers (0-100) representing Home Team dominance in 15-min chunks. 0-50=Away, 50-100=Home. e.g. [55, 60, 45, 70, 80, 50] */]
      }
    }
    `;
  } else {
    // BASKETBALL PROMPT - HIGH ACCURACY MODE (90% TARGET)
     prompt = `
    Act as the Lead Data Scientist for an Elite Sports Betting Syndicate.
    Your goal is to run a "Monte Carlo" style simulation to find the **Best Game Line Value** (Spread, Total, or Moneyline) with >90% statistical confidence.
    
    MATCH: ${matchString}
    
    ### PHASE 1: VARIABLE EXTRACTION (Use 'googleSearch')
    1.  **Usage Vacuum Protocol**: If Star Player A is OUT, mathematically distribute their Usage Rate (USG%) to remaining starters.
    2.  **Pace Factor**: Calculate (Team A Pace + Team B Pace) / 2. Compare to League Average (99.5). Generate a 'Pace Multiplier' (e.g. 1.04x).
    3.  **DvP Efficiency**: Find the Opponent's Rank vs the Player's Position (e.g. "Spurs allow 2nd most Reb to Centers").
    4.  **Blowout Risk**: If the Spread is >12.5, reduce projected minutes by 15% to account for 4th quarter benching.

    ### PHASE 2: ALGORITHMIC CALCULATION
    -   **Game Simulation**: Run 10,000 sims using Pace, Offensive Rating, and Defensive Rating to determine the most likely Final Score.
    -   **Line Value**: Compare your Projected Score/Spread vs Vegas. 
    
    ### PHASE 3: EDGE DETECTION
    -   Identify the "Game Market" (Spread, Moneyline, Total) with the highest ROI/Edge. 
    -   **CRITICAL: The 'bestBet' MUST be a Game Market (Spread, Total, or Moneyline), NOT a Player Prop.**

    ### OUTPUT JSON
    Structure specifically for High-Value accuracy.
    
    In 'reasoning' for playerStat, use this format:
    "PROJ: [Your Calc] | LINE: [Vegas] | DIFF: [Edge%] | L10: [Hit Rate/10]
    [Brief analysis of Usage Vacuum or Matchup Advantage]"

    JSON Structure:
    {
      "matchOverview": "Contextual overview including Injury Impacts and Pace Analysis.",
      "refereeAnalysis": "N/A",
      "formGuide": "ATS Trends and Home/Away Splits.",
      "tacticalAnalysis": "DvP (Defense vs Position) Mismatches and Style Clash.",
      "predictions": {
        "winner": { "market": "Moneyline", "selection": "...", "confidence": "...", "reasoning": "..." },
        "goals": { "market": "Total Points", "selection": "...", "confidence": "...", "reasoning": "..." },
        "handicap": { "market": "Spread", "selection": "...", "confidence": "...", "reasoning": "..." },
        "halftime": { "market": "1st Half Total", "selection": "...", "confidence": "...", "reasoning": "..." },
        "teamPoints": { "market": "Team Total", "selection": "...", "confidence": "...", "reasoning": "..." },
        "playerStat": { 
           "market": "Player Prop", 
           "selection": "Player Name [Over/Under] [Line] [Stat]", 
           "confidence": "High", 
           "reasoning": "PROJ: XX.X | LINE: YY.Y | DIFF: +ZZ% | L10: X/10 ... Text Analysis..." 
        }
      },
      "bestBet": { 
        "market": "Best Value Market", 
        "selection": "The single best Game Line bet (Spread/Total/Moneyline)", 
        "confidence": "High", 
        "reasoning": "Why this specific Game Line bet has the highest expected value (EV)."
      },
      "visualization": {
        "basketballTrend": [/* Array of numbers representing the player's actual stat values in Last 5 Games e.g. [24, 18, 30, 22, 25] */],
        "trendLabel": "Last 5 Games Trend"
      }
    }
    `;
  }

  let response;
  try {
    response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        // Increased thinking budget for the heavy math logic in Basketball
        thinkingConfig: { thinkingBudget: 20000 } 
      }
    });
  } catch (error: any) {
    console.warn("Deep analysis error (Pro)", error);
    // Fallback if Pro fails or Thinking quota exceeded
    if (error.status === 429 || error.code === 429 || error.status === 503 || error.message?.includes('thinking')) {
      console.warn("Falling back to Flash (or retrying without thinking)");
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
  
  const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  const sources = chunks
    .filter((c: any) => c.web && c.web.uri && c.web.title)
    .map((c: any) => ({ title: c.web.title, uri: c.web.uri }));

  const uniqueSources = Array.from(new Map(sources.map((item:any) => [item.uri, item])).values()) as { title: string; uri: string }[];

  // Sanitize the DeepAnalysis object recursively or specifically
  // Since DeepAnalysis has nested objects, we'll just sanitize strings at the top level and known paths if needed.
  // Ideally, parseJSON should be robust, but here is a basic safeguard if needed.
  
  return {
    ...json,
    sources: uniqueSources
  };
};