"use client";

import api from "@/lib/api";

export const handleAddComment = async (
  postId: number,
  comment: string,
  isAuthenticated: boolean,
  token: string | null,
) => {
  if (!isAuthenticated || !token) {
    return null;
  }

  try {
    const response = await api.post(
      `posts/${postId}/comments`,
      { content: comment },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    return response.data;
  } catch (error) {
    console.error("Erro ao adicionar comentário:", error);
    return null;
  }
};
