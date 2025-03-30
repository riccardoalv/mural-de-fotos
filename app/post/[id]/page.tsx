"use client";

import type React from "react";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Heart,
  MessageCircle,
  Send,
  ArrowLeft,
  Calendar,
  Volume2,
  VolumeX,
  Maximize,
  Pause,
  Play,
  Pencil,
  Trash2,
  ExternalLink,
} from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import api from "@/lib/api";
import { handleLike } from "@/lib/handleLike";
import { handleAddComment } from "@/lib/handleAddComment";
import { getImageUrl } from "@/lib/api";
import Header from "@/components/header";
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

export default function PostPage() {
  const { id } = useParams();
  const router = useRouter();
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
  const [imageError, setImageError] = useState(false);

  // Verificar se o usuário atual é o proprietário do post
  const isOwner = user && photoData?.user?.id === user.id;

  // Atualizar o título da página
  useEffect(() => {
    if (photoData?.caption) {
      document.title = `${photoData.caption} | Mural de Fotos`;
    } else {
      document.title = "Mural de Fotos";
    }
  }, [photoData]);

  // Buscar dados completos da foto/vídeo
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

        // Buscar dados completos da foto/vídeo
        const { data } = await api.get(`posts/${id}`, config);

        setPhotoData(data);
        setComments(data.comments || []);
        setLikesCount(data._count?.likes || 0);

        // Verificar se é um vídeo com base na propriedade isVideo do post
        setIsVideo(!!data.isVideo);

        try {
          // Usar getImageUrl para ambos os tipos de mídia
          const url = getImageUrl(id as string);
          setMediaUrl(url);
        } catch (error) {
          // Fallback to direct URL construction
          setMediaUrl(`${api.defaults.baseURL}/posts/${id}/download-image`);
        }

        // Verificar se o usuário atual curtiu a foto usando o endpoint específico
        if (isAuthenticated && savedToken) {
          try {
            const likeResponse = await api.get(`posts/${id}/liked`, {
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

    if (id) {
      fetchPhotoData();
    }
  }, [id, isAuthenticated]);

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
      const currentPath = `/post/${id}`;

      // Verificar autenticação diretamente aqui
      if (!isAuthenticated) {
        router.push(`/login?redirect=${encodeURIComponent(currentPath)}`);
        return;
      }

      // Chamar a função utilitária sem passar o router
      const result = await handleAddComment(
        id as string,
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
    const currentPath = `/post/${id}`;

    // Verificar autenticação diretamente aqui
    if (!isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent(currentPath)}`);
      return;
    }

    // Chamar a função utilitária sem passar o router
    const result = await handleLike(id as string, isAuthenticated, token);

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
      await api.delete(`/posts/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Redirecionar para a página inicial
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
      router.push(`/user/${photoData.user.id}`);
    }
  };

  // Função para voltar preservando a posição de rolagem
  const handleBack = () => {
    router.back();
  };

  // Adicione esta função para lidar com erros de carregamento da imagem
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    console.error("Erro ao carregar a imagem:", mediaUrl);
    setImageError(true);
    // Set a fallback image
    e.currentTarget.src = "/placeholder.svg?height=400&width=400";
  };

  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-6">
        <Button variant="ghost" onClick={handleBack} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>

        {isLoading ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : photoData ? (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 max-w-6xl mx-auto">
            {/* Conteúdo da mídia - Imagem ou Vídeo */}
            <div className="lg:col-span-3 bg-black rounded-lg overflow-hidden flex items-center justify-center">
              {isVideo ? (
                <div
                  ref={videoContainerRef}
                  className="relative w-full aspect-video flex items-center justify-center"
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
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center items-center gap-4 px-4">
                    <div className="bg-black/60 rounded-full p-2 backdrop-blur-sm flex items-center gap-3">
                      <button
                        onClick={togglePlay}
                        className="text-white hover:text-primary transition-colors"
                        aria-label={isPlaying ? "Pausar" : "Reproduzir"}
                      >
                        {isPlaying ? (
                          <Pause className="h-5 w-5" />
                        ) : (
                          <Play className="h-5 w-5" />
                        )}
                      </button>

                      <button
                        onClick={toggleMute}
                        className="text-white hover:text-primary transition-colors"
                        aria-label={isMuted ? "Ativar som" : "Desativar som"}
                      >
                        {isMuted ? (
                          <VolumeX className="h-5 w-5" />
                        ) : (
                          <Volume2 className="h-5 w-5" />
                        )}
                      </button>

                      <button
                        onClick={toggleFullscreen}
                        className="text-white hover:text-primary transition-colors"
                        aria-label="Tela cheia"
                      >
                        <Maximize className="h-5 w-5" />
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
                <div className="w-full">
                  <img
                    src={mediaUrl || "/placeholder.svg"}
                    alt={photoData.caption || "Foto"}
                    className="w-full h-auto object-contain"
                    onLoad={handleImageLoad}
                    onError={handleImageError}
                    crossOrigin="anonymous"
                  />
                </div>
              )}
            </div>

            {/* Comentários e informações - Versão para desktop */}
            <div className="lg:col-span-2 flex flex-col border rounded-lg overflow-hidden hidden lg:flex">
              {/* Cabeçalho */}
              <div className="p-4 border-b flex items-center space-x-2">
                <Avatar
                  className="h-10 w-10 cursor-pointer"
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
                <div className="flex-1">
                  <div className="flex items-center">
                    <p
                      className="text-sm font-medium cursor-pointer hover:underline"
                      onClick={navigateToUserProfile}
                    >
                      {photoData.user?.name || "Usuário"}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-2 h-7 px-2 text-xs text-primary"
                      onClick={navigateToUserProfile}
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Ver perfil
                    </Button>
                  </div>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3 mr-1" />
                    {photoData.createdAt &&
                      formatDistanceToNow(new Date(photoData.createdAt), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                  </div>
                </div>

                {/* Botões de ação (apenas para o proprietário) */}
                {isOwner && (
                  <div className="flex items-center gap-2 ml-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center text-primary"
                      onClick={() => setIsEditDialogOpen(true)}
                    >
                      <Pencil className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center text-destructive hover:bg-destructive/10"
                      onClick={() => setIsDeleteDialogOpen(true)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Excluir
                    </Button>
                  </div>
                )}
              </div>

              {/* Descrição */}
              {photoData.caption && (
                <div className="p-4 border-b">
                  <p className="text-sm">{photoData.caption}</p>
                </div>
              )}

              {/* Lista de comentários */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[400px]">
                {comments.length === 0 ? (
                  <p className="text-center text-muted-foreground text-sm py-4">
                    Nenhum comentário ainda. Seja o primeiro a comentar!
                  </p>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} className="flex space-x-2">
                      <Avatar
                        className="h-6 w-6 cursor-pointer"
                        onClick={() =>
                          comment.user?.id &&
                          router.push(`/user/${comment.user.id}`)
                        }
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
                      <div>
                        <div className="flex items-baseline space-x-2">
                          <span
                            className="text-sm font-medium cursor-pointer hover:underline"
                            onClick={() =>
                              comment.user?.id &&
                              router.push(`/user/${comment.user.id}`)
                            }
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
            </div>

            {/* Versão mobile - Comentários e informações */}
            <div className="lg:hidden w-full border rounded-lg overflow-hidden">
              {/* Cabeçalho */}
              <div className="p-4 border-b">
                <div className="flex items-center space-x-2 mb-3">
                  <Avatar
                    className="h-8 w-8 cursor-pointer"
                    onClick={navigateToUserProfile}
                  >
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
                  <div className="flex-1">
                    <div className="flex items-center">
                      <p
                        className="text-sm font-medium cursor-pointer hover:underline"
                        onClick={navigateToUserProfile}
                      >
                        {photoData.user?.name || "Usuário"}
                      </p>
                    </div>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3 mr-1" />
                      {photoData.createdAt &&
                        formatDistanceToNow(new Date(photoData.createdAt), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                    </div>
                  </div>
                </div>

                {/* Descrição */}
                {photoData.caption && (
                  <p className="text-sm mb-3">{photoData.caption}</p>
                )}

                {/* Ações */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`flex items-center ${liked ? "text-red-500" : ""}`}
                      onClick={handleLikeClick}
                    >
                      <Heart
                        className={`h-5 w-5 mr-1 ${liked ? "fill-red-500" : ""}`}
                      />
                      {likesCount}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex items-center"
                    >
                      <MessageCircle className="h-5 w-5 mr-1" />
                      {photoData._count?.comments || 0}
                    </Button>
                  </div>

                  {/* Botões de ação (apenas para o proprietário) */}
                  {isOwner && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center text-primary"
                        onClick={() => setIsEditDialogOpen(true)}
                      >
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Editar</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center text-destructive hover:bg-destructive/10"
                        onClick={() => setIsDeleteDialogOpen(true)}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Excluir</span>
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Lista de comentários */}
              <div className="p-4 space-y-4 max-h-[300px] overflow-y-auto">
                <h3 className="font-medium text-sm mb-2">Comentários</h3>
                {comments.length === 0 ? (
                  <p className="text-center text-muted-foreground text-sm py-2">
                    Nenhum comentário ainda. Seja o primeiro a comentar!
                  </p>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} className="flex space-x-2">
                      <Avatar
                        className="h-6 w-6 cursor-pointer"
                        onClick={() =>
                          comment.user?.id &&
                          router.push(`/user/${comment.user.id}`)
                        }
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
                      <div>
                        <div className="flex items-baseline space-x-2">
                          <span
                            className="text-sm font-medium cursor-pointer hover:underline"
                            onClick={() =>
                              comment.user?.id &&
                              router.push(`/user/${comment.user.id}`)
                            }
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
                        <p className="text-sm">{comment.content}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Formulário de comentário */}
              <div className="p-4 border-t">
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
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Post não encontrado</p>
            <Button
              variant="outline"
              onClick={() => router.push("/")}
              className="mt-4"
            >
              Voltar para o início
            </Button>
          </div>
        )}
      </main>

      {/* Diálogo de confirmação para exclusão */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir post</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este post? Esta ação não pode ser
              desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
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
        <EditPostDialog
          post={photoData}
          isOpen={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)}
          onPostUpdated={handlePostUpdated}
        />
      )}
    </>
  );
}
