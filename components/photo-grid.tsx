"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";
import PhotoModal from "@/components/photo-modal";
import api from "@/lib/api";
import { PhotoItem } from "@/components/photo-item";
import { SkeletonLoader } from "@/components/skeleton-loader";
import { useAuth } from "@/context/auth-context";
import { useIsClient } from "@/hooks/use-is-client";

export default function PhotoGrid() {
  const isClient = useIsClient();
  const { user } = useAuth();
  const isAuthenticated = Boolean(user);
  const [token, setToken] = useState<string | null>(null);
  const [photos, setPhotos] = useState<any[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const observer = useRef<IntersectionObserver>();
  const [tokenLoaded, setTokenLoaded] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setPhotos([]);
    setPage(1);
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isClient) return;

    const saved = localStorage.getItem("token");
    setToken(saved);
    setTokenLoaded(true);
  }, [isClient]);

  useEffect(() => {
    if (!tokenLoaded) return;

    const load = async () => {
      setLoading(true);
      try {
        const url = `posts?limit=10&page=${page}`;
        const config =
          isAuthenticated && token
            ? {
              headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
            }
            : undefined;

        const { data } = await api.get(url, config);
        setPhotos((prev) => [...prev, ...data.data]);
        setHasMore(data.data.length === 10);
      } catch (error) {
        console.error("Erro ao buscar fotos:", error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [page, isAuthenticated, token, tokenLoaded]);

  const lastPhotoElementRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (!isClient || loading) return;
      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setPage((prev) => prev + 1);
        }
      });

      if (node) observer.current.observe(node);
    },
    [loading, hasMore, isClient],
  );

  return (
    <>
      <div className="masonry-grid px-2">
        {photos.map((photo, i) => (
          <PhotoItem
            key={`${photo.id}-${i}`}
            photo={photo}
            onClick={setSelectedPhoto}
            innerRef={i === photos.length - 1 ? lastPhotoElementRef : null}
            className="masonry-item mb-4"
          />
        ))}
      </div>

      {loading && (
        <div className="flex justify-center py-4">
          <div className="loader">Carregando...</div>
        </div>
      )}
      {!loading && photos.length === 0 && <SkeletonLoader />}

      {selectedPhoto && (
        <PhotoModal
          photo={selectedPhoto}
          onClose={() => setSelectedPhoto(null)}
        />
      )}

      <style jsx>{`
        .masonry-grid {
          display: grid;
          grid-template-columns: repeat(1, 1fr);
          grid-gap: 20px;
          grid-auto-rows: 10px;
        }

        @media (min-width: 640px) {
          .masonry-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (min-width: 1024px) {
          .masonry-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        .masonry-item {
          grid-row-end: span var(--row-span, 30);
        }
      `}</style>
    </>
  );
}
