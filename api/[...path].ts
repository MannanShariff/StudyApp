import type { VercelRequest, VercelResponse } from '@vercel/node';
import express from 'express';
import { registerRoutes } from '../server/routes';

let app: express.Application | null = null;

async function getApp() {
  if (!app) {
    app = express();
    
    // Parse JSON bodies
    app.use(express.json({ limit: '10mb' }));
    
    // Parse URL-encoded bodies
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    
    // Register routes
    await registerRoutes(app);
  }
  
  return app;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const app = await getApp();
    
    // Convert Vercel request/response to Express format
    const expressReq = req as any;
    const expressRes = res as any;
    
    // Set the URL path to match the API route
    const pathArray = req.query.path as string[];
    expressReq.url = `/api/${pathArray ? pathArray.join('/') : ''}`;
    expressReq.method = req.method;
    
    // Handle the request
    app(expressReq, expressRes);
  } catch (error) {
    console.error('Handler error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
