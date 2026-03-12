
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
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Server error: ${response.status}`);
      } else {
        const text = await response.text();
        console.error("Server returned non-JSON error:", text);
        throw new Error(`Server error (${response.status}): ${text.substring(0, 100)}...`);
      }
    }

    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const text = await response.text();
      throw new Error(`Expected JSON but got ${contentType}: ${text.substring(0, 100)}...`);
    }

    const data = await response.json();
    return data.imageUrl;
  } catch (error) {
    console.error("Error calling tattoo generation API:", error);
    throw error;
  }
};

