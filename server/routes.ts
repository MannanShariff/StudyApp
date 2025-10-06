import type { Express } from "express";
import { createServer, type Server } from "http";
import { createRequire } from "module";
import { storage } from "./storage";
import { aiRequestSchema, explainTextSchema, insertNoteSchema } from "@shared/schema";
import { z } from "zod";
import OpenAI from "openai";
import multer from "multer";
import jwt from "jsonwebtoken";
import { User } from "./models/User";

// Create require function for ES modules
const require = createRequire(import.meta.url);

export async function registerRoutes(app: Express): Promise<Server> {
  // Configure multer for PDF uploads (memory storage for serverless compatibility)
  const upload = multer({ 
    storage: multer.memoryStorage(),
    fileFilter: (req, file, cb) => {
      console.log('File upload attempt:', {
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size
      });
      
      // Accept various PDF MIME types
      const allowedMimeTypes = [
        'application/pdf',
        'application/x-pdf',
        'application/acrobat',
        'applications/vnd.pdf',
        'text/pdf',
        'text/x-pdf'
      ];
      
      const isValidPDF = allowedMimeTypes.includes(file.mimetype) || 
                        file.originalname.toLowerCase().endsWith('.pdf');
      
      if (isValidPDF) {
        cb(null, true);
      } else {
        cb(new Error(`Only PDF files are allowed. Received: ${file.mimetype} for file: ${file.originalname}`));
      }
    },
    limits: {
      fileSize: 25 * 1024 * 1024, // Increased to 25MB limit for larger PDFs
      files: 1 // Only allow one file at a time
    }
  });

  // PDF upload route
  app.post("/api/upload-pdf", upload.single('pdf'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No PDF file uploaded" });
      }

      console.log(`Processing PDF: ${req.file.originalname}, Size: ${req.file.size} bytes`);
      
      // Parse PDF and extract text
      let extractedText;
      let pdfInfo = {};
      
      try {
        const pdfParse = require('pdf-parse');
        const pdfData = await pdfParse(req.file.buffer, {
          // Options for better text extraction
          max: 0 // Extract all pages
        });
        
        extractedText = pdfData.text;
        pdfInfo = {
          pages: pdfData.numpages,
          info: pdfData.info,
          metadata: pdfData.metadata
        };
        
        console.log(`PDF parsed successfully: ${pdfData.numpages} pages, ${extractedText.length} characters`);
        
        // Clean up the extracted text
        extractedText = extractedText
          .replace(/\r\n/g, '\n')
          .replace(/\r/g, '\n')
          .replace(/\n{3,}/g, '\n\n')
          .trim();
        
        if (!extractedText || extractedText.length === 0) {
          throw new Error('No text content found in PDF');
        }
        
        if (extractedText.length < 10) {
          console.warn('Very short text extracted:', extractedText);
        }
        
      } catch (pdfError) {
        console.error('PDF parsing failed:', pdfError);
        
        // Try to provide more specific error messages
        let errorMessage = 'Failed to extract text from PDF';
        if (pdfError.message.includes('Invalid PDF')) {
          errorMessage = 'The uploaded file appears to be corrupted or not a valid PDF';
        } else if (pdfError.message.includes('password')) {
          errorMessage = 'This PDF is password protected and cannot be processed';
        } else if (pdfError.message.includes('No text')) {
          errorMessage = 'This PDF contains no extractable text (it may be image-based)';
        }
        
        return res.status(400).json({ 
          message: errorMessage,
          details: pdfError.message,
          suggestion: 'Try uploading a different PDF file or convert image-based PDFs to text-searchable format'
        });
      }

      // Create a new note with the extracted text
      const noteData = {
        title: req.file.originalname.replace(/\.pdf$/i, '') || 'PDF Document',
        content: extractedText
      };
      
      const note = await storage.createNote(noteData);
      
      // Return success response with note and preview
      res.json({ 
        note,
        extractedText: extractedText.length > 500 ? extractedText.substring(0, 500) + '...' : extractedText,
        pdfInfo: {
          pages: pdfInfo.pages || 'Unknown',
          size: req.file.size,
          textLength: extractedText.length
        },
        message: `Successfully extracted ${extractedText.length} characters from ${pdfInfo.pages || '?'} page(s)`
      });
      
    } catch (error) {
      console.error('PDF upload error:', error);
      
      if (error instanceof Error && error.message === 'Only PDF files are allowed') {
        return res.status(400).json({ message: error.message });
      }
      
      res.status(500).json({ 
        message: "Failed to process PDF upload",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

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
      
      // Merge provided API keys with user's stored keys if authenticated
      let finalApiKeys = { ...apiKeys };
      
      // Check if user is authenticated and get their stored API keys
      const token = req.header('Authorization')?.replace('Bearer ', '') || req.cookies?.token;
      if (token) {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
          const user = await User.findById(decoded.userId);
          if (user && user.apiKeys) {
            // Use stored keys if not provided in request (and stored key is not empty)
            if (!finalApiKeys.openai && user.apiKeys.openai && user.apiKeys.openai.trim()) finalApiKeys.openai = user.apiKeys.openai;
            if (!finalApiKeys.gemini && user.apiKeys.gemini && user.apiKeys.gemini.trim()) finalApiKeys.gemini = user.apiKeys.gemini;
            if (!finalApiKeys.grok && user.apiKeys.grok && user.apiKeys.grok.trim()) finalApiKeys.grok = user.apiKeys.grok;
            if (!finalApiKeys.deepseek && user.apiKeys.deepseek && user.apiKeys.deepseek.trim()) finalApiKeys.deepseek = user.apiKeys.deepseek;
          }
        } catch (authError) {
          // If authentication fails, continue with provided keys
          console.log('Authentication check failed, using provided keys only');
        }
      }
      // Create promises for parallel execution
      const apiPromises: Promise<any>[] = [];

      // OpenAI via OpenRouter
      if (finalApiKeys.openai && finalApiKeys.openai.trim()) {
        apiPromises.push(
          (async () => {
            try {
              const openai = new OpenAI({ 
                baseURL: "https://openrouter.ai/api/v1",
                apiKey: finalApiKeys.openai,
                defaultHeaders: {
                  "HTTP-Referer": "https://studyapp.vercel.app",
                  "X-Title": "StudyApp"
                }
              });
              const response = await Promise.race([
                openai.chat.completions.create({
                  model: "openai/gpt-oss-20b:free",
                  messages: [{ role: "user", content: `Answer briefly in 2-3 sentences: ${query}` }],
                }),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 15000))
              ]);
              return {
                model: "OpenAI GPT-OSS-20B",
                provider: "openai",
                content: (response as any).choices[0].message.content,
                icon: "brain",
                color: "green"
              };
            } catch (error) {
              return {
                model: "OpenAI GPT-OSS-20B",
                provider: "openai",
                content: `Error: ${error instanceof Error ? error.message : 'Failed to get response from OpenAI'}`,
                icon: "brain",
                color: "green",
                error: true
              };
            }
          })()
        );
      }

      // Google Gemini
      if (finalApiKeys.gemini && finalApiKeys.gemini.trim()) {
        console.log('Attempting Gemini API call with key:', finalApiKeys.gemini ? finalApiKeys.gemini.substring(0, 15) + '...' : 'NO KEY');
        
        // Validate Gemini API key format
        if (!finalApiKeys.gemini.startsWith('AIzaSy')) {
          console.warn('Gemini API key does not start with AIzaSy, this might be invalid');
        }
        
        apiPromises.push(
          (async () => {
            try {
              console.log('Starting Gemini API call with direct fetch...');
              const MODEL = "gemini-2.0-flash";
              const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${finalApiKeys.gemini}`;
              
              const response = await Promise.race([
                fetch(apiUrl, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    contents: [{ 
                      parts: [{ 
                        text: `Answer concisely in 2-3 sentences: ${query}` 
                      }] 
                    }]
                  })
                }),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 15000))
              ]);
              
              if (!response.ok) {
                const errorText = await response.text();
                console.error('Gemini API error response:', errorText);
                
                // Check if it's a quota error
                if (errorText.includes('quota') || errorText.includes('exceeded')) {
                  console.log('Gemini quota exceeded, trying alternative model...');
                  // Try with a different model that might have quota available
                  const fallbackModels = ['gemini-flash-latest', 'gemini-2.0-flash-001', 'gemma-3-1b-it'];
                  
                  for (const fallbackModel of fallbackModels) {
                    try {
                      console.log(`Trying Gemini fallback model: ${fallbackModel}`);
                      const fallbackUrl = `https://generativelanguage.googleapis.com/v1beta/models/${fallbackModel}:generateContent?key=${finalApiKeys.gemini}`;
                      const fallbackResponse = await fetch(fallbackUrl, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          contents: [{ 
                            parts: [{ 
                              text: `Answer concisely in 2-3 sentences: ${query}` 
                            }] 
                          }]
                        })
                      });
                      
                      if (fallbackResponse.ok) {
                        const fallbackData = await fallbackResponse.json();
                        const fallbackContent = fallbackData.candidates?.[0]?.content?.parts?.[0]?.text;
                        if (fallbackContent) {
                          console.log(`Fallback model ${fallbackModel} succeeded`);
                          return {
                            model: `Google Gemini (${fallbackModel})`,
                            provider: "gemini",
                            content: fallbackContent,
                            icon: "gem",
                            color: "blue"
                          };
                        }
                      }
                    } catch (fallbackError) {
                      console.log(`Fallback model ${fallbackModel} also failed:`, fallbackError.message);
                    }
                  }
                }
                
                throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
              }
              
              const data = await response.json();
              console.log('Gemini API success:', data);
              
              const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
              
              if (!content) {
                throw new Error('No content in Gemini response');
              }
              
              return {
                model: "Google Gemini",
                provider: "gemini",
                content: content,
                icon: "gem",
                color: "blue"
              };
            } catch (error) {
              console.error('Gemini API error:', error);
              console.error('Gemini API key provided:', finalApiKeys.gemini ? 'YES' : 'NO');
              console.error('Gemini API key starts with:', finalApiKeys.gemini ? finalApiKeys.gemini.substring(0, 10) + '...' : 'N/A');
              return {
                model: "Google Gemini",
                provider: "gemini",
                content: `Error: ${error instanceof Error ? error.message : 'Failed to get response from Gemini'}`,
                icon: "gem",
                color: "blue",
                error: true
              };
            }
          })()
        );
      }

      // Grok via OpenRouter
      if (finalApiKeys.grok && finalApiKeys.grok.trim()) {
        apiPromises.push(
          (async () => {
            try {
              const grok = new OpenAI({ 
                baseURL: "https://openrouter.ai/api/v1", 
                apiKey: finalApiKeys.grok,
                defaultHeaders: {
                  "HTTP-Referer": "https://studyapp.vercel.app",
                  "X-Title": "StudyApp"
                }
              });
              const response = await Promise.race([
                grok.chat.completions.create({
                  model: "x-ai/grok-4-fast:free",
                  messages: [{ role: "user", content: `Answer briefly in 2-3 sentences: ${query}` }],
                }),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 15000))
              ]);
              return {
                model: "Grok 4 Fast",
                provider: "grok",
                content: (response as any).choices[0].message.content,
                icon: "bolt",
                color: "purple"
              };
            } catch (error) {
              return {
                model: "Grok 4 Fast",
                provider: "grok",
                content: `Error: ${error instanceof Error ? error.message : 'Failed to get response from Grok'}`,
                icon: "bolt",
                color: "purple",
                error: true
              };
            }
          })()
        );
      }

      // DeepSeek via OpenRouter
      if (finalApiKeys.deepseek && finalApiKeys.deepseek.trim()) {
        apiPromises.push(
          (async () => {
            try {
              const deepseek = new OpenAI({ 
                baseURL: "https://openrouter.ai/api/v1", 
                apiKey: finalApiKeys.deepseek,
                defaultHeaders: {
                  "HTTP-Referer": "https://studyapp.vercel.app",
                  "X-Title": "StudyApp"
                }
              });
              const response = await Promise.race([
                deepseek.chat.completions.create({
                  model: "deepseek/deepseek-chat-v3.1:free",
                  messages: [{ role: "user", content: `Answer briefly in 2-3 sentences: ${query}` }],
                }),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 15000))
              ]);
              return {
                model: "DeepSeek V3.1",
                provider: "deepseek",
                content: (response as any).choices[0].message.content,
                icon: "water",
                color: "teal"
              };
            } catch (error) {
              return {
                model: "DeepSeek V3.1",
                provider: "deepseek",
                content: `Error: ${error instanceof Error ? error.message : 'Failed to get response from DeepSeek'}`,
                icon: "water",
                color: "teal",
                error: true
              };
            }
          })()
        );
      }

      // Execute all API calls in parallel with timeout
      if (apiPromises.length === 0) {
        return res.status(400).json({ message: "No API keys provided" });
      }

      console.log(`Starting ${apiPromises.length} API calls in parallel...`);
      const responses = await Promise.all(apiPromises);
      console.log(`Completed all API calls, got ${responses.length} responses`);

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
      console.log('Explanation request received:', {
        textLength: req.body.text?.length || 0,
        hasApiKeys: !!req.body.apiKeys,
        apiKeyTypes: req.body.apiKeys ? Object.keys(req.body.apiKeys).filter(key => req.body.apiKeys[key]) : []
      });
      
      const { text, apiKeys } = explainTextSchema.parse(req.body);
      
      // Merge provided API keys with user's stored keys if authenticated
      let finalApiKeys = { ...apiKeys };
      
      // Check if user is authenticated and get their stored API keys
      const token = req.header('Authorization')?.replace('Bearer ', '') || req.cookies?.token;
      if (token) {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
          const user = await User.findById(decoded.userId);
          if (user && user.apiKeys) {
            // Use stored keys if not provided in request (and stored key is not empty)
            if (!finalApiKeys.openai && user.apiKeys.openai && user.apiKeys.openai.trim()) finalApiKeys.openai = user.apiKeys.openai;
            if (!finalApiKeys.gemini && user.apiKeys.gemini && user.apiKeys.gemini.trim()) finalApiKeys.gemini = user.apiKeys.gemini;
            if (!finalApiKeys.grok && user.apiKeys.grok && user.apiKeys.grok.trim()) finalApiKeys.grok = user.apiKeys.grok;
            if (!finalApiKeys.deepseek && user.apiKeys.deepseek && user.apiKeys.deepseek.trim()) finalApiKeys.deepseek = user.apiKeys.deepseek;
          }
        } catch (authError) {
          console.log('Authentication check failed, using provided keys only');
        }
      }
      
      // Try providers with priority order (fastest first)
      const explanationPromises: Promise<string>[] = [];
      
      // Priority order: OpenAI, DeepSeek, Grok, Gemini (based on typical response speed)
      const apiPriority = [
        { key: 'openai', provider: finalApiKeys.openai },
        { key: 'deepseek', provider: finalApiKeys.deepseek },
        { key: 'grok', provider: finalApiKeys.grok },
        { key: 'gemini', provider: finalApiKeys.gemini }
      ];
      
      if (finalApiKeys.openai && finalApiKeys.openai.trim()) {
        console.log('Adding OpenAI explanation provider');
        explanationPromises.push(
          (async () => {
            try {
              console.log('Starting OpenAI explanation request...');
              const openai = new OpenAI({ 
                baseURL: "https://openrouter.ai/api/v1",
                apiKey: finalApiKeys.openai,
                defaultHeaders: {
                  "HTTP-Referer": "https://studyapp.vercel.app",
                  "X-Title": "StudyApp"
                }
              });
              const response = await Promise.race([
                openai.chat.completions.create({
                  model: "openai/gpt-oss-20b:free",
                  messages: [
                    {
                      role: "system",
                      content: "You are a helpful tutor. Explain briefly in 1-2 sentences."
                    },
                    { role: "user", content: `Explain briefly: "${text}"` }
                  ],
                }),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 10000))
              ]);
              const content = (response as any).choices[0].message.content || "";
              console.log('OpenAI explanation successful:', content.substring(0, 100) + '...');
              return content;
            } catch (error) {
              console.error('OpenAI explanation error:', error);
              throw error;
            }
          })()
        );
      }
      
      if (finalApiKeys.gemini && finalApiKeys.gemini.trim()) {
        console.log('Adding Gemini explanation provider');
        explanationPromises.push(
          (async () => {
            try {
              console.log('Starting Gemini explanation request with direct fetch...');
              const MODEL = "gemini-2.0-flash";
              const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${finalApiKeys.gemini}`;
              
              const response = await Promise.race([
                fetch(apiUrl, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    contents: [{ 
                      parts: [{ 
                        text: `Explain this text briefly in 1-2 sentences: "${text}"` 
                      }] 
                    }]
                  })
                }),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 8000))
              ]);
              
              if (!response.ok) {
                const errorText = await response.text();
                console.error('Gemini explanation API error:', errorText);
                
                // Check if it's a quota error and try fallback models
                if (errorText.includes('quota') || errorText.includes('exceeded')) {
                  console.log('Gemini explanation quota exceeded, trying alternative model...');
                  const fallbackModels = ['gemini-flash-latest', 'gemini-2.0-flash-001', 'gemma-3-1b-it'];
                  
                  for (const fallbackModel of fallbackModels) {
                    try {
                      console.log(`Trying Gemini explanation fallback model: ${fallbackModel}`);
                      const fallbackUrl = `https://generativelanguage.googleapis.com/v1beta/models/${fallbackModel}:generateContent?key=${finalApiKeys.gemini}`;
                      const fallbackResponse = await fetch(fallbackUrl, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          contents: [{ 
                            parts: [{ 
                              text: `Explain this text briefly in 1-2 sentences: "${text}"` 
                            }] 
                          }]
                        })
                      });
                      
                      if (fallbackResponse.ok) {
                        const fallbackData = await fallbackResponse.json();
                        const fallbackContent = fallbackData.candidates?.[0]?.content?.parts?.[0]?.text;
                        if (fallbackContent) {
                          console.log(`Explanation fallback model ${fallbackModel} succeeded`);
                          return fallbackContent;
                        }
                      }
                    } catch (fallbackError) {
                      console.log(`Explanation fallback model ${fallbackModel} also failed:`, fallbackError.message);
                    }
                  }
                }
                
                throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
              }
              
              const data = await response.json();
              console.log('Gemini explanation API success:', data);
              
              const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
              
              if (!content) {
                throw new Error('No content in Gemini explanation response');
              }
              
              console.log('Gemini explanation successful:', content.substring(0, 100) + '...');
              return content;
            } catch (error) {
              console.error('Gemini explanation error:', error);
              throw error;
            }
          })()
        );
      }
      
      // Add Grok explanation provider
      if (finalApiKeys.grok && finalApiKeys.grok.trim()) {
        console.log('Adding Grok explanation provider');
        explanationPromises.push(
          (async () => {
            try {
              console.log('Starting Grok explanation request...');
              const grok = new OpenAI({ 
                baseURL: "https://openrouter.ai/api/v1",
                apiKey: finalApiKeys.grok,
                defaultHeaders: {
                  "HTTP-Referer": "https://studyapp.vercel.app",
                  "X-Title": "StudyApp"
                }
              });
              const response = await Promise.race([
                grok.chat.completions.create({
                  model: "x-ai/grok-4-fast:free",
                  messages: [
                    {
                      role: "system",
                      content: "You are a helpful tutor. Explain briefly in 1-2 sentences."
                    },
                    { role: "user", content: `Explain briefly: "${text}"` }
                  ],
                }),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 10000))
              ]);
              const content = (response as any).choices[0].message.content || "";
              console.log('Grok explanation successful:', content.substring(0, 100) + '...');
              return content;
            } catch (error) {
              console.error('Grok explanation error:', error);
              throw error;
            }
          })()
        );
      }
      
      // Add DeepSeek explanation provider
      if (finalApiKeys.deepseek && finalApiKeys.deepseek.trim()) {
        console.log('Adding DeepSeek explanation provider');
        explanationPromises.push(
          (async () => {
            try {
              console.log('Starting DeepSeek explanation request...');
              const deepseek = new OpenAI({ 
                baseURL: "https://openrouter.ai/api/v1",
                apiKey: finalApiKeys.deepseek,
                defaultHeaders: {
                  "HTTP-Referer": "https://studyapp.vercel.app",
                  "X-Title": "StudyApp"
                }
              });
              const response = await Promise.race([
                deepseek.chat.completions.create({
                  model: "deepseek/deepseek-chat-v3.1:free",
                  messages: [
                    {
                      role: "system",
                      content: "You are a helpful tutor. Explain briefly in 1-2 sentences."
                    },
                    { role: "user", content: `Explain briefly: "${text}"` }
                  ],
                }),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 10000))
              ]);
              const content = (response as any).choices[0].message.content || "";
              console.log('DeepSeek explanation successful:', content.substring(0, 100) + '...');
              return content;
            } catch (error) {
              console.error('DeepSeek explanation error:', error);
              throw error;
            }
          })()
        );
      }
      
      // Use the fastest successful response
      let explanation = "";
      console.log(`Starting explanation with ${explanationPromises.length} providers...`);
      
      if (explanationPromises.length > 0) {
        try {
          explanation = await Promise.any(explanationPromises);
          console.log('Explanation received successfully:', explanation?.substring(0, 100) + '...');
        } catch (error) {
          console.error('All explanation providers failed:', error);
          // Try to get more detailed error information
          if (error instanceof AggregateError) {
            console.error('Individual errors:', error.errors);
          }
        }
      } else {
        console.log('No explanation providers available - no API keys provided');
      }

      if (!explanation) {
        const message = explanationPromises.length === 0 
          ? "No API keys provided for explanation" 
          : "No available AI service could process the explanation";
        console.log('Returning error:', message);
        return res.status(400).json({ message });
      }

      console.log('Sending explanation response');
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
