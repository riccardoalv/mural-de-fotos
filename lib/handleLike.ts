"use client";

import api from "@/lib/api";

export const handleLike = async (
  postId: number,
  isAuthenticated: boolean,
  token: string | null,
) => {
  if (!isAuthenticated || !token) {
    return null;
  }

  try {
    const response = await api.post(
      `posts/${postId}/like`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    return response.data;
  } catch (error) {
    console.error("Erro ao curtir post:", error);
    return null;
  }
};
