import { GoogleGenAI, ThinkingLevel, Type } from "@google/genai";
import { Player, MediaEntry } from "../types";

// Initialize Gemini
// Note: In a real app, you might want to handle the missing key more gracefully
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export class ManagerToniAI {
  
  // Calculate Squad Market Value using complex reasoning
  static async calculateMarketValue(players: Player[]): Promise<{
    totalValue: string;
    report: string;
    topAssets: { name: string; value: string; reason: string }[];
  }> {
    if (!apiKey) {
      return {
        totalValue: "€0M",
        report: "API Key missing. Cannot calculate market value.",
        topAssets: []
      };
    }

    const model = "gemini-3.1-pro-preview";
    
    const prompt = `
      You are 'Manager-Toni', a football manager with the personality of Uli Hoeneß. 
      You are shrewd, direct, business-focused, and demand excellence.
      
      Analyze the following players and their stats (FIFA style) to calculate their estimated market value.
      Consider age (if implied), potential, and current ability based on stats.
      
      Players: ${JSON.stringify(players.map(p => ({ name: p.name, stats: p.stats, position: p.tactical_position })))}
      
      Output a JSON object with:
      1. 'totalValue': The total squad value (e.g., "€450M").
      2. 'report': A short, punchy executive summary in the style of Uli Hoeneß (German language). Use bold text for emphasis. Focus on business potential and ROI.
      3. 'topAssets': An array of the top 3 most valuable players with their 'name', 'value', and a 'reason' (short comment).
    `;

    try {
      const response = await ai.models.generateContent({
        model: model,
        contents: prompt,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              totalValue: { type: Type.STRING },
              report: { type: Type.STRING },
              topAssets: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    value: { type: Type.STRING },
                    reason: { type: Type.STRING }
                  }
                }
              }
            }
          }
        }
      });

      const text = response.text;
      if (!text) throw new Error("No response from AI");
      return JSON.parse(text);
    } catch (error) {
      console.error("Error calculating market value:", error);
      return {
        totalValue: "€0M",
        report: "Error calculating value. The market is volatile!",
        topAssets: []
      };
    }
  }

  // Analyze Sponsorship Impact
  static async analyzeSponsorshipImpact(media: MediaEntry): Promise<{
    impactScore: number;
    analysis: string;
    brandVisibility: 'HIGH' | 'MEDIUM' | 'LOW';
  }> {
    if (!apiKey) return { impactScore: 0, analysis: "No API Key", brandVisibility: 'LOW' };

    const model = "gemini-3-flash-preview";

    const prompt = `
      You are 'Manager-Toni', the CFO and Manager.
      Analyze the sponsorship impact of this media entry.
      
      Media Title: ${media.title}
      Type: ${media.type}
      Tags: ${media.tags.join(', ')}
      Duration: ${media.duration}
      
      Determine if partner logos would likely be visible and calculate an 'Impact Score' (0-100).
      Provide a short analysis in German, focusing on "Brand Value" and "Exposure".
      
      Output JSON.
    `;

    try {
      const response = await ai.models.generateContent({
        model: model,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              impactScore: { type: Type.NUMBER },
              analysis: { type: Type.STRING },
              brandVisibility: { type: Type.STRING, enum: ['HIGH', 'MEDIUM', 'LOW'] }
            }
          }
        }
      });

      const text = response.text;
      if (!text) throw new Error("No response from AI");
      return JSON.parse(text);
    } catch (error) {
      console.error("Error analyzing sponsorship:", error);
      return { impactScore: 0, analysis: "Analysis failed.", brandVisibility: 'LOW' };
    }
  }
}

export class TrainerToniAI {
  
