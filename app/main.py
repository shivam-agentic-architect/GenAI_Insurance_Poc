import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import logging
logging.basicConfig(filename='python_server.log', level=logging.INFO)
logging.info("🚀 Python server script starting...")

try:
    from fastapi import FastAPI, HTTPException
    from openai import OpenAI
    import os
    from dotenv import load_dotenv
    from rag import retrieve, initialize_rag
    logging.info("✅ Imports successful")
except Exception as e:
    logging.error(f"❌ Import failed: {e}")
    raise e

load_dotenv()

app = FastAPI()

# Initialize RAG on startup
@app.on_event("startup")
async def startup_event():
    print("🚀 Initializing RAG system...")
    success = initialize_rag()
    if success:
        print("✅ RAG system ready!")
    else:
        print("❌ RAG system failed to initialize. Check logs.")

@app.get("/")
def home():
    return {"status": "RAG System Running ✅"}

@app.get("/ask")
def ask(q: str):
    print(f"📥 Received request for /ask with query: {q}")
    if not q:
        raise HTTPException(status_code=400, detail="Missing query parameter 'q'")
        
    try:
        context = retrieve(q)
        
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise HTTPException(status_code=500, detail="OPENAI_API_KEY not configured on server.")
            
        client = OpenAI(api_key=api_key)
        
        prompt = f"""
You are an AI assistant.

Rules:
1. If the user greets (e.g., "hi", "hello", "hey"), respond with a polite greeting.
2. Answer ONLY using the provided context.
3. If the answer is not present in the context, respond exactly with:
   "Sorry, Information is not available."
4. Do not make up information.
5. Keep responses concise and professional.


        Context:
        {context}

        Question:
        {q}
        """

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}]
        )

        return {"response": response.choices[0].message.content}
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"❌ Error in ask endpoint:\n{error_details}")
        
        # If it's an OpenAI error, try to extract the message
        error_msg = str(e)
        status_code = 500
        
        if "AuthenticationError" in error_details or "401" in error_msg:
            status_code = 401
            error_msg = "Invalid OpenAI API Key. Please check your .env file."
        else:
            # Overwrite the detailed error message for 500 errors to prevent information leakage
            error_msg = "An internal server error occurred."
            
        raise HTTPException(status_code=status_code, detail=error_msg)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
