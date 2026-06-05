import { Type, FunctionDeclaration } from "@google/genai";

export const getInsuranceData = async () => {
  try {
    const response = await fetch("/api/insurance-data");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (err) {
    console.error("Failed to fetch insurance data:", err);
    // Return empty data structure as fallback to prevent total crash
    return { banks: [], products: [], policies: [], documents: [], faqs: [] };
  }
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
  const model = "gemini-flash-latest";
  
  const contents = [...history, { role: "user", parts: [{ text: message }] }];

  const generateResponse = async (currentContents: any[]) => {
    try {
      const response = await fetch('/api/gemini/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: currentContents
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (err: any) {
      console.error("Gemini API Error:", err);
      const errorMessage = err?.message || String(err);
      
      if (errorMessage.includes("Forbidden") || errorMessage.includes("403")) {
        throw new Error("Access Forbidden (403): The API key is either invalid, restricted, or does not have permission for the 'gemini-flash-latest' model. Please verify that 'Generative AI API' is enabled in your Google Cloud project and that the key is correctly configured in the Cloud Run environment variables.");
      }
      
      if (errorMessage.includes("quota") || errorMessage.includes("429")) {
        throw new Error("Quota Exceeded (429): You have reached the rate limit for the Gemini API. Please wait a moment and try again.");
      }

      throw err;
    }
  };

  const response = await retryWithBackoff(() => generateResponse(contents));

  if (!response.candidates || response.candidates.length === 0) {
    console.error("No candidates returned from Gemini API. Response:", response);
    throw new Error("No response from AI");
  }

  if (response.functionCalls && response.functionCalls.length > 0) {
    const data = await getInsuranceData();
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
        content = { error: "Failed to fetch data from database" };
      }

      toolResponses.push({
        functionResponse: {
          name: call.name,
          response: { content }
        }
      });
    }

    const secondResponse = await retryWithBackoff(() => {
      return fetch('/api/gemini/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            ...contents,
            response.candidates[0].content,
            { role: "tool", parts: toolResponses }
          ]
        })
      }).then(async res => {
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
        }
        return res.json();
      });
    });

    if (!secondResponse.candidates || secondResponse.candidates.length === 0) {
      console.error("No candidates returned from Gemini API (Second Call). Response:", secondResponse);
      throw new Error("No response from AI after tool call");
    }

    return secondResponse;
  }

  return response;
}
