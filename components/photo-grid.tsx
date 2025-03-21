"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import PhotoModal from "@/components/photo-modal";
import api from "@/lib/api";
import { handleAddComment } from "@/lib/handleAddComment";
import { handleLike } from "@/lib/handleLike";
import { PhotoItem } from "./photo-item";
import { SkeletonLoader } from "./skeleton-loader";

export default function PhotoGrid() {
  const [photos, setPhotos] = useState([]);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const observer = useRef();

  const fetchPhotos = async () => {
    setLoading(true);
    try {
      const response = await api.get(`posts?limit=10&page=${page}`);
      const data = response.data.data;
      setPhotos((prevPhotos) => [...prevPhotos, ...data]);
      setHasMore(data.length === 10);
      setPage((prevPage) => prevPage + 1);
    } catch (error) {
      console.error("Erro ao buscar fotos:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPhotos();
  }, []);

  const lastPhotoElementRef = useCallback(
    (node) => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          fetchPhotos();
        }
      });
      if (node) observer.current.observe(node);
    },
    [loading, hasMore],
  );

  return (
    <>
      {/* Layout tipo Masonry (estilo Pinterest) */}
      <div className="columns-1 sm:columns-2 md:columns-3 gap-4 space-y-4">
        {photos.map((photo, index) => (
          <PhotoItem
            key={`${photo.id}-${index}`}
            photo={photo}
            onClick={setSelectedPhoto}
            innerRef={photos.length === index + 1 ? lastPhotoElementRef : null}
          />
        ))}
      </div>

      {loading && (
        <div className="flex justify-center py-4">
          <div className="loader">Carregando...</div>
        </div>
      )}

      {photos.length === 0 && !loading && <SkeletonLoader />}

      {/* Modal para exibir a foto em destaque */}
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
