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
  try {
    const response = await fetch("/api/gemini/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message, history }),
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMessage = data.error || `HTTP error! status: ${response.status}`;
      if (errorMessage.includes("Forbidden") || errorMessage.includes("403")) {
        throw new Error("Access Forbidden (403): The API key is either invalid, restricted, or does not have permission for the 'gemini-flash-latest' model. Please verify that 'Generative AI API' is enabled in your Google Cloud project and that the key is correctly configured in the Cloud Run environment variables.");
      }
      if (errorMessage.includes("quota") || errorMessage.includes("429")) {
        throw new Error("Quota Exceeded (429): You have reached the rate limit for the Gemini API. Please wait a moment and try again.");
      }
      throw new Error(errorMessage);
    }

    return { text: data.text };
  } catch (err) {
    console.error("Gemini Chat Error:", err);
    throw err;
  }
}
