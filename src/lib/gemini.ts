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

export async function chat(message: string, history: any[] = []) {
  if (typeof process !== "undefined" && process.env.GEMINI_API_KEY) {
    console.warn("Client-side process.env references should be removed.");
  }
  
  const response = await fetch("/api/gemini/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, history })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to process chat request on the server");
  }

  return { text: data.text };
}
