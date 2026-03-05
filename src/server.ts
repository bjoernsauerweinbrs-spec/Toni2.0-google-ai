import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Mock Database
const DB_FILE = path.join(__dirname, 'db.json');

// Initial Data
const INITIAL_PLAYERS = [
  { id: 'p1', name: 'Luka M.', category: 'PRO', readiness_score: 72, hrv_data: [], sleep_cycles: { deep_sleep: '2h', rem: '1h' }, tactical_position: 'Midfield Playmaker', scouting_metrics: { technique: 92, vision: 95 }, stats: { pace: 74, shooting: 82, passing: 94, dribbling: 90, defending: 68, physical: 65 } },
  { id: 'p2', name: 'Erling H.', category: 'PRO', readiness_score: 58, hrv_data: [], sleep_cycles: { deep_sleep: '1h', rem: '1h' }, tactical_position: 'Striker', scouting_metrics: { finishing: 98, speed: 94 }, stats: { pace: 96, shooting: 95, passing: 65, dribbling: 80, defending: 45, physical: 88 } },
  { id: 'p3', name: 'Joshua K.', category: 'PRO', readiness_score: 88, hrv_data: [], sleep_cycles: { deep_sleep: '2h', rem: '2h' }, tactical_position: 'Defensive Midfield', scouting_metrics: { passing: 90, stamina: 96 }, stats: { pace: 75, shooting: 78, passing: 92, dribbling: 82, defending: 85, physical: 80 } },
  { id: 'p4', name: 'Jamal M.', category: 'PRO', readiness_score: 92, hrv_data: [], sleep_cycles: { deep_sleep: '2h', rem: '2h' }, tactical_position: 'Attacking Midfield', scouting_metrics: { dribbling: 98, agility: 95 }, stats: { pace: 88, shooting: 84, passing: 86, dribbling: 96, defending: 55, physical: 68 } },
  { id: 'p5', name: 'Alphonso D.', category: 'PRO', readiness_score: 64, hrv_data: [], sleep_cycles: { deep_sleep: '1h', rem: '1h' }, tactical_position: 'Left Back', scouting_metrics: { speed: 99, recovery: 90 }, stats: { pace: 97, shooting: 68, passing: 76, dribbling: 84, defending: 78, physical: 82 } },
];

const INITIAL_YOUTH_PLAYERS = [
  { id: 'y1', name: 'Toni Jr.', category: 'YOUTH', readiness_score: 95, hrv_data: [], sleep_cycles: { deep_sleep: '3h', rem: '2h' }, tactical_position: 'Funino Master', scouting_metrics: { intelligence: 98, joy: 100 }, stats: { pace: 80, shooting: 75, passing: 85, dribbling: 90, defending: 60, physical: 55 } },
  { id: 'y2', name: 'Mini-Klopp', category: 'YOUTH', readiness_score: 90, hrv_data: [], sleep_cycles: { deep_sleep: '2.5h', rem: '2h' }, tactical_position: 'G-Jugend Captain', scouting_metrics: { leadership: 95, energy: 99 }, stats: { pace: 70, shooting: 70, passing: 75, dribbling: 75, defending: 70, physical: 65 } },
];

interface DB {
  players: any[];
  youthPlayers: any[];
  journalPages?: any[];
  articles?: any[];
  playerHighlights?: Record<string, any[]>;
}

