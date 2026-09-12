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
      throw new Error(data.error || "Failed to process chat");
    }

    // Wrap the plain string text into an object with a text property
    // to mock the expected GenerativeModel response behavior.
    return {
      text: data.text
    };
  } catch (error) {
    console.error("Chat error:", error);
    throw error;
  }
}
