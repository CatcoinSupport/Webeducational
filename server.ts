import express from "express";
import path from "path";
import fs from "fs/promises";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Path to data files
const DB_PATH = path.join(process.cwd(), "data", "db.json");
const DEFAULT_DB_PATH = path.join(process.cwd(), "data", "defaultDb.json");

// Ensure db.json exists, copy from defaultDb.json if necessary
async function initDatabase() {
  try {
    await fs.mkdir(path.join(process.cwd(), "data"), { recursive: true });
    try {
      await fs.access(DB_PATH);
    } catch {
      // db.json doesn't exist, read custom default and write to db.json
      const defaultContent = await fs.readFile(DEFAULT_DB_PATH, "utf-8");
      await fs.writeFile(DB_PATH, defaultContent, "utf-8");
      console.log("Initialized db.json with default syllabus values.");
    }
  } catch (err) {
    console.error("Database initialization failed:", err);
  }
}

// Helper to read database
async function readDb() {
  try {
    const data = await fs.readFile(DB_PATH, "utf-8");
    const parsed = JSON.parse(data);
    if (!parsed.users) {
      parsed.users = [];
    }
    return parsed;
  } catch (err) {
    console.error("Failed to read database, falling back to default.", err);
    const fallback = await fs.readFile(DEFAULT_DB_PATH, "utf-8");
    const parsed = JSON.parse(fallback);
    if (!parsed.users) {
      parsed.users = [];
    }
    return parsed;
  }
}

// Helper to write database
async function writeDb(data: any) {
  await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2), "utf-8");
}

