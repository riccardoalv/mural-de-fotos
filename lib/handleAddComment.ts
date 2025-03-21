import api from "@/lib/api";

export const handleAddComment = async (photoId, comment) => {
  const token = localStorage.getItem("token");

  try {
    const response = await api.post(
      `posts/${photoId}/comments`,
      {
        content: comment,
      },
      {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      },
    );
    console.log("Comentário adicionado:", response.data);
  } catch (error) {
    console.error("Erro ao adicionar comentário:", error);
  }
};