// Load or Initialize DB
let db: DB = { players: INITIAL_PLAYERS, youthPlayers: INITIAL_YOUTH_PLAYERS };
if (fs.existsSync(DB_FILE)) {
  try {
    db = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
  } catch (e) {
    console.error("Failed to load DB, using initial data");
  }
} else {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

const saveDb = () => {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
};

const SYSTEM_INSTRUCTIONS = {
  COACH: "You are 'The Coach' (Toni-Coach). Focus: Tactical execution, geometry of the pitch, pressing intensity. Tone: Motivational, sharp.",
  MANAGER: "You are 'The Manager' (Toni-Manager). Focus: Financial efficiency, ROI, club prestige. Tone: Direct, business-oriented.",
  DOCTOR: "You are 'The Doctor' (Toni-Doc). Focus: Physiology, injury prevention, HRV. Tone: Calm, factual, medical.",
  JOURNALIST: "You are 'Presse-Toni', a sharp, slightly provocative sports journalist. Conduct a short interview (5-7 exchanges) with the interviewee about the topic. The tone should be professional but intense, like a high-stakes sports magazine."
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // --- API Routes ---

  // Get Players
  app.get('/api/players', (req, res) => {
    const { category } = req.query;
    if (category === 'YOUTH') {
      return res.json(db.youthPlayers);
    }
    res.json(db.players);
  });

  // Update Player
  app.put('/api/players/:id', (req, res) => {
    const { id } = req.params;
    const updatedPlayer = req.body;
    
    const index = db.players.findIndex(p => p.id === id);
    if (index !== -1) {
      // Doctor-Toni Readiness Algorithm
      let newReadiness = updatedPlayer.readiness_score;
      
      if (updatedPlayer.sleep_cycles || updatedPlayer.activity || updatedPlayer.biometrics) {
        // Mock calculations for the algorithm
        // 1. Sleep (40%) - based on deep sleep + rem
        let sleepScore = 80; // Default
        if (updatedPlayer.sleep_cycles) {
          const deep = parseFloat(updatedPlayer.sleep_cycles.deep_sleep) || 2;
          const rem = parseFloat(updatedPlayer.sleep_cycles.rem) || 1.5;
          sleepScore = Math.min(100, ((deep + rem) / 4) * 100);
        }
        
        // 2. HRV Trend (35%) - based on resting HR and mock HRV
        let hrvScore = 75; // Default
        if (updatedPlayer.activity) {
          const restingHr = updatedPlayer.activity.resting_hr || 50;
          hrvScore = Math.max(0, 100 - (restingHr - 40) * 2); // Lower HR = better score
        }
        
        // 3. Muscle Recovery (25%) - based on muscle mass and body fat
        let muscleScore = 85; // Default
        if (updatedPlayer.biometrics) {
          const muscle = updatedPlayer.biometrics.muscle_mass || 40;
          const fat = updatedPlayer.biometrics.body_fat || 10;
          muscleScore = Math.min(100, (muscle / (fat || 1)) * 20);
        }
        
        newReadiness = Math.round((sleepScore * 0.40) + (hrvScore * 0.35) + (muscleScore * 0.25));
        
        // Red Zone Alert Logic
        if (newReadiness < 65) {
          updatedPlayer.status_override = 'RED';
        } else if (newReadiness >= 85) {
          updatedPlayer.status_override = 'GREEN';
        } else {
          updatedPlayer.status_override = 'YELLOW';
        }
      }

      db.players[index] = { ...db.players[index], ...updatedPlayer, readiness_score: newReadiness };
      saveDb();
      res.json({ ...db.players[index], newReadiness });
    } else {
      res.status(404).json({ error: "Player not found" });
    }
  });

  // Generate Medical Report
  app.post('/api/journal/medical', async (req, res) => {
    const { players } = req.body;
    try {
      const prompt = `
        You are 'Doctor-Toni', the Head of Performance & Medicine at Stark Elite.
        Write the "Medical Corner" for the Stark Performance Journal.
        
        Context (Current Squad Readiness):
        ${players.map((p: any) => `- ${p.name}: ${p.readiness_score}% Readiness`).join('\n')}
        
        Task:
        Explain the science behind the current squad's fitness. Translate complex data into professional, actionable advice for the coaching staff.
        Use medical terminology (e.g., HRV, Sympathetic Activity, REM Architecture, Lactate Threshold).
        
        Tone: Clinical, precise, data-driven, authoritative.
        Format: Return a plain text string with paragraphs (no markdown headers, just text).
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-preview",
        contents: prompt,
      });

      res.json({ analysis: response.text });
    } catch (e) {
      console.error("Medical report generation failed", e);
      res.status(500).json({ error: "Medical report failed" });
    }
  });

  // Generate Opponent Analysis
  app.post('/api/journal/opponent', async (req, res) => {
    const { teamName } = req.body;
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-preview",
        contents: `Analyze the football team "${teamName}". Provide their last 5 match results (W/L/D), 3 key players with a short role description, their typical formation, and a tactical summary. Use Google Search to get the latest data.`,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              analysis: {
                type: Type.OBJECT,
                properties: {
                  last_matches: { type: Type.ARRAY, items: { type: Type.STRING } },
                  key_players: { type: Type.ARRAY, items: { type: Type.STRING } },
                  formation: { type: Type.STRING },
                  summary: { type: Type.STRING }
                }
              }
            }
          }
        }
      });
      
      const text = response.text;
      if (text) {
        res.json(JSON.parse(text));
      } else {
        res.status(500).json({ error: "No content generated" });
      }
    } catch (e) {
      console.error("Opponent analysis failed", e);
      res.status(500).json({ error: "Analysis failed" });
    }
  });

  // Generate Interview
  app.post('/api/journal/interview', async (req, res) => {
    const { topic, interviewee } = req.body;
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-preview",
        contents: `Conduct a short interview (5-7 exchanges) with "${interviewee}" about "${topic}".`,
        config: {
          systemInstruction: SYSTEM_INSTRUCTIONS.JOURNALIST,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              interview: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    speaker: { type: Type.STRING },
                    text: { type: Type.STRING }
                  }
                }
              }
            }
          }
        }
      });

      const text = response.text;
      if (text) {
        res.json(JSON.parse(text));
      } else {
        res.status(500).json({ error: "No content generated" });
      }
    } catch (e) {
      console.error("Interview generation failed", e);
      res.status(500).json({ error: "Interview failed" });
    }
  });

  // Save Interview to Journal
  app.post('/api/journal/save-interview', (req, res) => {
    const session = req.body;
    
    const newPage = {
      id: `interview-${Date.now()}`,
      type: 'INTERVIEW',
      data: {
        topic: session.topic,
        interviewee: 'Head Coach', // Or derive from session
        lines: session.questions.map((q: any, i: number) => ([
          { speaker: 'Presse-Toni', text: q.text },
          { speaker: 'Coach', text: session.answers[i] || '' }
        ])).flat(),
        headline: session.articleHeadline,
        body: session.articleBody,
        image_url: "https://picsum.photos/seed/interview/800/600" // Placeholder
      }
    };

    if (!db.journalPages) db.journalPages = [];
    db.journalPages.push(newPage);
    saveDb();

    res.json({ success: true, page: newPage });
  });

  // --- Briefcase Routes ---

  // Get Briefcase Articles
  app.get('/api/briefcase/articles', (req, res) => {
    // Mock data if db.articles doesn't exist yet
    if (!db.articles) {
      db.articles = [
        { id: 'a1', title: 'SEASON OPENER', subtitle: 'The tactical breakdown of Matchday 1', content: 'An in-depth look at how the 4-2-3-1 formation dismantled the opposition defense...', author: 'Presse-Toni', date: '2025-08-15', tags: ['TACTICS', 'MATCHDAY'] }
      ];
    }
    res.json(db.articles);
  });

  // Add Article to Briefcase
  app.post('/api/briefcase/articles', (req, res) => {
    const newArticle = req.body;
    if (!db.articles) db.articles = [];
    db.articles.unshift({ ...newArticle, id: `art-${Date.now()}`, date: new Date().toISOString().split('T')[0] });
    saveDb();
    res.json({ success: true });
  });

  // Get Briefcase Sponsors (Mock)
  app.get('/api/briefcase/sponsors', (req, res) => {
    res.json([
      { id: 's1', name: 'TechCorp', tier: 'PLATINUM', value: '€5.2M', roi: 12, status: 'ACTIVE' },
      { id: 's2', name: 'BevCo', tier: 'GOLD', value: '€2.1M', roi: 8, status: 'ACTIVE' },
      { id: 's3', name: 'SportWear', tier: 'SILVER', value: '€1.5M', roi: 5, status: 'PENDING' }
    ]);
  });

  // --- AI Routes ---

  // Generate Journal Summary
  app.post('/api/journal/summary', async (req, res) => {
    const { pages } = req.body;
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-preview",
        contents: `You are 'Presse-Toni', the Chief Editor. Review the following magazine pages and generate a short, punchy, professional summary (max 2 sentences) to pitch this issue to the Head Coach.
        
        Pages: ${JSON.stringify(pages)}`,
      });
      res.json({ summary: response.text });
    } catch (e) {
      console.error("Summary generation failed", e);
      res.status(500).json({ error: "Summary failed" });
    }
  });

  // Text-to-Speech
  app.post('/api/tts', async (req, res) => {
    const { text } = req.body;
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: {
          parts: [{ text }]
        },
        config: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: "Puck" } // 'Puck' is a good fit for a male persona
            }
          }
        }
      });

      const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (audioData) {
        res.json({ audio: audioData });
      } else {
        res.status(500).json({ error: "No audio generated" });
      }
    } catch (e) {
      console.error("TTS failed", e);
      res.status(500).json({ error: "TTS failed" });
    }
  });

  // --- Video Analysis & Journal Sync ---

  // Process Video Highlight (Simulates Cloud Function)
  app.post('/api/video/process', async (req, res) => {
    const { videoUrl, playerId, playerName, eventType, metrics } = req.body;
    
    try {
      // 1. Generate Caption with Presse-Toni Persona
      const prompt = `
        You are 'Presse-Toni', the Chief Editor of the Red Bull / Stark Performance Journal.
        Write a short, aggressive, high-impact headline (max 5 words) and a 1-sentence caption for a video highlight.
        
        Context:
        - Player: ${playerName}
        - Event: ${eventType}
        - Biometrics: Heart Rate ${metrics?.heart_rate || 'N/A'} bpm, Top Speed ${metrics?.speed || 'N/A'} km/h.
        
        Style Guide:
        - Red Bulletin Aesthetic: Bold, energetic, punchy.
        - Use the biometric data to emphasize the physical feat.
        - Return ONLY JSON: { "headline": "...", "caption": "..." }
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-preview",
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });
      
      const generatedContent = JSON.parse(response.text);

      // 2. Create Journal Page Payload
      const newPage = {
        id: `highlight-${Date.now()}`,
        type: 'HIGHLIGHTS',
        data: {
          videoUrl: videoUrl || "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
          headline: generatedContent.headline,
          caption: generatedContent.caption,
          metrics: metrics,
          playerId: playerId,
          timestamp: "Matchday 14 - 78'"
        }
      };

      // 3. Persist to Journal Pages (Mock DB)
      if (!db.journalPages) db.journalPages = [];
      db.journalPages.push(newPage);

      // 4. Persist to Player Highlights (Mock DB)
      if (!db.playerHighlights) db.playerHighlights = {};
      if (!db.playerHighlights[playerId]) db.playerHighlights[playerId] = [];
      db.playerHighlights[playerId].unshift(newPage);

      // 5. Sync to Briefcase (Mock DB)
      if (!db.articles) db.articles = [];
      db.articles.unshift({
        id: `clip-${Date.now()}`,
        title: generatedContent.headline,
        subtitle: `Highlight: ${playerName}`,
        content: generatedContent.caption,
        author: 'Presse-Toni',
        date: new Date().toISOString().split('T')[0],
        tags: ['VIDEO', 'HIGHLIGHT']
      });

      saveDb();
      res.json({ success: true, page: newPage });

    } catch (e) {
      console.error("Video processing failed", e);
      res.status(500).json({ error: "Processing failed" });
    }
  });

  // Save Tactical Analysis from VR
  app.post('/api/video/save-analysis', async (req, res) => {
    const { timestamp, drawing, analysis, type } = req.body;
    try {
      const newPage = {
        id: `tactical-${Date.now()}`,
        type: 'HIGHLIGHTS',
        data: {
          headline: "TACTICAL MASTERCLASS",
          caption: analysis,
          timestamp: new Date(timestamp).toLocaleString(),
          type: type,
          drawing: drawing,
          image_url: "https://picsum.photos/seed/tactics/800/600"
        }
      };

      if (!db.journalPages) db.journalPages = [];
      db.journalPages.push(newPage);

      if (!db.articles) db.articles = [];
      db.articles.unshift({
        id: `tactical-art-${Date.now()}`,
        title: "VR TACTICAL ANALYSIS",
        subtitle: "Live from the Command Center",
        content: analysis,
        author: 'Toni Analyst',
        date: new Date().toISOString().split('T')[0],
        tags: ['VR', 'TACTICS']
      });

      saveDb();
      res.json({ success: true, page: newPage });
    } catch (e) {
      console.error("Tactical analysis save failed", e);
      res.status(500).json({ error: "Save failed" });
    }
  });

  // Get Journal Pages
  app.get('/api/journal/pages', (req, res) => {
    if (!db.journalPages) {
      // Default pages if none exist
      db.journalPages = [
        { id: 'cover', type: 'COVER', data: { title: 'MATCHDAY READY', issue: 42 } },
        { id: 'interview-1', type: 'INTERVIEW', data: { topic: 'Upcoming Match Strategy', interviewee: 'The Coach', lines: [] } },
        { id: 'preview-1', type: 'PREVIEW', data: { teamName: 'FC Bayern Munich' } },
        { id: 'squad', type: 'SQUAD', data: {} }
      ];
    }
    res.json(db.journalPages);
  });

  // Update Journal Pages (Reorder/Edit)
  app.post('/api/journal/pages', (req, res) => {
    const { pages } = req.body;
    db.journalPages = pages;
    saveDb();
    res.json({ success: true });
  });

  // Get Player Highlights
  app.get('/api/players/:id/highlights', (req, res) => {
    const { id } = req.params;
    const highlights = db.playerHighlights?.[id] || [];
    res.json(highlights);
  });

  // Vite Middleware
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    app.use(express.static(path.join(__dirname, 'dist')));
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
