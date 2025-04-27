import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:4000",
  headers: {
    Accept: "*/*",
    "Content-Type": "application/json",
  },
});

export default api;

// Update the getImageUrl function to use the new endpoint
export const getImageUrl = (postId: string) => {
  // Use URL constructor to ensure proper URL formatting
  try {
    // Create a proper URL object to handle parameters correctly
    const baseUrl = api.defaults.baseURL || "http://localhost:4000";
    const url = new URL(`${baseUrl}/posts/download/${postId}`);

    return url.toString();
  } catch (error) {
    console.error("Erro ao gerar URL da imagem:", error);
    // Fallback to direct string concatenation if URL constructor fails
    return `${api.defaults.baseURL}/posts/download/${postId}`;
  }
};

// Add a function to get authenticated image URL if needed
export const getAuthenticatedImageUrl = (postId: string) => {
  const token = localStorage.getItem("token");
  const url = getImageUrl(postId);

  // If we have a token, append it as a query parameter
  if (token) {
    try {
      const urlObj = new URL(url);
      urlObj.searchParams.append("token", token);
      return urlObj.toString();
    } catch (error) {
      console.error("Erro ao adicionar token à URL:", error);
    }
  }

  return url;
};

export const searchPosts = async (term: string, page = 1, limit = 24) => {
  try {
    const token = localStorage.getItem("token");
    const config = token
      ? {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
      : undefined;

    const response = await api.get(
      `/posts/search?term=${encodeURIComponent(term)}&page=${page}&limit=${limit}`,
      config,
    );
    return response.data;
  } catch (error) {
    console.error("Erro ao buscar posts:", error);
    throw error;
  }
};
