# GenAI Insurance Intelligence Assistant - POC

An AI-powered assistant for insurance companies to interact with fragmented data across multiple banking partners. Features advanced Gemini 3.1 models for high-performance reasoning and data synthesis.

Developed by Shivam Charan.

## Features

- **Conversational AI**: Interact with insurance data using natural language.
- **Dual Model Support**: Switch between Gemini and GPT (RAG) models.
- **Document Analysis**: Upload .txt and .pdf files to gain insights from policy documents.
- **Real-time Insights**: Get up-to-date information on bank partners and insurance products.

## Technology Stack

- **Frontend**: React 19, Tailwind CSS 4, Lucide React, Motion.
- **Backend**: Node.js, Express.
- **AI**: Google Gemini API, OpenAI (via proxy).

## Getting Started

### Prerequisites

- Node.js (v18+)
- API keys for Gemini and/or OpenAI.

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables in `.env`:
   ```env
   GEMINI_API_KEY=your_gemini_api_key
   OPENAI_API_KEY=your_openai_api_key
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

### Usage

1. Log in with the provided credentials.
2. Choose your preferred AI model.
3. Start chatting or upload documents for analysis.

---
*Note: This is a Proof of Concept (POC) and demo purpose only.*
