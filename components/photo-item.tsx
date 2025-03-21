"use client";

import type React from "react";

import { useState, useEffect, useRef } from "react";
import api from "@/lib/api";
import { useIsClient } from "@/hooks/use-is-client";

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
  const isClient = useIsClient();
  const [loaded, setLoaded] = useState(false);
  const [rowSpan, setRowSpan] = useState(30); // Default row span
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const imageUrl = `${api.defaults.baseURL}/posts/${photo.id}/download-image`;

  // Calculate the height of the container and set the appropriate row span
  const calculateRowSpan = () => {
    if (containerRef.current) {
      const height = containerRef.current.clientHeight;
      const span = Math.ceil(height / 10); // 10px is the grid-auto-rows value
      setRowSpan(span);
    }
  };

  // Handle image load to get natural dimensions
  const handleImageLoad = () => {
    if (imageRef.current) {
      setLoaded(true);
      // Use setTimeout to ensure the image has rendered completely
      setTimeout(calculateRowSpan, 100);
    }
  };

  useEffect(() => {
    if (!isClient) return;

    // Set up resize observer to recalculate on window resize
    const resizeObserver = new ResizeObserver(() => {
      if (loaded) calculateRowSpan();
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [loaded, isClient]);

  return (
    <div
      ref={innerRef}
      className={`${className} cursor-pointer`}
      style={
        isClient
          ? ({ "--row-span": rowSpan } as React.CSSProperties)
          : undefined
      }
      onClick={() => onClick(photo)}
    >
      <div
        ref={containerRef}
        className="overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 bg-background"
      >
        <div className="relative w-full">
          {/* Image container with dynamic aspect ratio */}
          <img
            ref={imageRef}
            src={imageUrl || "/placeholder.svg"}
            alt={photo.caption || "Foto"}
            onLoad={handleImageLoad}
            className="w-full h-auto"
          />

          {!loaded && (
            <div className="absolute inset-0 bg-gray-300 animate-pulse" />
          )}
        </div>
        <div className="p-2 bg-background">
          <h3 className="text-sm font-medium truncate">
            {photo.caption || "Sem título"}
          </h3>
          <div className="flex space-x-2 text-xs text-muted-foreground">
            <span>{photo._count?.likes || 0} Likes</span>
            <span>{photo._count?.comments || 0} Comentários</span>
          </div>
        </div>
      </div>
    </div>
  );
}
