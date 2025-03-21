"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import PhotoModal from "@/components/photo-modal";
import api from "@/lib/api";
import { handleAddComment } from "@/lib/handleAddComment";
import { handleLike } from "@/lib/handleLike";
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
    setLoading(true);
    const url = `posts?limit=10&page=${page}`;
    const config =
      isAuthenticated && token
        ? { headers: { Authorization: `Bearer ${token}` } }
        : undefined;

    api
      .get(url, config)
      .then(({ data }) => {
        setPhotos((prev) => [...prev, ...data.data]);
        setHasMore(data.data.length === 10);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page, isAuthenticated, token, tokenLoaded]);

  const lastRef = useCallback(
    (node) => {
      if (loading) return;
      observer.current?.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) setPage((p) => p + 1);
      });
      if (node) observer.current.observe(node);
    },
    [loading, hasMore],
  );

  return (
    <>
      <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-2">
        {photos.map((photo, i) => (
          <div
            key={photo.id}
            ref={i === photos.length - 1 ? lastRef : null}
            className="mb-2 break-inside-avoid cursor-pointer"
            onClick={() => setSelectedPhoto(photo)}
          >
            <img
              src={`${api.defaults.baseURL}/posts/${photo.id}/download-image`}
              alt={photo.caption ?? "Foto"}
              className="w-full h-auto object-contain"
            />
          </div>
        ))}
      </div>

      {loading && (
        <div className="flex justify-center py-4">
          <div className="loader">Carregando...</div>
        </div>
      )}

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
