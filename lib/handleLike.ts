import api from "@/lib/api";

export const handleLike = async (photoId) => {
  const token = localStorage.getItem("token");

  try {
    const response = await api.post(
      `posts/${photoId}/like`,
      {},
      {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      },
    );
    console.log("Like realizado:", response.data);
  } catch (error) {
    console.error("Erro ao dar like:", error);
  }
};
