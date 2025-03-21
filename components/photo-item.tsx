"use client";

import { useState, useEffect } from "react";
import { getImageUrl } from "@/lib/api";

interface PhotoItemProps {
  photo: any;
  onClick: (photo: any) => void;
  className?: string;
  innerRef?: (node: HTMLDivElement | null) => void;
}

export function PhotoItem({
  photo,
  onClick,
  className = "",
  innerRef,
}: PhotoItemProps) {
  const [loaded, setLoaded] = useState(false);
  const [imageUrl, setImageUrl] = useState("");

  useEffect(() => {
    // Construir a URL da imagem
    if (photo && photo.id) {
      setImageUrl(getImageUrl(photo.id));
    }
  }, [photo]);

  return (
    <div
      ref={innerRef}
      className={`${className} mb-4 break-inside-avoid`}
      onClick={() => onClick(photo)}
    >
      <div className="overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 bg-background cursor-pointer">
        {/* Container da imagem com proporção original */}
        <div className="relative w-full">
          {imageUrl && (
            <img
              src={imageUrl || "/placeholder.svg"}
              alt={photo.caption || "Foto"}
              onLoad={() => setLoaded(true)}
              className="w-full h-auto"
            />
          )}

          {/* Placeholder de carregamento */}
          {!loaded && <div className="w-full h-48 bg-gray-300 animate-pulse" />}
        </div>

        {/* Informações da foto com altura fixa */}
        <div className="p-3 h-[60px] flex flex-col justify-center">
          <h3 className="text-sm font-medium truncate mb-1">
            {photo.caption || "Sem título"}
          </h3>
          <div className="flex space-x-3 text-xs text-muted-foreground">
            <span>{photo._count?.likes || 0} Likes</span>
            <span>{photo._count?.comments || 0} Comentários</span>
          </div>
        </div>
      </div>
    </div>
  );
}
