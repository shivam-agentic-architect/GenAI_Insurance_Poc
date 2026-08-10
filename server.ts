import "dotenv/config";
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import OpenAI from "openai";
import multer from "multer";
import * as pdfParse from "pdf-parse";
const { PDFParse } = pdfParse;

let openaiClient: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY environment variable is required");
    }
    openaiClient = new OpenAI({ apiKey });
  }
  return openaiClient;
}

// RAG logic in Node.js
let documents: string[] = [];
let docEmbeddings: number[][] = [];

// Configure multer for file uploads
const upload = multer({ dest: "uploads/", limits: { fileSize: 5 * 1024 * 1024 } });

// Mock Insurance Data for the POC
const insuranceData = {
  banks: [
    { id: "b1", name: "HDFC Bank", regions: ["Karnataka", "Maharashtra", "Delhi", "Mumbai", "Bangalore"] },
    { id: "b2", name: "ICICI Bank", regions: ["Karnataka", "Tamil Nadu", "Gujarat", "Pune", "Hyderabad"] },
    { id: "b3", name: "SBI", regions: ["All India", "Kolkata", "Ahmedabad", "Jaipur"] },
    { id: "b4", name: "Axis Bank", regions: ["Karnataka", "West Bengal"] }
  ],
  products: [
    { id: "p1", bankId: "b1", category: "Health", name: "HDFC Ergo Health", coverage: "Hospitalization, Daycare, AYUSH. Up to Rs. 10 Lakhs." },
    { id: "p2", bankId: "b2", category: "Health", name: "ICICI Lombard Health Shield", coverage: "OPD, Wellness, Critical Illness. Comprehensive coverage." },
    { id: "p3", bankId: "b3", category: "Health", name: "SBI Arogya Premier", coverage: "Comprehensive Health, Maternity. Up to Rs. 1 Crore." },
    { id: "p4", bankId: "b1", category: "Car", name: "HDFC Motor Insurance", coverage: "Own Damage, Third Party, Zero Dep" },
    { id: "p5", bankId: "b2", category: "Car", name: "ICICI Car Insurance", coverage: "Accidental Damage, Theft, Natural Calamities" },
    { id: "p6", bankId: "b4", category: "Car", name: "Axis Drive Safe", coverage: "Roadside Assistance, Engine Protect" },
    { id: "p7", bankId: "b1", category: "Life", name: "HDFC Life Click 2 Protect", coverage: "Term Life, Terminal Illness" },
    { id: "p8", bankId: "b3", category: "Life", name: "SBI Life eShield", coverage: "Pure Term, Accidental Death Benefit" }
  ],
  policies: [
    { category: "Life", details: "Life insurance provides financial protection to beneficiaries in case of the policyholder's death. It often includes term plans, whole life plans, and endowment plans." },
    { category: "Health", details: "Health insurance covers medical expenses arising from illnesses or injuries. It includes hospitalization, pre and post-hospitalization, and sometimes OPD." },
    { category: "Car", details: "Car insurance protects against financial loss in the event of an accident or theft. It typically includes Third Party Liability and Own Damage coverage." }
  ],
  documents: [
    { id: "doc1", title: "Health Insurance Policy Terms", content: "Our health insurance covers pre-existing diseases after a waiting period of 24 months. It includes cashless hospitalization at over 5000+ network hospitals. OPD coverage is limited to Rs. 5000 per year in the basic plan." },
    { id: "doc2", title: "Car Insurance Add-ons", content: "Zero Depreciation add-on ensures that you get the full claim amount without any deduction for depreciation on replaced parts. Engine Protect covers damage to the engine due to water ingression or oil leakage." },
    { id: "doc3", title: "Life Insurance Claim Process", content: "To file a life insurance claim, the nominee must submit the death certificate, original policy document, and identity proof of the claimant. Claims are usually settled within 15 working days of document submission." }
  ],
  faqs: [
    { question: "How can I renew my policy?", answer: "You can renew your policy through our mobile app or website by entering your policy number and paying the premium online." },
    { question: "What is a No Claim Bonus (NCB)?", answer: "NCB is a discount in premium offered to the policyholder for not making any claims during the previous policy year. It can go up to 50%." }
  ]
};

