import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { aiRequestSchema, explainTextSchema, insertNoteSchema } from "@shared/schema";
import { z } from "zod";
import OpenAI from "openai";
import { GoogleGenAI } from "@google/genai";

export async function registerRoutes(app: Express): Promise<Server> {
  // Notes CRUD routes
  app.get("/api/notes", async (req, res) => {
    try {
      const notes = await storage.getNotes();
      res.json(notes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch notes" });
    }
  });

  app.get("/api/notes/:id", async (req, res) => {
    try {
      const note = await storage.getNote(req.params.id);
      if (!note) {
        return res.status(404).json({ message: "Note not found" });
      }
      res.json(note);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch note" });
    }
  });

  app.post("/api/notes", async (req, res) => {
    try {
      const noteData = insertNoteSchema.parse(req.body);
      const note = await storage.createNote(noteData);
      res.json(note);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid note data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create note" });
    }
  });

  app.put("/api/notes/:id", async (req, res) => {
    try {
      const noteData = insertNoteSchema.partial().parse(req.body);
      const note = await storage.updateNote(req.params.id, noteData);
      if (!note) {
        return res.status(404).json({ message: "Note not found" });
      }
      res.json(note);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid note data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update note" });
    }
  });

  app.delete("/api/notes/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteNote(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Note not found" });
      }
      res.json({ message: "Note deleted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete note" });
    }
  });

  // AI query route - multi-model support
  app.post("/api/ai/query", async (req, res) => {
    try {
      const { query, apiKeys } = aiRequestSchema.parse(req.body);
      const responses: any[] = [];

      // OpenAI GPT-5 - the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
      if (apiKeys.openai) {
        try {
          const openai = new OpenAI({ apiKey: apiKeys.openai });
          const response = await openai.chat.completions.create({
            model: "gpt-5",
            messages: [{ role: "user", content: query }],
          });
          responses.push({
            model: "OpenAI GPT-5",
            provider: "openai",
            content: response.choices[0].message.content,
            icon: "brain",
            color: "green"
          });
        } catch (error) {
          responses.push({
            model: "OpenAI GPT-5",
            provider: "openai",
            content: "Error: Failed to get response from OpenAI",
            icon: "brain",
            color: "green",
            error: true
          });
        }
      }

      // Google Gemini
      if (apiKeys.gemini) {
        try {
          const genAI = new GoogleGenAI({ apiKey: apiKeys.gemini });
          const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
          const result = await model.generateContent(query);
          const response = await result.response;
          responses.push({
            model: "Google Gemini",
            provider: "gemini",
            content: response.text(),
            icon: "gem",
            color: "blue"
          });
        } catch (error) {
          responses.push({
            model: "Google Gemini",
            provider: "gemini",
            content: "Error: Failed to get response from Gemini",
            icon: "gem",
            color: "blue",
            error: true
          });
        }
      }

      // Grok (xAI)
      if (apiKeys.grok) {
        try {
          const grok = new OpenAI({ 
            baseURL: "https://api.x.ai/v1", 
            apiKey: apiKeys.grok 
          });
          const response = await grok.chat.completions.create({
            model: "grok-2-1212",
            messages: [{ role: "user", content: query }],
          });
          responses.push({
            model: "Grok",
            provider: "grok",
            content: response.choices[0].message.content,
            icon: "bolt",
            color: "purple"
          });
        } catch (error) {
          responses.push({
            model: "Grok",
            provider: "grok",
            content: "Error: Failed to get response from Grok",
            icon: "bolt",
            color: "purple",
            error: true
          });
        }
      }

      // DeepSeek
      if (apiKeys.deepseek) {
        try {
          const deepseek = new OpenAI({ 
            baseURL: "https://api.deepseek.com/v1", 
            apiKey: apiKeys.deepseek 
          });
          const response = await deepseek.chat.completions.create({
            model: "deepseek-chat",
            messages: [{ role: "user", content: query }],
          });
          responses.push({
            model: "DeepSeek",
            provider: "deepseek",
            content: response.choices[0].message.content,
            icon: "water",
            color: "teal"
          });
        } catch (error) {
          responses.push({
            model: "DeepSeek",
            provider: "deepseek",
            content: "Error: Failed to get response from DeepSeek",
            icon: "water",
            color: "teal",
            error: true
          });
        }
      }

      if (responses.length === 0) {
        return res.status(400).json({ message: "No API keys provided" });
      }

      res.json({ responses });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to process AI query" });
    }
  });

  // Text explanation route
  app.post("/api/ai/explain", async (req, res) => {
    try {
      const { text, apiKeys } = explainTextSchema.parse(req.body);
      
      // Try OpenAI first, fallback to Gemini
      let explanation = "";
      
      if (apiKeys.openai) {
        try {
          const openai = new OpenAI({ apiKey: apiKeys.openai });
          const response = await openai.chat.completions.create({
            model: "gpt-5",
            messages: [
              {
                role: "system",
                content: "You are a helpful tutor. Explain the given text in a clear, educational way. Keep it concise but informative."
              },
              { role: "user", content: `Explain this text: "${text}"` }
            ],
          });
          explanation = response.choices[0].message.content || "";
        } catch (error) {
          // Continue to try other providers
        }
      }
      
      if (!explanation && apiKeys.gemini) {
        try {
          const genAI = new GoogleGenAI({ apiKey: apiKeys.gemini });
          const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
          const result = await model.generateContent(
            `Explain this text in a clear, educational way. Keep it concise but informative: "${text}"`
          );
          const response = await result.response;
          explanation = response.text();
        } catch (error) {
          // Continue to try other providers
        }
      }

      if (!explanation) {
        return res.status(400).json({ message: "No available AI service could process the explanation" });
      }

      res.json({ explanation });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to explain text" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
