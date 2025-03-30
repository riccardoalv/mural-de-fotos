"use client";

import type React from "react";

import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getImageUrl } from "@/lib/api";
import { Heart, MessageCircle, User, Play } from "lucide-react";
import api from "@/lib/api";

interface PhotoItemProps {
  photo: any;
  onClick?: (photo: any) => void;
  className?: string;
  innerRef?: (node: HTMLDivElement | null) => void;
}

export function PhotoItem({
  photo,
  onClick,
  className = "",
  innerRef,
}: PhotoItemProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [mediaUrl, setMediaUrl] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [aspectRatio, setAspectRatio] = useState<number | null>(null); // Inicialmente null
  const [isHorizontal, setIsHorizontal] = useState(false);
  const [isVeryHorizontal, setIsVeryHorizontal] = useState(false);
  const [isVertical, setIsVertical] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isVideo, setIsVideo] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // Definir isMounted após a montagem do componente para evitar problemas de hidratação
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (photo && photo.id) {
      // Verificar se é um vídeo com base na propriedade isVideo do post
      setIsVideo(!!photo.isVideo);

      try {
        // Usar getImageUrl para ambos os tipos de mídia
        const url = getImageUrl(photo.id);
        console.log("URL da mídia para item:", photo.id, url);
        setMediaUrl(url);
      } catch (error) {
        console.error("Erro ao gerar URL da mídia:", error, photo.id);
        // Fallback to a direct URL if needed
        setMediaUrl(`${api.defaults.baseURL}/posts/${photo.id}/download-image`);
      }
    }
  }, [photo]);

  // Detectar quando a mídia carrega
  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    setIsLoading(false);
    const img = e.currentTarget;

    // Calcular o aspect ratio
    if (img.naturalWidth && img.naturalHeight) {
      const ratio = img.naturalWidth / img.naturalHeight;
      setAspectRatio(ratio);

      // Determinar se a imagem é horizontal (paisagem)
      setIsHorizontal(ratio > 1.3);

      // Determinar se a imagem é muito horizontal (panorâmica)
      setIsVeryHorizontal(ratio > 1.8);

      // Determinar se a imagem é vertical (retrato)
      setIsVertical(ratio < 0.8);
    }
  };

  const handleVideoLoad = () => {
    setIsLoading(false);

    if (videoRef.current) {
      const video = videoRef.current;
      const ratio = video.videoWidth / video.videoHeight;

      setAspectRatio(ratio);
      setIsHorizontal(ratio > 1.3);
      setIsVeryHorizontal(ratio > 1.8);
      setIsVertical(ratio < 0.8);
    }
  };

  // Add error handling for image loading
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    console.error("Erro ao carregar imagem:", mediaUrl);
    setIsLoading(false);
    // You could set a fallback image here if needed
    e.currentTarget.src = "/placeholder.svg?height=400&width=400";
  };

  // Valor padrão para aspect ratio até que a mídia carregue
  const defaultAspectRatio = 1.5;

  // Determinar a classe de destaque com base no aspect ratio
  const getHighlightClass = () => {
    if (!isMounted) return "";

    // Apenas destacar imagens muito horizontais (panorâmicas)
    if (isVeryHorizontal) {
      return "very-horizontal-photo";
    }

    // Para imagens moderadamente horizontais, aplicar um destaque mais sutil
    if (isHorizontal) {
      return "horizontal-photo";
    }

    // Para imagens verticais
    if (isVertical) {
      return "vertical-photo";
    }

    return "";
  };

  // Função para salvar a posição de rolagem atual antes de navegar
  const handlePhotoClick = (e: React.MouseEvent) => {
    // Salvar a posição de rolagem atual no localStorage com um identificador único
    if (typeof window !== "undefined") {
      localStorage.setItem("scrollPosition_home", window.scrollY.toString());
    }

    // Se não for clique com botão direito, abrir o modal
    if (e.button !== 2) {
      e.preventDefault();
      // Atualizar a URL com o parâmetro post
      const url = new URL(window.location.href);
      url.searchParams.set("post", photo.id);
      window.history.pushState({}, "", url.toString());
    }
    // Clique com botão direito segue o comportamento padrão (abrir em nova aba)
  };

  return (
    <div
      ref={innerRef}
      className={`${className} photo-item ${getHighlightClass()}`}
    >
      <a
        href={`/?post=${photo.id}`}
        onClick={handlePhotoClick}
        className="block h-full"
      >
        <div
          ref={containerRef}
          className="relative overflow-hidden rounded-lg shadow-md hover:shadow-lg transition-all duration-300 bg-background cursor-pointer group h-full"
        >
          {/* Conteúdo da mídia */}
          <div
            className="relative w-full overflow-hidden"
            style={{
              // Usar string para evitar problemas de hidratação
              aspectRatio: isMounted
                ? (aspectRatio || defaultAspectRatio).toString()
                : defaultAspectRatio.toString(),
              // Limitar altura máxima para fotos verticais
              ...(isVertical && { maxHeight: "min(70vh, 600px)" }),
            }}
          >
            {isLoading && (
              <div className="absolute inset-0 bg-gray-200 dark:bg-gray-800 animate-pulse" />
            )}

            {isVideo ? (
              <>
                {/* Thumbnail para vídeo (usando o primeiro frame) */}
                <div className="w-full h-full relative">
                  <video
                    ref={videoRef}
                    src={mediaUrl}
                    className="w-full h-full object-cover"
                    onLoadedMetadata={handleVideoLoad}
                    muted
                    preload="metadata"
                  />

                  {/* Overlay de play para indicar que é um vídeo */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors">
                    <div className="w-12 h-12 rounded-full bg-white/80 flex items-center justify-center">
                      <Play className="h-6 w-6 text-gray-800 ml-1" />
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <img
                ref={imgRef}
                src={mediaUrl || "/placeholder.svg?height=400&width=400"}
                alt={photo.caption || "Foto"}
                className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${isLoading ? "opacity-0" : "opacity-100"}`}
                onLoad={handleImageLoad}
                onError={handleImageError}
                loading="lazy"
                crossOrigin="anonymous"
              />
            )}

            {/* Contadores (sempre visíveis) */}
            {isMounted && (
              <div className="absolute bottom-2 right-2 flex items-center gap-2 text-white text-xs z-10">
                <div className="flex items-center gap-1 bg-black/60 rounded-full px-2 py-1">
                  <Heart className="h-3 w-3" />
                  <span>{photo._count?.likes || 0}</span>
                </div>

                <div className="flex items-center gap-1 bg-black/60 rounded-full px-2 py-1">
                  <MessageCircle className="h-3 w-3" />
                  <span>{photo._count?.comments || 0}</span>
                </div>
              </div>
            )}

            {/* Informações completas (visíveis apenas no hover) */}
            {isMounted && (
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3 text-white">
                <div className="mb-1 font-medium text-sm line-clamp-2">
                  {photo.caption || "Sem título"}
                </div>

                <div className="flex items-center text-xs mb-8">
                  <User className="h-3 w-3 mr-1" />
                  <span className="truncate max-w-[100px]">
                    {photo.user?.name || "Usuário"}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </a>

      {/* Estilo para fotos horizontais e verticais */}
      <style jsx>{`
        /* Estilo para fotos moderadamente horizontais */
        .horizontal-photo {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        /* Estilo para fotos muito horizontais (panorâmicas) */
        .very-horizontal-photo {
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
        }

        /* Estilo para fotos verticais */
        .vertical-photo {
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.08);
        }
      `}</style>
    </div>
  );
}
