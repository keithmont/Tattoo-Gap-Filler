
export const generateTattooImage = async (prompt: string, style: string) => {
  try {
    const response = await fetch("/api/generate-tattoo", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt, style }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to generate tattoo");
    }

    const data = await response.json();
    return data.imageUrl;
  } catch (error) {
    console.error("Error calling tattoo generation API:", error);
    throw error;
  }
};