let aiClient: GoogleGenAI | null = null;
function getAiClient() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY is not set. Moul L'Bac AI Tutor will operate in mock mode.");
      return null;
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// API Routes
// 0. User Administration & Authentication
app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password, academicLevelId, streamId } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: "Veuillez remplir tous les champs obligatoires (nom, email, mot de passe)." });
    }

    const db = await readDb();
    if (!db.users) db.users = [];
    const emailLower = email.trim().toLowerCase();
    
    // Check if user already exists
    if (db.users.some((u: any) => u.email.toLowerCase() === emailLower)) {
      return res.status(400).json({ error: "Cette adresse email est déjà enregistrée." });
    }

    // First user registering becomes admin
    const isFirstUser = db.users.length === 0;
    const newUser = {
      name: name.trim(),
      email: emailLower,
      password: password.trim(),
      academicLevelId: academicLevelId || "",
      streamId: streamId || "",
      isAdmin: isFirstUser,
      totalXP: 50,
      dailyStreak: 1,
      isPremium: false,
      joinedAt: new Date().toISOString()
    };

    db.users.push(newUser);
    await writeDb(db);

    const { password: _, ...userWithoutPassword } = newUser;
    res.json({ message: "Utilisateur créé avec succès", user: userWithoutPassword });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "L'email et le mot de passe sont requis." });
    }

    const db = await readDb();
    if (!db.users) db.users = [];
    const emailLower = email.trim().toLowerCase();
    const user = db.users.find((u: any) => u.email.toLowerCase() === emailLower);

    if (!user || user.password !== password.trim()) {
      return res.status(400).json({ error: "Email ou mot de passe incorrect." });
    }

    // Check if they need profile config (academicLevelId or streamId is missing)
    const requiresConfig = !user.isAdmin && (!user.academicLevelId || !user.streamId);

    const { password: _, ...userWithoutPassword } = user;
    res.json({
      message: "Connexion réussie",
      user: userWithoutPassword,
      requiresConfig
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/auth/update-profile", async (req, res) => {
  try {
    const { email, academicLevelId, streamId, totalXP, dailyStreak, isPremium, name } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email est requis pour la mise à jour." });
    }

    const db = await readDb();
    if (!db.users) db.users = [];
    const emailLower = email.trim().toLowerCase();
    const userIndex = db.users.findIndex((u: any) => u.email.toLowerCase() === emailLower);

    if (userIndex === -1) {
      return res.status(404).json({ error: "Utilisateur non trouvé." });
    }

    db.users[userIndex] = {
      ...db.users[userIndex],
      ...(academicLevelId !== undefined && { academicLevelId }),
      ...(streamId !== undefined && { streamId }),
      ...(totalXP !== undefined && { totalXP: Number(totalXP) }),
      ...(dailyStreak !== undefined && { dailyStreak: Number(dailyStreak) }),
      ...(isPremium !== undefined && { isPremium: Boolean(isPremium) }),
      ...(name !== undefined && { name: name.trim() })
    };

    await writeDb(db);

    const { password: _, ...userWithoutPassword } = db.users[userIndex];
    res.json({ message: "Profil mis à jour", user: userWithoutPassword });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 1. Get entire syllabus and reviews
app.get("/api/syllabus", async (req, res) => {
  try {
    const db = await readDb();
    res.json(db);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Save entire syllabus (Admin panel writes replacement)
app.post("/api/syllabus/save", async (req, res) => {
  try {
    const updatedSyllabus = req.body;
    if (!updatedSyllabus || !updatedSyllabus.academicLevels) {
      return res.status(400).json({ error: "Invalid syllabus format." });
    }
    const db = await readDb();
    db.academicLevels = updatedSyllabus.academicLevels;
    await writeDb(db);
    res.json({ message: "Syllabus saved successfully", academicLevels: db.academicLevels });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Post a comment inside a lesson's study forum
app.post("/api/forum/comment", async (req, res) => {
  try {
    const { lessonId, sectionId, userName, userEmail, content } = req.body;
    if (!lessonId || !userName || !content) {
      return res.status(400).json({ error: "Missing required comment fields." });
    }

    const db = await readDb();
    const newComment = {
      id: `c_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      lessonId,
      sectionId: sectionId || undefined,
      userName,
      userEmail: userEmail || "anonymous@bac.ma",
      content,
      createdAt: new Date().toISOString()
    };

    if (!db.forumComments) {
      db.forumComments = [];
    }
    db.forumComments.push(newComment);
    await writeDb(db);
    res.json(newComment);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Delete a comment (moderation/admin feature)
app.delete("/api/forum/comment/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const db = await readDb();
    if (db.forumComments) {
      db.forumComments = db.forumComments.filter((c: any) => c.id !== id);
      await writeDb(db);
    }
    res.json({ message: "Comment deleted successfully" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Moul L'Bac AI Baccalaureate Tutor Chat proxy endpoint
app.post("/api/gemini/tutor", async (req, res) => {
  try {
    const { query, history, currentLessonTitle, currentSubjectName, levelName, streamName } = req.body;
    if (!query) {
      return res.status(400).json({ error: "Missing query parameter." });
    }

    const ai = getAiClient();
    
    // Custom context instructions
    const contextPrompt = `
You are "Moul L'Bac AI", an expert, empathetic, highly motivating, and brilliant Moroccan Baccalaureate AI tutor.
Your mission is to help the student with their study tasks, exercises, formulations, explanations, and advice.
Current Student Academic Context:
- Level: ${levelName || "Not selected yet"}
- Stream/Filière: ${streamName || "Not selected yet"}
- Subject: ${currentSubjectName || "General guidance"}
- Current Lesson: ${currentLessonTitle || "None/Dashboard overview"}

Behavioral Rules:
1. Speak in a friendly, encouraging, and witty mix of French and Darija (Arabic Moroccan slang) or Standard Arabic, depending on the student's prompts. Always keep a genuine Moroccan educational flair (encouraging expressions like "L'Bac b idni lah sahl", "Bon courage", "Tabarak Allah").
2. Answer step-by-step with maximum clarity. For Math and Physics equations, use clear layouts or standard markdown ($x^2$ or equations) nicely spaced.
3. Keep answers educational and pedagogical. NEVER just give the flat final answer directly if they ask you to solve a problem—instead, provide the key formula/hints, solve an intermediate step, and ask them to complete the rest to earn their Bac, then give the check.
4. Keep the output neat and concise. Suggest exam strategies (national examination tricks) relevant to Morocco's grading system.
`;

    if (!ai) {
      // Mock mode fallback response
      const mockAnswers = [
        `Marhaban bik! Moul L'Bac is running in offline demo mode. Pour vous guider sur "${currentLessonTitle || 'vos études'}", assurez-vous d'avoir configuré le secret GEMINI_API_KEY. Mais voici un conseil : révisez toujours vos examens nationaux marocains et rappelez-vous que $f(x) = x^3 + 2x - 1$ est strictement croissante ! Des questions ?`,
        `Ahla wa sahla ! Moul L'Bac à votre service. En mode d'évaluation, je vous rappelle l'importance de bien formuler le Théorème des Valeurs Intermédiaires (TVI). Établissez toujours la continuité et la stricte monotonie. Allah y wafaq !`
      ];
      const randomMockResponse = mockAnswers[Math.floor(Math.random() * mockAnswers.length)];
      return res.json({ text: randomMockResponse });
    }

    // Format chat history for Gemini API generated output
    // The history parameter comes as an array of: { role: 'user' | 'model', parts: [{ text: string }] }
    const formattedContents = [];
    if (history && Array.isArray(history)) {
      for (const msg of history) {
        formattedContents.push({
          role: msg.role === "assistant" ? "model" : msg.role,
          parts: [{ text: msg.content }]
        });
      }
    }
    // Append the current student query
    formattedContents.push({
      role: "user",
      parts: [{ text: query }]
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: formattedContents,
      config: {
        systemInstruction: contextPrompt,
        temperature: 0.7,
      }
    });

    const replyText = response.text || "Désolé, je n'ai pas pu générer de réponse. Réessayez s'il vous plaît !";
    res.json({ text: replyText });

  } catch (err: any) {
    console.error("Gemini API Error:", err);
    res.status(500).json({ error: "Gemini AI is sleeping or currently unavailable. Try again in a minute." });
  }
});

// Boot server logic with Vite setup
async function startServer() {
  await initDatabase();

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`BacPrep Maroc server running on http://localhost:${PORT}`);
  });
}

startServer();
