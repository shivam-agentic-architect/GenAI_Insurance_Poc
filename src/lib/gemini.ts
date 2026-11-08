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
  const response = await fetch("/api/gemini/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message, history }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  return data;
}
