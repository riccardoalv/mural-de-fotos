"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { X, Heart, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import api from "@/lib/api";

export type Comment = {
  id: string;
  user: {
    id: string;
    avatarUrl: string | null;
    name: string;
  };
  content: string;
  createdAt?: string;
};

export type Photo = {
  id: string;
  caption: string;
  imageUrl: string;
  user?: {
    id: string;
    avatarUrl: string | null;
    name: string;
  };
  _count: {
    likes: number;
    comments: number;
  };
  comments?: Comment[];
};

interface PhotoModalProps {
  photo: Photo;
  onClose: () => void;
}

export default function PhotoModal({ photo, onClose }: PhotoModalProps) {
  const [newComment, setNewComment] = useState("");
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(photo._count.likes);
  const [comments, setComments] = useState<Comment[]>(photo.comments || []);
  const [error, setError] = useState("");
  const token = localStorage.getItem("token");

  // URL para baixar a imagem usando o id do post
  const imageUrl = `${api.defaults.baseURL}/posts/${photo.id}/download-image`;

  // Quando o modal for aberto, faz uma requisição para buscar os dados atualizados do post
  useEffect(() => {
    async function fetchPostData() {
      try {
        const response = await api.get(`/posts/${photo.id}`);
        const postData = response.data;
        setComments(postData.comments || []);
        setLikesCount(postData._count.likes);
      } catch (err) {
        console.error("Erro ao buscar dados do post", err);
        setError("Erro ao buscar dados do post");
      }
    }

    fetchPostData();
  }, [photo.id]);

  // Função para adicionar comentário via API
  const handleAddComment = async () => {
    const text = newComment.trim();
    if (!text) return;
    try {
      const response = await api.post(
        `/posts/${photo.id}/comments`,
        {
          content: text,
        },
        {
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );
      // Atualiza os comentários com o novo comentário retornado pela API
      setComments((prev) => [...prev, response.data]);
    } catch (err) {
      console.error("Erro ao adicionar comentário", err);
      setError("Erro ao adicionar comentário");
    }
    setNewComment("");
  };

  // Função para alternar o like do post via API
  const handleLike = async () => {
    try {
      if (!liked) {
        await api.post(
          `/posts/${photo.id}/like`,
          {},
          {
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          },
        );
        setLiked(true);
        setLikesCount((prev) => prev + 1);
      } else {
        await api.delete(
          `/posts/${photo.id}/likes`,
          {
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          },
        );
        setLiked(false);
        setLikesCount((prev) => prev - 1);
      }
    } catch (err) {
      console.error("Erro ao atualizar like", err);
      setError("Erro ao atualizar like");
    }
  };

  // Impede o scroll do background enquanto o modal estiver aberto
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4 overflow-auto">
      <div className="bg-background rounded-lg overflow-hidden w-full max-w-5xl flex flex-col lg:flex-row">
        <button onClick={onClose} className="absolute top-4 right-4 text-white">
          <X className="h-6 w-6" />
        </button>

        <div className="lg:w-2/3 flex items-center justify-center bg-black">
          <Image
            src={imageUrl}
            alt={photo.caption || "Foto"}
            width={800}
            height={600}
            className="object-contain max-h-screen"
            unoptimized
          />
        </div>

        <div className="lg:w-1/3 flex flex-col max-h-screen">
          {/* Cabeçalho com informações do usuário */}
          <div className="p-4 border-b flex items-center gap-3">
            <Avatar>
              <AvatarFallback>
                {photo.user?.name
                  ? photo.user.name.slice(0, 2).toUpperCase()
                  : "NN"}
              </AvatarFallback>
            </Avatar>
            <span className="font-medium">
              {photo.user?.name || "Desconhecido"}
            </span>
          </div>

          {/* Exibe o caption da foto */}
          <div className="p-4 border-b">
            <p className="text-sm text-gray-700">{photo.caption}</p>
          </div>

          {/* Área dos comentários */}
          <div className="flex-1 overflow-auto p-4 space-y-4">
            {error && <div className="text-red-500">{error}</div>}
            {comments.map((c) => (
              <div key={c.id} className="flex gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    {c.user?.name
                      ? c.user.name.slice(0, 2).toUpperCase()
                      : "NN"}
                  </AvatarFallback>
                </Avatar>
                <p>
                  <strong>{c.user?.name || "Desconhecido"}</strong> {c.content}
                </p>
              </div>
            ))}
          </div>

          {/* Área de interação (likes e adição de comentários) */}
          <div className="p-4 border-t">
            <div className="flex items-center gap-4 mb-3">
              <Button variant="ghost" size="icon" onClick={handleLike}>
                <Heart
                  className={`h-6 w-6 ${liked ? "fill-red-500 text-red-500" : ""
                    }`}
                />
              </Button>
              <span className="ml-auto font-medium">{likesCount} likes</span>
            </div>

            <div className="flex gap-2">
              <Input
                placeholder="Adicione um comentário…"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
                className="flex-1"
              />
              <Button size="icon" onClick={handleAddComment}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
