import os
import json
from typing import List, Optional, Any
from fastapi import FastAPI, HTTPException, Depends, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import google.generativeai as genai
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = FastAPI(title="GenAI Insurance Assistant API")

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, replace with specific origins
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Mock Database ---
# This matches the data structure in the TypeScript server.ts
INSURANCE_DATA = {
    "banks": [
        {"id": "b1", "name": "Global Secure Bank", "regions": ["North", "West", "South"]},
        {"id": "b2", "name": "Unity Trust Insurance", "regions": ["All India"]},
        {"id": "b3", "name": "Apex Finance Corp", "regions": ["East", "South"]},
    ],
    "products": [
        {"id": "p1", "bankId": "b1", "category": "Health", "name": "SecureHealth Pro", "coverage": "Comprehensive health coverage up to 10L with maternity benefits."},
        {"id": "p2", "bankId": "b1", "category": "Motor", "name": "SecureDrive Plus", "coverage": "Zero-depreciation car insurance with roadside assistance."},
        {"id": "p3", "bankId": "b2", "category": "Health", "name": "Unity Care Max", "coverage": "Family floater plan covering up to 6 members."},
        {"id": "p4", "bankId": "b2", "category": "Life", "name": "Unity Term Shield", "coverage": "Pure term life insurance with critical illness rider."},
        {"id": "p5", "bankId": "b3", "category": "Motor", "name": "Apex Auto Guard", "coverage": "Third-party and comprehensive motor insurance."},
    ],
    "policies": [
        {"id": "pol1", "category": "Health", "title": "Individual Health Policy", "details": "Covers hospitalization, pre/post care, and day-care procedures."},
        {"id": "pol2", "category": "Motor", "title": "Comprehensive Motor Policy", "details": "Covers damages to own vehicle and third-party liabilities."},
        {"id": "pol3", "category": "Life", "title": "Term Life Policy", "details": "Provides financial security to nominees in case of policyholder's demise."},
    ],
    "documents": [
        {"id": "d1", "title": "Claim Process Guide", "content": "To file a claim, submit your hospital bills within 30 days of discharge. Use the mobile app for faster processing."},
        {"id": "d2", "title": "Policy Renewal Terms", "content": "Policies must be renewed before the expiry date to avoid a break in coverage and loss of NCB."},
        {"id": "d3", "title": "Exclusions List", "content": "Standard exclusions include self-inflicted injuries, cosmetic surgery, and pre-existing diseases for the first 2 years."},
    ],
    "faqs": [
        {"id": "f1", "question": "What is NCB?", "answer": "No Claim Bonus is a discount on the premium given for every claim-free year."},
        {"id": "f2", "question": "Can I change my nominee?", "answer": "Yes, you can update your nominee details at any time through the customer portal."},
        {"id": "f3", "question": "Is cashless facility available?", "answer": "Yes, we have a network of 5000+ hospitals where cashless treatment is available."},
    ]
}

# --- Gemini Configuration ---
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    print("Warning: GEMINI_API_KEY not found in environment variables.")
else:
    genai.configure(api_key=GEMINI_API_KEY)

# Tool definition for Gemini
def query_insurance_database(query_type: str, category: Optional[str] = None, region: Optional[str] = None, search_term: Optional[str] = None, product_ids: Optional[List[str]] = None) -> Any:
    """
    Queries the insurance database for banks, products, policies, documents, or FAQs.
    
    Args:
        query_type: One of 'banks', 'products', 'policies', 'documents', 'faqs', or 'compare'.
        category: Filter by category (Health, Motor, Life).
        region: Filter banks by region.
        search_term: Search term for documents or FAQs.
        product_ids: List of specific product IDs for comparison.
    """
    if query_type == "banks":
        data = INSURANCE_DATA["banks"]
        if region:
            data = [b for b in data if region in b['regions'] or "All India" in b['regions']]
        if category:
            # Filter banks that have products in this category
            bank_ids = {p['bankId'] for p in INSURANCE_DATA['products'] if p['category'].lower() == category.lower()}
            data = [b for b in data if b['id'] in bank_ids]
        return data
        
    elif query_type == "products":
        data = INSURANCE_DATA["products"]
        if category:
            data = [p for p in data if p['category'].lower() == category.lower()]
        return data
        
    elif query_type == "compare":
        data = INSURANCE_DATA["products"]
        if product_ids:
            data = [p for p in data if p['id'] in product_ids]
        # Enrich with bank names
        for p in data:
            bank = next((b for b in INSURANCE_DATA['banks'] if b['id'] == p['bankId']), None)
            p['bankName'] = bank['name'] if bank else "Unknown Bank"
        return data
        
    elif query_type == "policies":
        data = INSURANCE_DATA["policies"]
        if category:
            data = [p for p in data if p['category'].lower() == category.lower()]
        return data
        
    elif query_type == "documents":
        data = INSURANCE_DATA["documents"]
        if search_term:
            term = search_term.lower()
            data = [d for d in data if term in d['title'].lower() or term in d['content'].lower()]
        return data
        
    elif query_type == "faqs":
        data = INSURANCE_DATA["faqs"]
        if search_term:
            term = search_term.lower()
            data = [f for f in data if term in f['question'].lower() or term in f['answer'].lower()]
        return data
        
    return []

# --- API Models ---

class ChatMessage(BaseModel):
    role: str
    parts: List[dict]

class ChatRequest(BaseModel):
    message: str
    history: List[ChatMessage] = []

# --- API Endpoints ---

@app.get("/api/insurance-data")
async def get_insurance_data():
    return INSURANCE_DATA

@app.post("/api/chat")
async def chat_endpoint(request: ChatRequest):
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="Gemini API Key not configured on server.")
        
    try:
        # Convert history to Gemini format
        gemini_history = []
        for msg in request.history:
            gemini_history.append({
                "role": "user" if msg.role == "user" else "model",
                "parts": [p["text"] for p in msg.parts if "text" in p]
            })

        # Initialize model with tools
        # Note: In Python SDK, tools are passed to the model constructor
        model = genai.GenerativeModel(
            model_name='gemini-1.5-flash', # Or gemini-1.5-pro
            tools=[query_insurance_database],
            system_instruction=(
                "You are the GenAI Insurance Intelligence Assistant (POC). "
                "Your goal is to help insurance companies and partners interact with insurance data naturally. "
                "You have access to a mock database of banks, products, policies, detailed documents, and FAQs. "
                "Use the provided tool 'query_insurance_database' to fetch data when needed."
            )
        )
        
        # Start chat session
        chat_session = model.start_chat(history=gemini_history)
        
        # Send message (SDK handles function calling automatically if configured, 
        # but for more control we can handle it manually if needed)
        # Here we use the automatic handling provided by the high-level SDK
        response = chat_session.send_message(request.message, enable_automatic_function_calling=True)
        
        return {
            "text": response.text,
            "role": "model"
        }
        
    except Exception as e:
        print(f"Error in chat endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/login")
async def login(credentials: dict = Body(...)):
    username = credentials.get("username")
    password = credentials.get("password")
    
    if username == "shivam" and password == "charan":
        return {"status": "success", "user": {"username": "shivam"}}
    else:
        raise HTTPException(status_code=401, detail="Invalid credentials")

if __name__ == "__main__":
    import uvicorn
    # Run with: python main.py
    uvicorn.run(app, host="0.0.0.0", port=8000)
