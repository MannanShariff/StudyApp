# StudyApp - AI-Powered Study Platform

A comprehensive study application built with the MERN stack that helps students create, organize, and enhance their learning experience with AI assistance.

## Features

### ✅ Completed Features

- **📝 Notes Management**: Create, edit, save, and delete notes with a rich text editor
- **📄 PDF Upload & Processing**: Upload PDF files and automatically extract text into notes
- **🤖 Multi-AI Integration**: Query multiple AI models simultaneously (OpenAI GPT-5, Google Gemini, Grok, DeepSeek)
- **💡 AI Explanations**: Highlight any text in your notes to get instant AI explanations
- **📱 Responsive Design**: Clean, modern UI that works across devices
- **⚙️ API Key Management**: Secure session-based storage of API keys
- **📊 Export Functionality**: Download notes as formatted PDFs
- **🔄 Real-time Updates**: Automatic saving and synchronization

### 🎯 Key Capabilities

1. **API Settings Section**: Configure temporary API keys for OpenAI, Gemini, Grok, and DeepSeek
2. **Notes Editor**: 
   - Rich text formatting (bold, italic, underline)
   - Auto-save functionality
   - PDF export capabilities
   - Text highlighting for AI explanations
3. **AI Study Assistant**: 
   - Ask questions to multiple AI models
   - Compare responses from different providers
   - Copy AI responses directly to notes
4. **PDF Integration**: Upload PDFs and convert them to editable notes

## Technology Stack

### Frontend
- **React 18** with TypeScript
- **TailwindCSS** for styling
- **Radix UI** for components
- **React Query** for state management
- **Wouter** for routing

### Backend
- **Node.js** with Express
- **TypeScript** for type safety
- **Drizzle ORM** for database operations
- **Multer** for file uploads
- **pdf-parse** for PDF text extraction

### AI Integration
- OpenAI GPT-5
- Google Gemini
- Grok (xAI)
- DeepSeek

## Setup Instructions

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd CognitoStudy
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables (optional - API keys can be configured in the app):
```bash
cp .env.example .env
# Add your API keys to .env file
```

4. Run the development server:
```bash
npm run dev
```

5. Open http://localhost:5000 in your browser

### Build for Production

```bash
npm run build
```

## Deployment

### Vercel Deployment

The project is configured for easy deployment on Vercel:

1. Push your code to a Git repository
2. Connect your repository to Vercel
3. Vercel will automatically deploy using the included `vercel.json` configuration
4. Set environment variables in Vercel dashboard (optional)

### Environment Variables

The following environment variables can be set (all optional - can be configured in-app):

- `OPENAI_API_KEY` - OpenAI API key
- `GEMINI_API_KEY` - Google Gemini API key  
- `GROK_API_KEY` - Grok API key
- `DEEPSEEK_API_KEY` - DeepSeek API key

## Usage Guide

### Getting Started

1. **Configure API Keys**: Go to API Settings and enter your AI provider keys
2. **Create Notes**: Click "Create Note" in the Notes section
3. **Upload PDFs**: Use "Upload PDF" to extract text from documents
4. **Ask AI**: Use the AI Study section to query multiple models
5. **Get Explanations**: Highlight text in notes for instant AI explanations

### API Keys

- API keys are stored securely in session storage
- No permanent storage - keys are cleared when you close the browser
- Test connection feature to verify your keys work

### PDF Processing

- Supports standard PDF files up to 10MB
- Automatically extracts text and creates a new note
- Maintains original filename as note title

### AI Features

- **Multi-Model Queries**: Get responses from all configured AI models
- **Text Explanations**: Highlight any text for detailed explanations
- **Copy to Notes**: Easily transfer AI responses to your notes

## Project Structure

```
CognitoStudy/
├── client/              # React frontend
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── pages/       # Page components
│   │   ├── hooks/       # Custom React hooks
│   │   └── lib/         # Utilities and API client
├── server/              # Express backend
│   ├── routes.ts        # API route definitions
│   ├── storage.ts       # Data storage layer
│   └── index.ts         # Server entry point
├── shared/              # Shared types and schemas
├── api/                 # Vercel serverless functions
└── vercel.json          # Vercel deployment config
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues or questions:
1. Check the GitHub issues page
2. Create a new issue with detailed description
3. Include error logs and reproduction steps

---

Built with ❤️ using React, Express, and AI technologies.