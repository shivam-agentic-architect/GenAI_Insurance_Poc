import { GoogleGenAI, Type } from "@google/genai";

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
const upload = multer({ dest: "uploads/" });

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

      // Clean up uploaded file
      fs.unlinkSync(file.path);

      res.json({ message: "File uploaded and processed successfully", chunks: chunks.length });
    } catch (error: any) {
      console.error("[RAG] Error processing upload:", error);
      res.status(500).json({ error: error.message || "Failed to process file" });
    }
  });


  // Gemini Proxy logic
  const queryInsuranceDatabase = {
    name: "queryInsuranceDatabase",
    parameters: {
      type: Type.OBJECT,
      description: "Queries the insurance database for banks, products, policy categories, detailed documents, and FAQs.",
      properties: {
        queryType: {
          type: Type.STRING,
          description: "The type of data to query: 'banks', 'products', 'policies', 'documents', 'faqs', or 'compare'.",
          enum: ["banks", "products", "policies", "documents", "faqs", "compare"],
        },
        category: {
          type: Type.STRING,
          description: "Optional category filter (e.g., 'Health', 'Car', 'Life').",
        },
        region: {
          type: Type.STRING,
          description: "Optional region filter (e.g., 'Karnataka').",
        },
        searchTerm: {
          type: Type.STRING,
          description: "Optional search term for documents or FAQs.",
        },
        productIds: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "List of product IDs to compare or fetch specifically.",
        },
      },
      required: ["queryType"],
    },
  };

  async function retryWithBackoff<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
    let delay = 1000;
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error: any) {
        const isRateLimit = error?.message?.includes("429") || error?.status === 429 || error?.message?.includes("RESOURCE_EXHAUSTED");
        if (isRateLimit && i < maxRetries - 1) {
          console.warn(`Rate limit hit, retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 2;
          continue;
        }
        throw error;
      }
    }
    throw new Error("Max retries exceeded");
  }

  app.post("/api/gemini/chat", async (req, res) => {
    try {
      const { message, history } = req.body;
      if (!message) {
        return res.status(400).json({ error: "Missing message in request body" });
      }

      const model = "gemini-flash-latest";
      const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;

      if (!apiKey || apiKey === "undefined") {
        console.error("[GenAI] API Key is missing or undefined.");
        return res.status(500).json({ error: "Internal Server Error" }); // Secure error message
      }

      if (apiKey.startsWith("sk-")) {
        return res.status(500).json({ error: "Internal Server Error" }); // Secure error message
      }

      const ai = new GoogleGenAI({ apiKey });
      const contents = [...(history || []), { role: "user", parts: [{ text: message }] }];

      const generateResponse = async (currentContents: any[]) => {
        return await ai.models.generateContent({
          model,
          contents: currentContents,
          config: {
            systemInstruction: `You are the GenAI Insurance Intelligence Assistant (POC).
            Your goal is to help insurance companies and partners interact with insurance data naturally.
            You have access to a mock database of banks, products, policies, detailed documents, and FAQs.

            Comparison Capabilities:
            - Use 'queryInsuranceDatabase' with queryType='compare' and a list of 'productIds' to retrieve specific products for side-by-side comparison.
            - When a user asks to compare specific products, ALWAYS use this tool to get the most accurate details.
            - Present the comparison in a clear, easy-to-read Markdown table.

            RAG (Retrieval-Augmented Generation) Capabilities:
            - Use 'queryInsuranceDatabase' with queryType='documents' or 'faqs' to retrieve relevant text context for user questions.
            - When a user asks about specific policy terms, claim processes, or general insurance questions (FAQs), ALWAYS retrieve the relevant documents first.
            - Synthesize the retrieved information into a helpful, accurate response.

            Database Querying Capabilities:
            - Use 'queryInsuranceDatabase' with queryType='banks', 'products', or 'policies' for structured data.

            Always be professional, concise, and data-driven. If you don't have specific data, state that it's a POC and the data is limited.`,
            tools: [{ functionDeclarations: [queryInsuranceDatabase] }],
          },
        });
      };

      const response = await retryWithBackoff(() => generateResponse(contents));

      if (!response.candidates || response.candidates.length === 0) {
        console.error("No candidates returned from Gemini API.");
        return res.status(500).json({ error: "Internal Server Error" });
      }

      if (response.functionCalls && response.functionCalls.length > 0) {
        const data = insuranceData;
        const toolResponses = [];

        for (const call of response.functionCalls) {
          const { queryType, category, region, searchTerm, productIds } = call.args as any;
          let content = null;

          try {
            if (queryType === "banks") {
              let filteredBanks = data.banks;
              if (region) {
                filteredBanks = filteredBanks.filter((b: any) =>
                  b.regions.includes(region) || b.regions.includes("All India")
                );
              }
              if (category) {
                const bankIdsWithCategory = data.products
                  .filter((p: any) => p.category.toLowerCase() === category.toLowerCase())
                  .map((p: any) => p.bankId);
                filteredBanks = filteredBanks.filter((b: any) => bankIdsWithCategory.includes(b.id));
              }
              content = filteredBanks;
            } else if (queryType === "products") {
              let filteredProducts = data.products;
              if (category) {
                filteredProducts = filteredProducts.filter((p: any) => p.category.toLowerCase() === category.toLowerCase());
              }
              content = filteredProducts;
            } else if (queryType === "compare") {
              let filteredProducts = data.products;
              if (productIds && productIds.length > 0) {
                filteredProducts = filteredProducts.filter((p: any) => productIds.includes(p.id));
              }
              content = filteredProducts.map((p: any) => ({
                ...p,
                bankName: data.banks.find((b: any) => b.id === p.bankId)?.name || "Unknown Bank"
              }));
            } else if (queryType === "policies") {
              let filteredPolicies = data.policies;
              if (category) {
                filteredPolicies = filteredPolicies.filter((p: any) => p.category.toLowerCase() === category.toLowerCase());
              }
              content = filteredPolicies;
            } else if (queryType === "documents") {
              let filteredDocs = data.documents;
              if (searchTerm) {
                const term = searchTerm.toLowerCase();
                filteredDocs = filteredDocs.filter((d: any) =>
                  d.title.toLowerCase().includes(term) || d.content.toLowerCase().includes(term)
                );
              }
              content = filteredDocs;
            } else if (queryType === "faqs") {
              let filteredFaqs = data.faqs;
              if (searchTerm) {
                const term = searchTerm.toLowerCase();
                filteredFaqs = filteredFaqs.filter((f: any) =>
                  f.question.toLowerCase().includes(term) || f.answer.toLowerCase().includes(term)
                );
              }
              content = filteredFaqs;
            }
          } catch (err) {
            console.error("Error processing tool call:", err);
            content = { error: "Failed to process query" };
          }

          toolResponses.push({
            functionResponse: {
              name: call.name,
              response: { content }
            }
          });
        }

        const secondResponse = await retryWithBackoff(() => {
          return ai.models.generateContent({
            model,
            contents: [
              ...contents,
              response.candidates[0].content,
              { role: "tool", parts: toolResponses }
            ],
            config: {
              tools: [{ functionDeclarations: [queryInsuranceDatabase] }],
            }
          });
        });

        if (!secondResponse.candidates || secondResponse.candidates.length === 0) {
          console.error("No candidates returned from Gemini API (Second Call).");
          return res.status(500).json({ error: "Internal Server Error" });
        }
        return res.json({ text: secondResponse.text });
      }

      return res.json({ text: response.text });
    } catch (error: any) {
      console.error("[GenAI] Error processing query:", error);
      res.status(500).json({ error: "Internal Server Error" });
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
      res.status(500).json({ error: error.message || "Failed to process query" });
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
