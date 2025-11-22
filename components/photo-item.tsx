"use client";

import type React from "react";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Heart, MessageCircle, User, Play, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface PhotoCounts {
  likes?: number;
  comments?: number;
  Media?: number;
}

interface PhotoUser {
  name?: string;
}

export interface Photo {
  id: string;
  caption?: string;
  isVideo?: boolean;
  _count?: PhotoCounts;
  user?: PhotoUser;
  imageUrl: string;
}

interface PhotoItemProps {
  photo: Photo;
  onClick?: (photo: Photo) => void;
  className?: string;
  innerRef?: (node: HTMLDivElement | null) => void;
  useDirectLink?: boolean;
}

const DEFAULT_ASPECT_RATIO = 1.5;

type Orientation = "horizontal" | "very-horizontal" | "vertical" | null;

export function PhotoItem({
  photo,
  onClick,
  className,
  innerRef,
  useDirectLink = false,
}: PhotoItemProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [mediaUrl, setMediaUrl] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [aspectRatio, setAspectRatio] = useState<number | null>(null);
  const [orientation, setOrientation] = useState<Orientation>(null);
  const [isVideo, setIsVideo] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const likeCount = photo._count?.likes ?? 0;
  const commentCount = photo._count?.comments ?? 0;
  const mediaCount = photo._count?.Media ?? 0;
  const caption = photo.caption || "Sem título";
  const userName = photo.user?.name || "Usuário";

  const href = useDirectLink ? `/post/${photo.id}` : `/?post=${photo.id}`;

  useEffect(() => {
    setIsVideo(Boolean(photo.isVideo));
    if (!photo.id) return;

    try {
      const url = photo.imageUrl;
      console.log(photo);
      setMediaUrl(url);
    } catch {
      setMediaUrl("");
    }
  }, [photo.id, photo.isVideo, photo.imageUrl]);

  const updateOrientation = useCallback((ratio: number) => {
    setAspectRatio(ratio);

    if (ratio > 1.8) {
      setOrientation("very-horizontal");
    } else if (ratio > 1.3) {
      setOrientation("horizontal");
    } else if (ratio < 0.8) {
      setOrientation("vertical");
    } else {
      setOrientation(null);
    }
  }, []);

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    setIsLoading(false);
    const img = e.currentTarget;
    if (!img.naturalWidth || !img.naturalHeight) return;

    const ratio = img.naturalWidth / img.naturalHeight;
    updateOrientation(ratio);
  };

  const handleVideoLoad = () => {
    setIsLoading(false);
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) return;

    const ratio = video.videoWidth / video.videoHeight;
    updateOrientation(ratio);
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    setIsLoading(false);
    e.currentTarget.src = "";
  };

  const handlePhotoClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("scrollPosition_home", window.scrollY.toString());
    }

    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

    e.preventDefault();
    onClick?.(photo);

    if (useDirectLink) {
      router.push(`/post/${photo.id}`, { scroll: false });
      return;
    }

    const searchParams = new URLSearchParams(window.location.search);
    searchParams.set("post", photo.id);
    const url = `${pathname}?${searchParams.toString()}`;
    router.push(url, { scroll: false });
  };

  const highlightClass = useMemo(() => {
    if (orientation === "very-horizontal") return "shadow-lg";
    if (orientation === "horizontal") return "shadow-md";
    if (orientation === "vertical") return "shadow-md";
    return "";
  }, [orientation]);

  const effectiveAspectRatio = (aspectRatio || DEFAULT_ASPECT_RATIO).toString();

  if (!photo.id) return null;

  return (
    <div ref={innerRef} className={cn("photo-item", highlightClass, className)}>
      <a href={href} onClick={handlePhotoClick} className="block h-full">
        <div className="relative h-full cursor-pointer overflow-hidden rounded-lg bg-background shadow-md transition-all duration-300 hover:shadow-lg">
          <div
            className="relative w-full overflow-hidden"
            style={{
              aspectRatio: effectiveAspectRatio,
              ...(orientation === "vertical" && {
                maxHeight: "min(70vh, 600px)",
              }),
            }}
          >
            {isLoading && (
              <div className="absolute inset-0 animate-pulse bg-gray-200 dark:bg-gray-800" />
            )}

            {isVideo ? (
              <div className="relative h-full w-full">
                <video
                  ref={videoRef}
                  src={mediaUrl}
                  className="h-full w-full object-cover"
                  onLoadedMetadata={handleVideoLoad}
                  muted
                  preload="metadata"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 transition-colors group-hover:bg-black/40">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/80">
                    <Play className="ml-1 h-6 w-6 text-gray-800" />
                  </div>
                </div>
              </div>
            ) : (
              <img
                ref={imgRef}
                src={mediaUrl || "/placeholder.svg?height=400&width=400"}
                alt={caption}
                className={cn(
                  "h-full w-full object-cover transition-transform duration-500",
                  isLoading ? "opacity-0" : "opacity-100",
                  "group-hover:scale-105",
                )}
                onLoad={handleImageLoad}
                onError={handleImageError}
                loading="lazy"
                crossOrigin="anonymous"
              />
            )}

            <div className="absolute bottom-2 right-2 z-10 flex items-center gap-2 text-xs text-white">
              <div className="flex items-center gap-1 rounded-full bg-black/60 px-2 py-1">
                <Heart className="h-3 w-3" />
                <span>{likeCount}</span>
              </div>
              <div className="flex items-center gap-1 rounded-full bg-black/60 px-2 py-1">
                <MessageCircle className="h-3 w-3" />
                <span>{commentCount}</span>
              </div>
              <div className="flex items-center gap-1 rounded-full bg-black/60 px-2 py-1">
                <ImageIcon className="h-3 w-3" />
                <span>{mediaCount}</span>
              </div>
            </div>

            <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/80 via-black/50 to-transparent p-3 text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              <div className="mb-1 line-clamp-2 text-sm font-medium">
                {caption}
              </div>
              <div className="mb-8 flex items-center text-xs">
                <User className="mr-1 h-3 w-3" />
                <span className="max-w-[100px] truncate">{userName}</span>
              </div>
            </div>
          </div>
        </div>
      </a>
    </div>
  );
}
