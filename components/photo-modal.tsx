"use client";

import type React from "react";

import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Heart,
  MessageCircle,
  Send,
  Calendar,
  Volume2,
  VolumeX,
  Maximize,
  Pause,
  Play,
  Pencil,
  Trash2,
  ExternalLink,
  X,
} from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import api from "@/lib/api";
import { handleLike } from "@/lib/handleLike";
import { handleAddComment } from "@/lib/handleAddComment";
import { getImageUrl } from "@/lib/api";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { EditPostDialog } from "@/components/edit-post-dialog";

interface PhotoModalProps {
  postId: string;
  onClose: () => void;
  isOpen: boolean;
}

export function PhotoModal({ postId, onClose, isOpen }: PhotoModalProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuth();
  const [token, setToken] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState<any[]>([]);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [photoData, setPhotoData] = useState<any>(null);
  const [mediaUrl, setMediaUrl] = useState("");
  const [aspectRatio, setAspectRatio] = useState<number | null>(null);
  const [isVertical, setIsVertical] = useState(false);
  const [isVideo, setIsVideo] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const [imageError, setImageError] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detectar se é dispositivo móvel
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  // Verificar se o usuário atual é o proprietário do post
  const isOwner = user && photoData?.user?.id === user.id;

  // Atualizar o título da página
  useEffect(() => {
    if (photoData?.caption) {
      document.title = `${photoData.caption} | Mural de Fotos`;
    } else {
      document.title = "Mural de Fotos";
    }

    return () => {
      document.title = "Mural de Fotos";
    };
  }, [photoData]);

  // Buscar dados completos da foto/vídeo
  useEffect(() => {
    if (!isOpen || !postId) return;

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

        // Buscar dados completos da foto/vídeo
        const { data } = await api.get(`posts/${postId}`, config);

        setPhotoData(data);
        setComments(data.comments || []);
        setLikesCount(data._count?.likes || 0);

        // Verificar se é um vídeo com base na propriedade isVideo do post
        setIsVideo(!!data.isVideo);

        try {
          // Usar getImageUrl para ambos os tipos de mídia
          const imageUrl = getImageUrl(postId);
          console.log("URL da imagem no modal:", imageUrl); // Log para depuração
          setMediaUrl(imageUrl);
        } catch (error) {
          console.error("Erro ao gerar URL da imagem no modal:", error);
          // Fallback to direct URL construction
          setMediaUrl(`${api.defaults.baseURL}/posts/${postId}/download-image`);
        }

        // Verificar se o usuário atual curtiu a foto usando o endpoint específico
        if (isAuthenticated && savedToken) {
          try {
            const likeResponse = await api.get(`posts/${postId}/liked`, {
              headers: {
                Authorization: `Bearer ${savedToken}`,
                accept: "*/*",
              },
            });

            // Se retornar qualquer objeto JSON, significa que o usuário deu like
            setLiked(!!likeResponse.data);
          } catch (error) {
            console.error("Erro ao verificar like:", error);
            setLiked(false);
          }
        }
      } catch (error) {
        console.error("Erro ao buscar dados da mídia:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPhotoData();
  }, [postId, isAuthenticated, isOpen]);

  // Detectar quando a imagem carrega para determinar o aspect ratio
  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    if (img.naturalWidth && img.naturalHeight) {
      const ratio = img.naturalWidth / img.naturalHeight;
      setAspectRatio(ratio);
      setIsVertical(ratio < 0.8);
    }
  };

  // Detectar quando o vídeo carrega para determinar o aspect ratio
  const handleVideoLoad = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const ratio = video.videoWidth / video.videoHeight;
      setAspectRatio(ratio);
      setIsVertical(ratio < 0.8);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;

    setIsSubmitting(true);
    try {
      // Verificar autenticação diretamente aqui
      if (!isAuthenticated) {
        router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
        return;
      }

      // Chamar a função utilitária sem passar o router
      const result = await handleAddComment(
        postId,
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
    // Verificar autenticação diretamente aqui
    if (!isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    // Chamar a função utilitária sem passar o router
    const result = await handleLike(postId, isAuthenticated, token);

    if (result) {
      const newLikedState = !liked;
      setLiked(newLikedState);
      setLikesCount((prev) => (newLikedState ? prev + 1 : prev - 1));
    }
  };

  // Controles de vídeo
  const togglePlay = () => {
    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const toggleFullscreen = () => {
    if (!videoContainerRef.current) return;

    if (!isFullscreen) {
      if (videoContainerRef.current.requestFullscreen) {
        videoContainerRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    setIsFullscreen(!isFullscreen);
  };

  // Monitorar eventos de vídeo
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    videoElement.addEventListener("play", handlePlay);
    videoElement.addEventListener("pause", handlePause);
    videoElement.addEventListener("ended", handleEnded);
    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      videoElement.removeEventListener("play", handlePlay);
      videoElement.removeEventListener("pause", handlePause);
      videoElement.removeEventListener("ended", handleEnded);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  // Função para excluir o post
  const handleDeletePost = async () => {
    if (!token) return;

    setIsDeleting(true);
    try {
      await api.delete(`/posts/${postId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Fechar o modal e redirecionar para a página inicial
      onClose();
      router.push("/");
    } catch (error) {
      console.error("Erro ao excluir post:", error);
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  // Função para atualizar os dados do post após a edição
  const handlePostUpdated = (updatedPost: any) => {
    setPhotoData(updatedPost);
    setIsEditDialogOpen(false);
  };

  // Função para navegar para o perfil do usuário
  const navigateToUserProfile = () => {
    if (photoData?.user?.id) {
      onClose();
      router.push(`/user/${photoData.user.id}`);
    }
  };

  // Fechar o modal com a tecla ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Impedir o scroll do body quando o modal estiver aberto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Fechar o modal ao clicar fora do conteúdo
  const handleBackdropClick = (e: React.MouseEvent) => {
    // Não fechar se o modal de edição estiver aberto
    if (isEditDialogOpen) return;

    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  // Adicione esta função para lidar com erros de carregamento da imagem
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    console.error("Erro ao carregar a imagem:", mediaUrl);
    setImageError(true);
    // Set a fallback image
    e.currentTarget.src = "/placeholder.svg?height=400&width=400";
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-2 sm:p-4 md:p-8"
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className="bg-background rounded-lg overflow-hidden w-full max-w-7xl max-h-[95vh] flex flex-col md:flex-row relative"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "calc(100vw - 16px)" }}
      >
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 z-50 bg-black/50 text-white hover:bg-black/70 h-8 w-8 md:top-4 md:right-4"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>

        {isLoading ? (
          <div className="flex items-center justify-center min-h-[40vh] md:min-h-[60vh] w-full">
            <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : photoData ? (
          <>
            {/* Conteúdo da mídia - Imagem ou Vídeo */}
            <div
              className={`bg-black ${isMobile ? "h-[40vh]" : "flex-1"} flex items-center justify-center ${isMobile ? "" : "md:h-[calc(95vh-32px)] md:max-h-[95vh]"}`}
            >
              {isVideo ? (
                <div
                  ref={videoContainerRef}
                  className="relative w-full h-full flex items-center justify-center"
                >
                  <video
                    ref={videoRef}
                    src={mediaUrl}
                    className="max-h-full max-w-full"
                    controls={false}
                    muted={isMuted}
                    playsInline
                    onLoadedMetadata={handleVideoLoad}
                  />

                  {/* Controles de vídeo personalizados */}
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center items-center gap-2 px-2 md:gap-4 md:px-4">
                    <div className="bg-black/60 rounded-full p-1 md:p-2 backdrop-blur-sm flex items-center gap-2 md:gap-3">
                      <button
                        onClick={togglePlay}
                        className="text-white hover:text-primary transition-colors"
                        aria-label={isPlaying ? "Pausar" : "Reproduzir"}
                      >
                        {isPlaying ? (
                          <Pause className="h-4 w-4 md:h-5 md:w-5" />
                        ) : (
                          <Play className="h-4 w-4 md:h-5 md:w-5" />
                        )}
                      </button>

                      <button
                        onClick={toggleMute}
                        className="text-white hover:text-primary transition-colors"
                        aria-label={isMuted ? "Ativar som" : "Desativar som"}
                      >
                        {isMuted ? (
                          <VolumeX className="h-4 w-4 md:h-5 md:w-5" />
                        ) : (
                          <Volume2 className="h-4 w-4 md:h-5 md:w-5" />
                        )}
                      </button>

                      <button
                        onClick={toggleFullscreen}
                        className="text-white hover:text-primary transition-colors"
                        aria-label="Tela cheia"
                      >
                        <Maximize className="h-4 w-4 md:h-5 md:w-5" />
                      </button>
                    </div>
                  </div>

                  {/* Overlay para play/pause ao clicar no vídeo */}
                  <div
                    className="absolute inset-0 cursor-pointer"
                    onClick={togglePlay}
                    aria-hidden="true"
                  />
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center relative">
                  {/* Indicador de carregamento */}
                  {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                      <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}

                  {imageError ? (
                    <div className="flex flex-col items-center justify-center text-white p-4">
                      <div className="text-red-500 mb-2 text-sm md:text-base">
                        Erro ao carregar a imagem
                      </div>
                      <Button
                        variant="outline"
                        size={isMobile ? "sm" : "default"}
                        onClick={() => {
                          setImageError(false);
                          // Tentar recarregar a imagem
                          setMediaUrl(getImageUrl(postId));
                        }}
                      >
                        Tentar novamente
                      </Button>
                    </div>
                  ) : (
                    <img
                      src={mediaUrl || "/placeholder.svg"}
                      alt={photoData.caption || "Foto"}
                      className="max-w-full max-h-full object-contain"
                      onLoad={handleImageLoad}
                      onError={handleImageError}
                      style={{ display: "block" }}
                      crossOrigin="anonymous"
                    />
                  )}
                </div>
              )}
            </div>

            {/* Comentários e informações */}
            <div
              className={`flex flex-col border-t md:border-t-0 md:border-l w-full ${isMobile ? "h-[55vh]" : "md:w-[350px] lg:w-[450px]"} bg-background overflow-hidden`}
            >
              {/* Cabeçalho */}
              <div className="p-3 md:p-4 border-b">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center space-x-2">
                    <Avatar
                      className="h-8 w-8 md:h-10 md:w-10 cursor-pointer flex-shrink-0"
                      onClick={navigateToUserProfile}
                    >
                      <AvatarImage
                        src={
                          photoData.user?.avatarUrl ||
                          "/placeholder.svg?height=40&width=40"
                        }
                        alt={photoData.user?.name || ""}
                      />
                      <AvatarFallback>
                        {photoData.user?.name?.charAt(0).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center flex-wrap gap-1">
                        <p
                          className="text-sm font-medium cursor-pointer hover:underline truncate"
                          onClick={navigateToUserProfile}
                        >
                          {photoData.user?.name || "Usuário"}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs text-primary"
                          onClick={navigateToUserProfile}
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Ver perfil
                        </Button>
                      </div>
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3 mr-1 flex-shrink-0" />
                        <span className="truncate">
                          {photoData.createdAt &&
                            formatDistanceToNow(new Date(photoData.createdAt), {
                              addSuffix: true,
                              locale: ptBR,
                            })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Botões de ação (apenas para o proprietário) */}
                  {isOwner && (
                    <div className="flex items-center gap-2 mt-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center text-primary h-8 px-2 text-xs flex-1"
                        onClick={() => setIsEditDialogOpen(true)}
                      >
                        <Pencil className="h-3 w-3 mr-1" />
                        <span>Editar</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center text-destructive hover:bg-destructive/10 h-8 px-2 text-xs flex-1"
                        onClick={() => setIsDeleteDialogOpen(true)}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        <span>Excluir</span>
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Descrição */}
              {photoData.caption && (
                <div className="p-3 md:p-4 border-b">
                  <p className="text-sm break-words">{photoData.caption}</p>
                </div>
              )}

              {/* Lista de comentários */}
              <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3 md:space-y-4">
                {comments.length === 0 ? (
                  <p className="text-center text-muted-foreground text-xs md:text-sm py-4">
                    Nenhum comentário ainda. Seja o primeiro a comentar!
                  </p>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} className="flex space-x-2">
                      <Avatar
                        className="h-6 w-6 cursor-pointer flex-shrink-0"
                        onClick={() => {
                          if (comment.user?.id) {
                            onClose();
                            router.push(`/user/${comment.user.id}`);
                          }
                        }}
                      >
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
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline space-x-2 flex-wrap">
                          <span
                            className="text-xs md:text-sm font-medium cursor-pointer hover:underline"
                            onClick={() => {
                              if (comment.user?.id) {
                                onClose();
                                router.push(`/user/${comment.user.id}`);
                              }
                            }}
                          >
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
                        <p className="text-xs md:text-sm break-words">
                          {comment.content}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Ações e formulário de comentário */}
              <div className="p-3 md:p-4 border-t">
                <div className="flex items-center space-x-4 mb-3 md:mb-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`flex items-center h-8 px-2 text-xs ${liked ? "text-red-500" : ""}`}
                    onClick={handleLikeClick}
                  >
                    <Heart
                      className={`h-4 w-4 mr-1 ${liked ? "fill-red-500" : ""}`}
                    />
                    {likesCount} {likesCount === 1 ? "Like" : "Likes"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center h-8 px-2 text-xs"
                  >
                    <MessageCircle className="h-4 w-4 mr-1" />
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
                    className="min-h-[50px] md:min-h-[60px] flex-1 text-xs md:text-sm"
                  />
                  <Button
                    type="submit"
                    size="icon"
                    className="h-8 w-8 md:h-10 md:w-10"
                    disabled={!comment.trim() || isSubmitting}
                  >
                    <Send className="h-3 w-3 md:h-4 md:w-4" />
                    <span className="sr-only">Enviar comentário</span>
                  </Button>
                </form>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-12 w-full">
            <p className="text-muted-foreground">Post não encontrado</p>
            <Button variant="outline" onClick={onClose} className="mt-4">
              Fechar
            </Button>
          </div>
        )}
      </div>

      {/* Diálogo de confirmação para exclusão */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent className="max-w-[90vw] md:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir post</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este post? Esta ação não pode ser
              desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel disabled={isDeleting}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePost}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Diálogo de edição de post */}
      {isEditDialogOpen && (
        <div onClick={(e) => e.stopPropagation()}>
          <EditPostDialog
            post={photoData}
            isOpen={isEditDialogOpen}
            onClose={() => setIsEditDialogOpen(false)}
            onPostUpdated={handlePostUpdated}
          />
        </div>
      )}
    </div>
  );
}
