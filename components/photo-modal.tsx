"use client";

import type React from "react";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
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
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import api from "@/lib/api";
import { handleLike } from "@/lib/handleLike";
import { handleAddComment } from "@/lib/handleAddComment";
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

interface PostUser {
  id: string;
  name?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
}

interface PostCounts {
  likes?: number;
  comments?: number;
}

interface PostComment {
  id: string;
  content: string;
  createdAt: string;
  user?: PostUser | null;
}

interface PostMedia {
  id: string;
  order: number;
  imageUrl: string;
  isVideo: boolean;
  createdAt?: string;
  updatedAt?: string;
  postId?: string;
}

interface PhotoPost {
  id: string;
  caption?: string | null;
  createdAt?: string;
  user?: PostUser | null;
  _count?: PostCounts;
  comments?: PostComment[];
  Media?: PostMedia[];
}

interface MediaViewerProps {
  mediaUrl: string;
  isVideo: boolean;
  alt: string;
  isMobile: boolean;
  hasPrev?: boolean;
  hasNext?: boolean;
  onPrev?: () => void;
  onNext?: () => void;
  currentIndex?: number;
  total?: number;
}

function MediaViewer({
  mediaUrl,
  isVideo,
  alt,
  isMobile,
  hasPrev,
  hasNext,
  onPrev,
  onNext,
  currentIndex,
  total,
}: MediaViewerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  // 🔁 sempre que trocar de mídia, resetamos o loading e o erro
  useEffect(() => {
    setIsLoading(true);
    setImageError(false);
    setRetryKey((prev) => prev + 1);

    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
    setIsPlaying(false);
  }, [mediaUrl, isVideo, currentIndex]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying((prev) => !prev);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted((prev) => !prev);
  };

  const toggleFullscreen = () => {
    if (!videoContainerRef.current) return;
    if (!isFullscreen) {
      if (videoContainerRef.current.requestFullscreen) {
        videoContainerRef.current.requestFullscreen();
      }
    } else if (document.exitFullscreen) {
      document.exitFullscreen();
    }
    setIsFullscreen((prev) => !prev);
  };

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

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  const handleVideoLoad = () => {
    setIsLoading(false);
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    setImageError(true);
    setIsLoading(false);
    e.currentTarget.src = "/abstract-geometric-shapes.png";
  };

  const handleRetry = () => {
    setImageError(false);
    setIsLoading(true);
    setRetryKey((prev) => prev + 1);
  };

  return (
    <div
      className={`bg-black ${
        isMobile ? "h-[40vh]" : "flex-1"
      } flex items-center justify-center ${
        isMobile ? "" : "md:h-[calc(95vh-32px)] md:max-h-[95vh]"
      } relative`}
    >
      {/* contador tipo "1 / 3" */}
      {typeof currentIndex === "number" &&
        typeof total === "number" &&
        total > 1 && (
          <div className="absolute top-3 right-3 z-20 rounded-full bg-black/60 px-2 py-1 text-xs text-white">
            {currentIndex + 1} / {total}
          </div>
        )}

      {/* setas esquerda/direita */}
      {hasPrev && onPrev && (
        <button
          type="button"
          onClick={onPrev}
          className="absolute left-2 md:left-4 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
          aria-label="Mídia anterior"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      )}

      {hasNext && onNext && (
        <button
          type="button"
          onClick={onNext}
          className="absolute right-2 md:right-4 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
          aria-label="Próxima mídia"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      )}

      {/* overlay de loading (spinner) */}
      {isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/30">
          <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {isVideo ? (
        <div
          key={retryKey}
          ref={videoContainerRef}
          className={`relative w-full h-full flex items-center justify-center transition-opacity duration-300 ${
            isLoading ? "opacity-0" : "opacity-100"
          }`}
        >
          <video
            ref={videoRef}
            src={mediaUrl}
            className="max-h-full max-w-full"
            controls={false}
            muted={isMuted}
            playsInline
            onLoadedMetadata={handleVideoLoad}
            onClick={togglePlay}
          />
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
        </div>
      ) : (
        <div
          className={`w-full h-full flex items-center justify-center relative transition-opacity duration-300 ${
            isLoading ? "opacity-0" : "opacity-100"
          }`}
        >
          {imageError ? (
            <div className="flex flex-col items-center justify-center text-white p-4">
              <div className="text-red-500 mb-2 text-sm md:text-base">
                Erro ao carregar a imagem
              </div>
              <Button
                variant="outline"
                size={isMobile ? "sm" : "default"}
                onClick={handleRetry}
              >
                Tentar novamente
              </Button>
            </div>
          ) : (
            <img
              key={retryKey}
              src={mediaUrl || "/placeholder.svg"}
              alt={alt || "Foto"}
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
  );
}

interface HeaderSectionProps {
  post: PhotoPost;
  isOwner: boolean;
  isMobile: boolean;
  onNavigateToUser: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function HeaderSection({
  post,
  isOwner,
  isMobile,
  onNavigateToUser,
  onEdit,
  onDelete,
}: HeaderSectionProps) {
  return (
    <div className="p-3 md:p-4 border-b">
      <div className="flex flex-col gap-2">
        <div className="flex items-center space-x-2">
          <Avatar
            className="h-8 w-8 md:h-10 md:w-10 cursor-pointer flex-shrink-0"
            onClick={onNavigateToUser}
          >
            <AvatarImage
              src={
                post.user?.avatarUrl || "/placeholder.svg?height=40&width=40"
              }
              alt={post.user?.name || ""}
            />
            <AvatarFallback>
              {post.user?.name?.charAt(0).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center flex-wrap gap-1">
              <p
                className="text-sm font-medium cursor-pointer hover:underline truncate"
                onClick={onNavigateToUser}
              >
                {post.user?.name || "Usuário"}
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs text-primary"
                onClick={onNavigateToUser}
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Ver perfil
              </Button>
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              <Calendar className="h-3 w-3 mr-1 flex-shrink-0" />
              <span className="truncate">
                {post.createdAt &&
                  formatDistanceToNow(new Date(post.createdAt), {
                    addSuffix: true,
                    locale: ptBR,
                  })}
              </span>
            </div>
          </div>
        </div>
        {isOwner && (
          <div className="flex items-center gap-2 mt-1">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center text-primary h-8 px-2 text-xs flex-1"
              onClick={onEdit}
            >
              <Pencil className="h-3 w-3 mr-1" />
              <span>Editar</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center text-destructive hover:bg-destructive/10 h-8 px-2 text-xs flex-1"
              onClick={onDelete}
            >
              <Trash2 className="h-3 w-3 mr-1" />
              <span>Excluir</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

interface CommentsListProps {
  comments: PostComment[];
  onCloseModal: () => void;
  onNavigateToUser: (userId: string) => void;
}

function CommentsList({
  comments,
  onCloseModal,
  onNavigateToUser,
}: CommentsListProps) {
  if (comments.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3 md:space-y-4">
        <p className="text-center text-muted-foreground text-xs md:text-sm py-4">
          Nenhum comentário ainda. Seja o primeiro a comentar!
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3 md:space-y-4">
      {comments.map((comment) => (
        <div key={comment.id} className="flex space-x-2">
          <Avatar
            className="h-6 w-6 cursor-pointer flex-shrink-0"
            onClick={() => {
              if (comment.user?.id) {
                onCloseModal();
                onNavigateToUser(comment.user.id);
              }
            }}
          >
            <AvatarImage
              src={
                comment.user?.avatarUrl || "/placeholder.svg?height=24&width=24"
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
                    onCloseModal();
                    onNavigateToUser(comment.user.id);
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
            <p className="text-xs md:text-sm break-words">{comment.content}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

interface ActionsSectionProps {
  liked: boolean;
  likesCount: number;
  commentsCount: number;
  comment: string;
  isSubmitting: boolean;
  onLikeClick: () => void;
  onCommentChange: (value: string) => void;
  onSubmitComment: (e: React.FormEvent) => void;
}

function ActionsSection({
  liked,
  likesCount,
  commentsCount,
  comment,
  isSubmitting,
  onLikeClick,
  onCommentChange,
  onSubmitComment,
}: ActionsSectionProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim() || isSubmitting) return;
    onSubmitComment(e);
  };

  return (
    <div className="p-3 md:p-4 border-t">
      <div className="flex items-center space-x-4 mb-3 md:mb-4">
        <Button
          variant="ghost"
          size="sm"
          className={`flex items-center h-8 px-2 text-xs ${
            liked ? "text-red-500" : ""
          }`}
          onClick={onLikeClick}
        >
          <Heart className={`h-4 w-4 mr-1 ${liked ? "fill-red-500" : ""}`} />
          {likesCount} {likesCount === 1 ? "Like" : "Likes"}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center h-8 px-2 text-xs"
        >
          <MessageCircle className="h-4 w-4 mr-1" />
          {commentsCount} {commentsCount === 1 ? "Comentário" : "Comentários"}
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="flex space-x-2">
        <Textarea
          placeholder="Adicione um comentário..."
          value={comment}
          onChange={(e) => onCommentChange(e.target.value)}
          className="min-h-[50px] md:min-h-[60px] flex-1 text-xs md:text-sm"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (!comment.trim() || isSubmitting) return;
              onSubmitComment(e);
            }
          }}
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
  );
}

interface DeletePostDialogProps {
  open: boolean;
  isDeleting: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

function DeletePostDialog({
  open,
  isDeleting,
  onOpenChange,
  onConfirm,
}: DeletePostDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-[90vw] md:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir post</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir este post? Esta ação não pode ser
            desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? "Excluindo..." : "Excluir"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function PhotoModal({ postId, onClose, isOpen }: PhotoModalProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuth();
  const [token, setToken] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState<PostComment[]>([]);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [photoData, setPhotoData] = useState<PhotoPost | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);

  const isOwner = user && photoData?.user?.id === user.id;

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

  useEffect(() => {
    if (!isOpen || !postId) return;

    const fetchPhotoData = async () => {
      setIsLoading(true);
      try {
        const savedToken = localStorage.getItem("token");
        setToken(savedToken || null);

        const config = savedToken
          ? {
              headers: {
                Authorization: `Bearer ${savedToken}`,
              },
            }
          : undefined;

        const { data } = await api.get<PhotoPost>(`posts/${postId}`, config);

        setPhotoData(data);
        setComments(data.comments || []);
        const likes = data._count?.likes ?? 0;
        setLikesCount(likes);

        if (isAuthenticated && savedToken) {
          try {
            const likeResponse = await api.get(`posts/${postId}/liked`, {
              headers: {
                Authorization: `Bearer ${savedToken}`,
                accept: "*/*",
              },
            });
            setLiked(!!likeResponse.data);
          } catch {
            setLiked(false);
          }
        }

        // define mídia inicial: order = 1, senão índice 0
        const mediaList = (data.Media || [])
          .slice()
          .sort((a, b) => a.order - b.order);
        if (mediaList.length > 0) {
          const idx = mediaList.findIndex((m) => m.order === 1);
          setCurrentMediaIndex(idx >= 0 ? idx : 0);
        } else {
          setCurrentMediaIndex(0);
        }
      } catch (error) {
        console.error("Erro ao buscar dados da mídia:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPhotoData();
  }, [postId, isAuthenticated, isOpen]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;

    setIsSubmitting(true);
    try {
      if (!isAuthenticated) {
        router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
        return;
      }

      const result = await handleAddComment(
        postId,
        comment,
        isAuthenticated,
        token,
      );

      if (result) {
        const newComment: PostComment = {
          id: result.id,
          content: comment,
          createdAt: new Date().toISOString(),
          user: {
            id: user?.id as string,
            name: user?.name || "Usuário",
            avatarUrl: user?.avatarUrl,
          },
        };
        setComments((prev) => [newComment, ...prev]);
        setComment("");
        setPhotoData((prev) =>
          prev
            ? {
                ...prev,
                _count: {
                  ...prev._count,
                  comments: (prev._count?.comments || 0) + 1,
                },
              }
            : prev,
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLikeClick = async () => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    const result = await handleLike(postId, isAuthenticated, token);

    if (result) {
      const newLikedState = !liked;
      setLiked(newLikedState);
      setLikesCount((prev) => (newLikedState ? prev + 1 : prev - 1));
    }
  };

  const handleDeletePost = async () => {
    if (!token) return;
    setIsDeleting(true);
    try {
      await api.delete(`/posts/${postId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      onClose();
      router.push("/");
    } catch (error) {
      console.error("Erro ao excluir post:", error);
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  const handlePostUpdated = (updatedPost: PhotoPost) => {
    setPhotoData(updatedPost);
    // se quiser, pode reajustar currentMediaIndex aqui com base no updatedPost.Media
    setIsEditDialogOpen(false);
  };

  const navigateToUserProfile = useCallback(
    (userId?: string) => {
      if (!userId) return;
      onClose();
      router.push(`/user/${userId}`);
    },
    [onClose, router],
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
      // opcional: navegação por teclado entre mídias
      if (e.key === "ArrowRight") {
        setCurrentMediaIndex((prev) => {
          const mediaList = (photoData?.Media || [])
            .slice()
            .sort((a, b) => a.order - b.order);
          if (!mediaList.length) return prev;
          return Math.min(prev + 1, mediaList.length - 1);
        });
      }
      if (e.key === "ArrowLeft") {
        setCurrentMediaIndex((prev) => Math.max(prev - 1, 0));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, photoData?.Media]);

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

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (isEditDialogOpen) return;
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  const mediaList = useMemo(() => {
    return (photoData?.Media || []).slice().sort((a, b) => a.order - b.order);
  }, [photoData]);

  const hasMedia = mediaList.length > 0;
  const currentMedia =
    hasMedia && currentMediaIndex >= 0 && currentMediaIndex < mediaList.length
      ? mediaList[currentMediaIndex]
      : null;

  const hasPrev = hasMedia && currentMediaIndex > 0;
  const hasNext = hasMedia && currentMediaIndex < mediaList.length - 1;

  const handleNextMedia = useCallback(() => {
    if (!hasNext) return;
    setCurrentMediaIndex((prev) => Math.min(prev + 1, mediaList.length - 1));
  }, [hasNext, mediaList.length]);

  const handlePrevMedia = useCallback(() => {
    if (!hasPrev) return;
    setCurrentMediaIndex((prev) => Math.max(prev - 1, 0));
  }, [hasPrev]);

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
            <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : photoData ? (
          <>
            {currentMedia ? (
              <MediaViewer
                mediaUrl={currentMedia.imageUrl}
                isVideo={currentMedia.isVideo}
                alt={photoData.caption || "Foto"}
                isMobile={isMobile}
                hasPrev={hasPrev}
                hasNext={hasNext}
                onPrev={handlePrevMedia}
                onNext={handleNextMedia}
                currentIndex={currentMediaIndex}
                total={mediaList.length}
              />
            ) : (
              <div className="flex-1 flex items-center justify-center bg-black text-white">
                Nenhuma mídia para este post.
              </div>
            )}

            <div
              className={`flex flex-col border-t md:border-t-0 md:border-l w-full ${
                isMobile ? "h-[55vh]" : "md:w-[350px] lg:w-[450px]"
              } bg-background overflow-hidden`}
            >
              <HeaderSection
                post={photoData}
                isOwner={!!isOwner}
                isMobile={isMobile}
                onNavigateToUser={() =>
                  navigateToUserProfile(photoData.user?.id)
                }
                onEdit={() => setIsEditDialogOpen(true)}
                onDelete={() => setIsDeleteDialogOpen(true)}
              />

              {photoData.caption && (
                <div className="p-3 md:p-4 border-b">
                  <p className="text-sm break-words">{photoData.caption}</p>
                </div>
              )}

              <CommentsList
                comments={comments}
                onCloseModal={onClose}
                onNavigateToUser={(id) => navigateToUserProfile(id)}
              />

              <ActionsSection
                liked={liked}
                likesCount={likesCount}
                commentsCount={photoData._count?.comments || 0}
                comment={comment}
                isSubmitting={isSubmitting}
                onLikeClick={handleLikeClick}
                onCommentChange={setComment}
                onSubmitComment={handleSubmitComment}
              />
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

      <DeletePostDialog
        open={isDeleteDialogOpen}
        isDeleting={isDeleting}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDeletePost}
      />

      {isEditDialogOpen && photoData && (
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
