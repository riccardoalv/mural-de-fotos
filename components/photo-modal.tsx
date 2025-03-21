"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, MessageCircle, Send, X } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import api from "@/lib/api";
import { handleLike } from "@/lib/handleLike";
import { handleAddComment } from "@/lib/handleAddComment";

interface PhotoModalProps {
  photo: any;
  onClose: () => void;
}

export default function PhotoModal({ photo, onClose }: PhotoModalProps) {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState<any[]>([]);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [photoData, setPhotoData] = useState<any>(photo);
  const pathname = usePathname();
  const [imageUrl, setImageUrl] = useState("");

  // Buscar dados completos da foto
  useEffect(() => {
    const fetchPhotoData = async () => {
      setIsLoading(true);
      try {
        const savedToken = localStorage.getItem("token");
        setToken(savedToken);

        // Configurar headers com token se disponível
        const config = savedToken
          ? {
            headers: {
              Authorization: `Bearer ${savedToken}`,
            },
          }
          : undefined;

        // Buscar dados completos da foto
        const { data } = await api.get(`posts/${photo.id}`, config);

        setPhotoData(data);
        setComments(data.comments || []);
        setLikesCount(data._count?.likes || 0);

        // Verificar se o usuário atual curtiu a foto
        if (isAuthenticated && savedToken) {
          try {
            const likeResponse = await api.get(`posts/${photo.id}/liked`, {
              headers: {
                Authorization: `Bearer ${savedToken}`,
              },
            });
            setLiked(likeResponse.data.liked);
          } catch (error) {
            console.error("Erro ao verificar like:", error);
            setLiked(false);
          }
        }

        // Construir URL da imagem
        const imgUrl = `${api.defaults.baseURL}/posts/${photo.id}/download-image`;
        setImageUrl(imgUrl);
      } catch (error) {
        console.error("Erro ao buscar dados da foto:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPhotoData();
  }, [photo.id, isAuthenticated]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;

    setIsSubmitting(true);
    try {
      const currentPath = `${pathname}?photo=${photo.id}`;

      // Verificar autenticação diretamente aqui
      if (!isAuthenticated) {
        router.push(`/login?redirect=${encodeURIComponent(currentPath)}`);
        return;
      }

      // Chamar a função utilitária sem passar o router
      const result = await handleAddComment(
        photo.id,
        comment,
        isAuthenticated,
        token,
      );

      if (result) {
        // Adicionar o novo comentário à lista
        const newComment = {
          id: result.id,
          content: comment,
          createdAt: new Date().toISOString(),
          user: {
            id: user?.id,
            name: user?.email, // Usar email como fallback para o nome
            avatarUrl: null,
          },
        };
        setComments((prev) => [newComment, ...prev]);
        setComment("");

        // Atualizar contagem de comentários
        setPhotoData((prev) => ({
          ...prev,
          _count: {
            ...prev._count,
            comments: (prev._count?.comments || 0) + 1,
          },
        }));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLikeClick = async () => {
    const currentPath = `${pathname}?photo=${photo.id}`;

    // Verificar autenticação diretamente aqui
    if (!isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent(currentPath)}`);
      return;
    }

    // Chamar a função utilitária sem passar o router
    const result = await handleLike(photo.id, isAuthenticated, token);

    if (result) {
      const newLikedState = !liked;
      setLiked(newLikedState);
      setLikesCount((prev) => (newLikedState ? prev + 1 : prev - 1));
    }
  };

  return (
    <Dialog open={true} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-4xl p-0 h-[90vh] max-h-[90vh] flex flex-col md:flex-row overflow-hidden">
        {/* Título acessível para leitores de tela */}
        <DialogTitle className="sr-only">
          {photoData.caption || "Detalhes da foto"}
        </DialogTitle>

        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Fechar</span>
        </button>

        {/* Imagem */}
        <div className="relative flex-1 min-h-[300px] md:min-h-0 bg-black flex items-center justify-center">
          {isLoading ? (
            <div className="animate-pulse flex items-center justify-center w-full h-full">
              <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            imageUrl && (
              <img
                src={imageUrl || "/placeholder.svg"}
                alt={photoData.caption || "Foto"}
                className="max-h-full max-w-full object-contain"
              />
            )
          )}
        </div>

        {/* Comentários e informações */}
        <div className="w-full md:w-[350px] flex flex-col h-full">
          {isLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <>
              {/* Cabeçalho */}
              <div className="p-4 border-b flex items-center space-x-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={
                      photoData.user?.avatarUrl ||
                      "/placeholder.svg?height=32&width=32"
                    }
                    alt={photoData.user?.name || ""}
                  />
                  <AvatarFallback>
                    {photoData.user?.name?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">
                    {photoData.user?.name || "Usuário"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {photoData.createdAt &&
                      formatDistanceToNow(new Date(photoData.createdAt), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                  </p>
                </div>
              </div>

              {/* Descrição */}
              {photoData.caption && (
                <div className="p-4 border-b">
                  <p className="text-sm">{photoData.caption}</p>
                </div>
              )}

              {/* Lista de comentários */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {comments.length === 0 ? (
                  <p className="text-center text-muted-foreground text-sm py-4">
                    Nenhum comentário ainda. Seja o primeiro a comentar!
                  </p>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} className="flex space-x-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage
                          src={
                            comment.user?.avatarUrl ||
                            "/placeholder.svg?height=24&width=24"
                          }
                          alt={comment.user?.name || ""}
                        />
                        <AvatarFallback>
                          {comment.user?.name?.charAt(0).toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-baseline space-x-2">
                          <span className="text-sm font-medium">
                            {comment.user?.name || "Usuário"}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {comment.createdAt &&
                              formatDistanceToNow(new Date(comment.createdAt), {
                                addSuffix: true,
                                locale: ptBR,
                              })}
                          </span>
                        </div>
                        <p className="text-sm">{comment.content}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Ações e formulário de comentário */}
              <div className="p-4 border-t">
                <div className="flex items-center space-x-4 mb-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`flex items-center ${liked ? "text-red-500" : ""}`}
                    onClick={handleLikeClick}
                  >
                    <Heart
                      className={`h-5 w-5 mr-1 ${liked ? "fill-red-500" : ""}`}
                    />
                    {likesCount} {likesCount === 1 ? "Like" : "Likes"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center"
                  >
                    <MessageCircle className="h-5 w-5 mr-1" />
                    {photoData._count?.comments || 0}{" "}
                    {photoData._count?.comments === 1
                      ? "Comentário"
                      : "Comentários"}
                  </Button>
                </div>

                <form onSubmit={handleSubmitComment} className="flex space-x-2">
                  <Textarea
                    placeholder="Adicione um comentário..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="min-h-[60px] flex-1"
                  />
                  <Button
                    type="submit"
                    size="icon"
                    disabled={!comment.trim() || isSubmitting}
                  >
                    <Send className="h-4 w-4" />
                    <span className="sr-only">Enviar comentário</span>
                  </Button>
                </form>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
