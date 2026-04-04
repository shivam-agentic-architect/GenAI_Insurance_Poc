# GenAI Insurance Assistant - Python Implementation

This directory contains a complete Python/FastAPI implementation of the Insurance Assistant backend.

## Structure

- `main.py`: The FastAPI server containing the API endpoints and Gemini AI logic (including RAG and Function Calling).
- `requirements.txt`: Python dependencies.

## How to Run

### 1. Set up the Backend
1. Navigate to this directory: `cd python_implementation`
2. Create a virtual environment: `python -m venv venv`
3. Activate it:
   - Windows: `venv\Scripts\activate`
   - Mac/Linux: `source venv/bin/activate`
4. Install dependencies: `pip install -r requirements.txt`
5. Create a `.env` file and add your Gemini API Key:
   ```env
   GEMINI_API_KEY=your_api_key_here
   ```
6. Start the server: `python main.py`
   - The server will run on `http://localhost:8000`

### 2. Connect the Frontend
To use this Python backend with the existing React frontend:
1. In `src/App.tsx`, update any API calls (like `fetch('/api/insurance-data')`) to point to `http://localhost:8000/api/insurance-data`.
2. Similarly, update the chat logic to call your Python endpoint.

## Features Included
- **FastAPI Server**: High-performance Python web framework.
- **Gemini Integration**: Uses the `google-generativeai` SDK.
- **Function Calling**: Automatic tool use for querying the insurance database.
- **RAG**: Search logic for documents and FAQs.
- **Mock Data**: Pre-populated with banks, products, and policies.
- **Login Logic**: Secure login check for 'shivam'/'charan'.
