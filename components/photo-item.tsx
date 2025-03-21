import api from "@/lib/api";
import Image from "next/image";
import { useState } from "react";

export function PhotoItem({ photo, onClick, innerRef }) {
  const [loaded, setLoaded] = useState(false);
  const imageUrl = `${api.defaults.baseURL}/posts/${photo.id}/download-image`;

  return (
    <div
      ref={innerRef}
      className="break-inside-avoid mb-4 cursor-pointer overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300"
      onClick={() => onClick(photo)}
    >
      <div className="relative w-full" style={{ paddingBottom: "100%" }}>
        <Image
          src={imageUrl}
          alt={photo.caption || "Foto"}
          fill
          onLoadingComplete={() => setLoaded(true)}
          className="object-cover"
          sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
        />
        {!loaded && (
          <div className="absolute inset-0 bg-gray-300 animate-pulse" />
        )}
      </div>
      <div className="p-2 bg-background">
        <h3 className="text-sm font-medium truncate">{photo.caption}</h3>
        <div className="flex space-x-2 text-xs text-muted-foreground">
          <span>{photo._count.likes} Likes</span>
          <span>{photo._count.comments} Comentários</span>
        </div>
      </div>
    </div>
  );
}