async function loadDocs() {
  const docs: string[] = [];
  
  // Add unified insuranceData to docs for RAG
  for (const bank of insuranceData.banks) {
    docs.push(`Bank ${bank.name} (ID: ${bank.id}) operates in regions: ${bank.regions.join(", ")}.`);
  }
  
  for (const product of insuranceData.products) {
    const bank = insuranceData.banks.find(b => b.id === product.bankId);
    docs.push(`${product.name} (ID: ${product.id}) is a ${product.category} insurance product offered by ${bank?.name || 'Unknown Bank'} with coverage: ${product.coverage}.`);
  }
  
  for (const policy of insuranceData.policies) {
    docs.push(`${policy.category} insurance policy details: ${policy.details}`);
  }
  
  for (const doc of insuranceData.documents) {
    docs.push(`${doc.title}: ${doc.content}`);
  }
  
  for (const faq of insuranceData.faqs) {
    docs.push(`Question: ${faq.question} Answer: ${faq.answer}`);
  }

  // Summary sentences for specific queries
  docs.push("There are 3 banks that provide health insurance: HDFC Bank, ICICI Bank, and SBI.");
  docs.push("Banks offering car insurance in Karnataka include HDFC Bank, ICICI Bank, and Axis Bank.");


  const baseDir = path.join(process.cwd(), "app", "data");

  // Load text data
  try {
    const textPath = path.join(baseDir, "insurance.txt");
    if (fs.existsSync(textPath)) {
      const content = fs.readFileSync(textPath, "utf-8");
      docs.push(...content.split("\n").filter(line => line.trim()));
    }
  } catch (e) {
    console.error("Error loading text file:", e);
  }

  // Load JSON data
  try {
    const jsonPath = path.join(baseDir, "insurance.json");
    if (fs.existsSync(jsonPath)) {
      const data = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));

      // Banks
      for (const bank of data.banks || []) {
        docs.push(`Bank ${bank.name} operates in regions: ${bank.regions.join(", ")}`);
      }

      // Products
      for (const product of data.products || []) {
        docs.push(`${product.name} is a ${product.category} insurance product offered by bank ${product.bankId} with coverage: ${product.coverage}`);
      }

      // Policies
      for (const policy of data.policies || []) {
        docs.push(`${policy.category} insurance policy details: ${policy.details}`);
      }

      // Documents
      for (const doc of data.documents || []) {
        docs.push(`${doc.title}: ${doc.content}`);
      }

      // FAQs
      for (const faq of data.faqs || []) {
        docs.push(`Q: ${faq.question} A: ${faq.answer}`);
      }
    }
  } catch (e) {
    console.error("Error loading JSON file:", e);
  }

  return docs;
}

async function getEmbedding(text: string) {
  const openai = getOpenAI();
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });
  return response.data[0].embedding;
}

function cosineSimilarity(a: number[], b: number[]) {
  let dotProduct = 0;
  let mA = 0;
  let mB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    mA += a[i] * a[i];
    mB += b[i] * b[i];
  }
  return dotProduct / (Math.sqrt(mA) * Math.sqrt(mB));
}

async function initializeRAG() {
  if (documents.length === 0) {
    documents = await loadDocs();
    console.log(`📄 Loaded ${documents.length} initial documents`);
    
    console.log("🔄 Creating initial embeddings...");
    for (const doc of documents) {
      try {
        const emb = await getEmbedding(doc);
        docEmbeddings.push(emb);
      } catch (e) {
        console.error(`Error embedding document: ${e}`);
      }
    }
    console.log("✅ RAG system ready!");
  }
}

async function retrieve(query: string, k = 3) {
  await initializeRAG();

  const queryEmbedding = await getEmbedding(query);
  const similarities = docEmbeddings.map((emb, i) => ({
    index: i,
    score: cosineSimilarity(queryEmbedding, emb),
  }));

  similarities.sort((a, b) => b.score - a.score);
  return similarities.slice(0, k).map(s => documents[s.index]).join("\n");
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware
  app.use(express.json());

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // File upload endpoint
  app.post("/api/upload", upload.single("file"), async (req, res) => {
    try {
      const file = req.file;
      if (!file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      try {
        let text = "";
        if (file.mimetype === "application/pdf") {
          const dataBuffer = fs.readFileSync(file.path);
          const parser = new PDFParse({ data: dataBuffer });
          const data = await parser.getText();
          text = data.text;
          await parser.destroy();
        } else if (file.mimetype === "text/plain") {
          text = fs.readFileSync(file.path, "utf-8");
        } else {
          return res.status(400).json({ error: "Unsupported file type. Please upload .txt or .pdf" });
        }

        if (!text.trim()) {
          return res.status(400).json({ error: "File is empty or could not extract text" });
        }

        // Split text into chunks (simple split by double newline for now)
        const chunks = text.split(/\n\s*\n/).filter(c => c.trim().length > 20);

        console.log(`[RAG] Adding ${chunks.length} new chunks from uploaded file: ${file.originalname}`);

        for (const chunk of chunks) {
          const docText = `[Uploaded: ${file.originalname}] ${chunk.trim()}`;
          documents.push(docText);
          try {
            const emb = await getEmbedding(docText);
            docEmbeddings.push(emb);
          } catch (e) {
            console.error(`Error embedding chunk: ${e}`);
          }
        }

        res.json({ message: "File uploaded and processed successfully", chunks: chunks.length });
      } finally {
        // Clean up uploaded file
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      }
    } catch (error: any) {
      console.error("[RAG] Error processing upload:", error);
      res.status(500).json({ error: "Failed to process file" });
    }
  });

  app.get("/api/insurance-data", (req, res) => {
    res.json(insuranceData);
  });

  app.get("/api/gpt/ask", async (req, res) => {
    try {
      const q = req.query.q as string;
      if (!q) {
        return res.status(400).json({ error: "Missing query parameter 'q'" });
      }
      
      console.log(`[RAG] Processing query: ${q}`);
      const context = await retrieve(q);
      const openai = getOpenAI();
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are an AI assistant.

Rules:
1. If the user greets (e.g., "hi", "hello", "hey"), respond with a polite greeting.
2. Answer ONLY using the provided context.
3. If the answer is not present in the context, respond exactly with:
   "Sorry, Information is not available."
4. Do not make up information.
5. Keep responses concise and professional.

Context:
${context}`
          },
          { role: "user", content: q }
        ]
      });
      
      res.json({ response: response.choices[0].message.content });
    } catch (error: any) {
      console.error("[RAG] Error processing query:", error);
      res.status(500).json({ error: "Failed to process query" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