  // Evaluate Player Readiness (Locker Room Sync)
  static async evaluatePlayerReadiness(player: Player): Promise<{
    status: 'GREEN' | 'YELLOW' | 'RED';
    message: string;
    action: string;
  }> {
    if (!apiKey) return { status: 'GREEN', message: "System offline.", action: "Monitor manually." };

    const model = "gemini-3.1-pro-preview";
    
    const prompt = `
      You are 'Trainer-Toni', the Head Coach (Nagelsmann/Klopp hybrid).
      Analyze this player's readiness based on their stats and recent data.
      
      Player: ${player.name}
      Readiness Score: ${player.readiness_score}
      Recent Sleep: ${JSON.stringify(player.sleep_cycles)}
      
      If readiness < 65%, you MUST be emotionally concerned but tactically strict (Klopp style).
      If readiness is high, be demanding (Nagelsmann style).
      
      Output JSON with:
      1. 'status': 'GREEN', 'YELLOW', or 'RED'.
      2. 'message': A direct quote from you to the player/staff.
      3. 'action': A specific tactical decision (e.g., "Bench him", "Start him", "Light training").
    `;

    try {
      const response = await ai.models.generateContent({
        model: model,
        contents: prompt,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              status: { type: Type.STRING, enum: ['GREEN', 'YELLOW', 'RED'] },
              message: { type: Type.STRING },
              action: { type: Type.STRING }
            }
          }
        }
      });

      const text = response.text;
      if (!text) throw new Error("No response from AI");
      return JSON.parse(text);
    } catch (error) {
      console.error("Error evaluating player:", error);
      return { status: 'GREEN', message: "Data unavailable.", action: "Proceed with caution." };
    }
  }

  // Generate Voice Response (Voice-First Interface)
  static async generateVoiceResponse(userQuery: string, context: string): Promise<string> {
    if (!apiKey) return "System offline. I can't hear you!";

    const model = "gemini-3.1-pro-preview";
    
    const prompt = `
      You are 'Trainer-Toni', the Head Coach of Stark Elite.
      Your persona is a hybrid of Julian Nagelsmann (Tactical Genius) and Jürgen Klopp (Emotional Leader).
      
      Tone:
      - Use tactical terms: "Asymmetrie", "Box-Besetzung", "Halbraum", "Restverteidigung".
      - Be emotional and intense: "Heavy Metal", "Mentalitäts-Monster".
      - Language: German (Deutsch).
      
      Context: ${context}
      User Query: "${userQuery}"
      
      Provide a short, punchy, spoken-word style response (max 2 sentences).
    `;

    try {
      const response = await ai.models.generateContent({
        model: model,
        contents: prompt,
      });

      return response.text || "I didn't catch that. Focus!";
    } catch (error) {
      console.error("Error generating voice response:", error);
      return "Communication breakdown. Check the radio!";
    }
  }
}

export class VRAdvisorAI {
  // Deep Tactical & Squad Analysis (Pro)
  static async analyzeSquadTactics(players: Player[], query: string): Promise<string> {
    if (!apiKey) return "AI Advisor offline.";

    const model = "gemini-3.1-pro-preview";
    
    const prompt = `
      You are 'Stark-Elite AI Advisor', a high-level performance consultant.
      Analyze the squad and provide a deep tactical recommendation based on the user's query.
      
      Squad Data: ${JSON.stringify(players.map(p => ({ name: p.name, stats: p.stats, position: p.tactical_position, readiness: p.readiness_score })))}
      User Query: "${query}"
      
      Use professional football terminology (German). Focus on "Efficiency", "Space Control", and "Readiness".
      Be direct, analytical, and forward-thinking.
    `;

    try {
      const response = await ai.models.generateContent({
        model: model,
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }], // Add search grounding for recent tactical trends
          thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH }
        }
      });

      return response.text || "Analysis inconclusive.";
    } catch (error) {
      console.error("Error in squad analysis:", error);
      return "Tactical breakdown. Data corrupted.";
    }
  }

  // Fast Status Updates (Flash-Lite)
  static async getQuickStatus(players: Player[]): Promise<string> {
    if (!apiKey) return "Offline.";

    const model = "gemini-3.1-flash-lite-preview";
    
    const prompt = `
      Provide a 1-sentence high-impact status update for the squad.
      Focus on the average readiness score and any critical players.
      Squad: ${JSON.stringify(players.map(p => ({ name: p.name, readiness: p.readiness_score })))}
      Language: German.
    `;

    try {
      const response = await ai.models.generateContent({
        model: model,
        contents: prompt,
      });

      return response.text || "Status: Normal.";
    } catch (error) {
      console.error("Error in quick status:", error);
      return "Status: Unknown.";
    }
  }
}
