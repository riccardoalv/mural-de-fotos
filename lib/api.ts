import axios from "axios";

const api = axios.create({
  baseURL: "http://computacao.unir.br/mural/api",
  headers: {
    Accept: "*/*",
    "Content-Type": "application/json",
  },
});

export default api;

// Modify the getImageUrl function to handle URL parameters more securely
export const getImageUrl = (postId: string) => {
  // Use URL constructor to ensure proper URL formatting
  try {
    // Create a proper URL object to handle parameters correctly
    const baseUrl =
      api.defaults.baseURL || "http://computacao.unir.br/mural/api";
    const url = new URL(`${baseUrl}/posts/${postId}/download-image`);

    // Log for debugging
    console.log("URL da imagem gerada:", url.toString());

    return url.toString();
  } catch (error) {
    console.error("Erro ao gerar URL da imagem:", error);
    // Fallback to direct string concatenation if URL constructor fails
    return `${api.defaults.baseURL}/posts/${postId}/download-image`;
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
