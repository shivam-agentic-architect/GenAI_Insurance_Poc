from openai import OpenAI
import numpy as np
import os
import json
from dotenv import load_dotenv

# Try to import faiss, fallback to numpy if not available
try:
    import faiss
    HAS_FAISS = True
except ImportError:
    print("⚠️ FAISS not found, falling back to simple numpy-based similarity.")
    HAS_FAISS = False

load_dotenv()

# Global variables
client = None
documents = []
doc_embeddings = []
index = None
is_initialized = False

def initialize_rag():
    global client, documents, doc_embeddings, index, is_initialized
    
    if is_initialized:
        return True
        
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        print("❌ OPENAI_API_KEY not found in environment variables.")
        return False
        
    try:
        client = OpenAI(api_key=api_key)
        
        print("🔄 Loading documents...")
        documents = load_docs()
        print(f"📄 Loaded {len(documents)} documents")
        
        if not documents:
            print("⚠️ No documents loaded.")
            return False
            
        print("🔄 Creating embeddings (this might take a moment)...")
        # Generate embeddings for all documents
        doc_embeddings = []
        for doc in documents:
            try:
                emb = get_embedding(doc)
                doc_embeddings.append(emb)
            except Exception as e:
                print(f"Error embedding document: {e}")
                continue
        
        if not doc_embeddings:
            print("❌ Failed to create any embeddings.")
            return False
            
        doc_embeddings = np.array(doc_embeddings).astype("float32")
        
        if HAS_FAISS:
            print("🔄 Building FAISS index...")
            dimension = doc_embeddings.shape[1]
            index = faiss.IndexFlatL2(dimension)
            index.add(doc_embeddings)
        else:
            print("✅ Numpy-based similarity ready!")
            
        is_initialized = True
        print("✅ RAG system fully initialized!")
        return True
    except Exception as e:
        print(f"❌ RAG Initialization failed: {e}")
        return False

def load_docs():
    docs = []
    # Use absolute path or relative to project root
    base_dir = os.path.dirname(__file__)
    
    # Load text data
    try:
        text_path = os.path.join(base_dir, "data", "insurance.txt")
        if os.path.exists(text_path):
            with open(text_path, "r") as f:
                docs.extend([line.strip() for line in f.readlines() if line.strip()])
        else:
            print(f"⚠️ Text file not found at {text_path}")
    except Exception as e:
        print(f"Error loading text file: {e}")

    # Load JSON data
    try:
        json_path = os.path.join(base_dir, "data", "insurance.json")
        if os.path.exists(json_path):
            with open(json_path, "r") as f:
                data = json.load(f)

            # Banks
            for bank in data.get("banks", []):
                docs.append(f"Bank {bank['name']} operates in regions: {', '.join(bank['regions'])}")

            # Products
            for product in data.get("products", []):
                docs.append(f"{product['name']} is a {product['category']} insurance product offered by bank {product['bankId']} with coverage: {product['coverage']}")

            # Policies
            for policy in data.get("policies", []):
                docs.append(f"{policy['category']} insurance policy details: {policy['details']}")

            # Documents
            for doc in data.get("documents", []):
                docs.append(f"{doc['title']}: {doc['content']}")

            # FAQs
            for faq in data.get("faqs", []):
                docs.append(f"Q: {faq['question']} A: {faq['answer']}")
        else:
            print(f"⚠️ JSON file not found at {json_path}")
    except Exception as e:
        print(f"Error loading JSON file: {e}")

    return docs

def get_embedding(text):
    if not client:
        raise Exception("OpenAI client not initialized")
    response = client.embeddings.create(
        model="text-embedding-3-small",
        input=text
    )
    return response.data[0].embedding

def retrieve(query, k=3):
    if not is_initialized:
        if not initialize_rag():
            return "RAG system not initialized. Please check API keys and data files."
            
    try:
        query_embedding = get_embedding(query)
        query_embedding = np.array([query_embedding]).astype("float32")

        if HAS_FAISS and index:
            distances, indices = index.search(query_embedding, k)
            results = [documents[i] for i in indices[0] if i < len(documents)]
        else:
            # Simple cosine similarity using numpy
            # Normalize embeddings
            norm_docs = doc_embeddings / np.linalg.norm(doc_embeddings, axis=1, keepdims=True)
            norm_query = query_embedding / np.linalg.norm(query_embedding)
            similarities = np.dot(norm_docs, norm_query.T).flatten()
            indices = np.argsort(similarities)[::-1][:k]
            results = [documents[i] for i in indices if i < len(documents)]

        return "\n".join(results)
    except Exception as e:
        print(f"Error during retrieval: {e}")
        return f"Error retrieving context: {str(e)}"
