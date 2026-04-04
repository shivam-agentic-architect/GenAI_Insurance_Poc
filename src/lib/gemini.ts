import { GoogleGenAI, Type, FunctionDeclaration, GenerateContentResponse } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey: apiKey || "" });

export const getInsuranceData = async () => {
  const response = await fetch("/api/insurance-data");
  return response.json();
};

const queryInsuranceDatabase: FunctionDeclaration = {
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

export async function chat(message: string, history: any[] = []) {
  const model = "gemini-3-flash-preview";
  
  const contents = [...history, { role: "user", parts: [{ text: message }] }];

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

  if (response.functionCalls) {
    const data = await getInsuranceData();
    const toolResponses = [];

    for (const call of response.functionCalls) {
      const { queryType, category, region, searchTerm, productIds } = call.args as any;
      let content = null;

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
        // Enrich with bank names for better comparison
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

      toolResponses.push({
        functionResponse: {
          name: call.name,
          response: { content }
        }
      });
    }

    const secondResponse = await retryWithBackoff(() => ai.models.generateContent({
      model,
      contents: [
        ...contents,
        { role: "model", parts: response.candidates[0].content.parts },
        { role: "tool", parts: toolResponses }
      ],
      config: {
        tools: [{ functionDeclarations: [queryInsuranceDatabase] }],
      }
    }));

    return secondResponse;
  }

  return response;
}
