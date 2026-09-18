
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
      throw new Error(data.error || "Failed to fetch response from Gemini proxy");
    }

    if (data.candidates && data.candidates.length > 0 && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts.length > 0) {
      // Re-add the .text getter on the returned response to simulate the Google GenAI SDK behavior
      Object.defineProperty(data, 'text', {
        get() {
            return this.candidates?.[0]?.content?.parts?.[0]?.text || "I'm sorry, I couldn't process that request.";
        }
      });
      return data;
    }

    return { text: "I'm sorry, I couldn't process that request." };
  } catch (error) {
    console.error("Chat error:", error);
    throw error;
  }
}
