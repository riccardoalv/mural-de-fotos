"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import PhotoModal from "@/components/photo-modal";
import api from "@/lib/api";
import { handleAddComment } from "@/lib/handleAddComment";
import { handleLike } from "@/lib/handleLike";
import { PhotoItem } from "./photo-item";
import { SkeletonLoader } from "./skeleton-loader";
import { useAuth } from "@/context/auth-context";

export default function PhotoGrid() {
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

  // Reset feed ao mudar auth
  useEffect(() => {
    setPhotos([]);
    setPage(1);
  }, [isAuthenticated]);

  useEffect(() => {
    const saved = localStorage.getItem("token");
    setToken(saved);
    setTokenLoaded(true);
  }, []);

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
    (node) => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setPage((prev) => prev + 1);
        }
      });

      if (node) observer.current.observe(node);
    },
    [loading, hasMore],
  );

  return (
    <>
      <div className="columns-1 sm:columns-2 md:columns-3 gap-4 space-y-4">
        {photos.map((photo, i) => (
          <PhotoItem
            key={`${photo.id}-${i}`}
            photo={photo}
            onClick={setSelectedPhoto}
            innerRef={i === photos.length - 1 ? lastPhotoElementRef : null}
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
          onAddComment={handleAddComment}
          onLike={handleLike}
        />
      )}
    </>
  );
}
