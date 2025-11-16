"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import api, { searchPosts } from "@/lib/api";
import { Photo, PhotoItem } from "@/components/photo-item";
import { SkeletonLoader } from "@/components/skeleton-loader";
import { useAuth } from "@/context/auth-context";
import { useIsClient } from "@/hooks/use-is-client";
import type { FilterOptions } from "@/components/filters";

interface PhotoGridProps {
  filters?: FilterOptions;
  useDirectLinks?: boolean;
  useSearchEndpoint?: boolean;
}

const PAGE_SIZE = 24;

function useColumnCount(isClient: boolean) {
  const [columnCount, setColumnCount] = useState(3);

  useEffect(() => {
    if (!isClient) return;

    const updateColumnCount = () => {
      const width = window.innerWidth;

      if (width < 480) {
        setColumnCount(1);
      } else if (width < 768) {
        setColumnCount(2);
      } else if (width < 1024) {
        setColumnCount(3);
      } else {
        setColumnCount(4);
      }
    };

    updateColumnCount();
    window.addEventListener("resize", updateColumnCount);
    return () => window.removeEventListener("resize", updateColumnCount);
  }, [isClient]);

  return columnCount;
}

function useAuthToken(isClient: boolean) {
  const [token, setToken] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!isClient) return;
    const saved = localStorage.getItem("token");
    setToken(saved);
    setLoaded(true);
  }, [isClient]);

  return { token, loaded };
}

export default function PhotoGrid({
  filters,
  useDirectLinks = false,
  useSearchEndpoint = false,
}: PhotoGridProps) {
  const isClient = useIsClient();
  const { user } = useAuth();
  const isAuthenticated = Boolean(user);
  const columnCount = useColumnCount(isClient);
  const { token, loaded: tokenLoaded } = useAuthToken(isClient);

  const [photos, setPhotos] = useState<Photo[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const observer = useRef<IntersectionObserver | null>(null);
  const filtersRef = useRef<FilterOptions | undefined>(filters);
  const searchEndpointRef = useRef<boolean>(useSearchEndpoint);

  useEffect(() => {
    const currentFilters = JSON.stringify(filters);
    const prevFilters = JSON.stringify(filtersRef.current);

    if (
      prevFilters !== currentFilters ||
      searchEndpointRef.current !== useSearchEndpoint
    ) {
      setPhotos([]);
      setPage(1);
      setHasMore(true);
      setIsFetchingMore(true);
      filtersRef.current = filters;
      searchEndpointRef.current = useSearchEndpoint;
    }
  }, [filters, useSearchEndpoint]);

  useEffect(() => {
    if (!tokenLoaded || loading || !hasMore || !isFetchingMore) return;

    const fetchPhotos = async () => {
      setLoading(true);
      setSearchError(null);

      try {
        if (useSearchEndpoint && filters?.search) {
          const searchResult = await searchPosts(
            filters.search,
            page,
            PAGE_SIZE,
          );
          const newPhotos: Photo[] = searchResult.data || [];
          const meta = searchResult.meta || {};

          if (page === 1) {
            setPhotos(newPhotos);
          } else {
            setPhotos((prev) => {
              const existingIds = new Set(prev.map((p) => p.id));
              const uniqueNewPhotos = newPhotos.filter(
                (p) => !existingIds.has(p.id),
              );
              return uniqueNewPhotos.length > 0
                ? [...prev, ...uniqueNewPhotos]
                : prev;
            });
          }

          const hasMorePages = meta.currentPage < meta.lastPage;
          setHasMore(hasMorePages);
        } else {
          const params: Record<string, string | number> = {
            limit: PAGE_SIZE,
            page,
          };

          if (filters?.order) params.order = filters.order;
          if (filters?.orderBy) params.orderBy = filters.orderBy;
          if (filters?.userId && filters.userId !== "all") {
            params.userId = filters.userId;
          }

          const headers =
            isAuthenticated && token
              ? {
                  Accept: "application/json",
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                }
              : undefined;

          const response = await api.get("/posts", {
            headers,
            params,
          });

          const newPhotos: Photo[] = response.data.data || [];
          const meta = response.data.meta || {};

          if (page === 1) {
            setPhotos(newPhotos);
          } else {
            setPhotos((prev) => {
              const existingIds = new Set(prev.map((p) => p.id));
              const uniqueNewPhotos = newPhotos.filter(
                (p) => !existingIds.has(p.id),
              );
              return uniqueNewPhotos.length > 0
                ? [...prev, ...uniqueNewPhotos]
                : prev;
            });
          }

          const hasMorePages = meta.currentPage < meta.lastPage;
          setHasMore(hasMorePages);
        }
      } catch (error) {
        console.error("Erro ao buscar fotos:", error);
        if (useSearchEndpoint && filters?.search) {
          setSearchError(
            "Não foi possível realizar a pesquisa. Tente novamente.",
          );
        }
        setHasMore(false);
      } finally {
        setLoading(false);
        setIsFetchingMore(false);
      }
    };

    fetchPhotos();
  }, [
    page,
    tokenLoaded,
    loading,
    hasMore,
    isFetchingMore,
    isAuthenticated,
    token,
    filters,
    useSearchEndpoint,
  ]);

  useEffect(() => {
    if (tokenLoaded && !loading && hasMore && photos.length === 0) {
      setIsFetchingMore(true);
    }
  }, [tokenLoaded, loading, hasMore, photos.length]);

  const handleLastPhotoRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (!isClient || loading || !hasMore) return;

      if (observer.current) {
        observer.current.disconnect();
      }

      observer.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasMore) {
            setPage((prev) => prev + 1);
            setIsFetchingMore(true);
          }
        },
        {
          rootMargin: "300px",
          threshold: 0.1,
        },
      );

      if (node) observer.current.observe(node);
    },
    [isClient, loading, hasMore],
  );

  const columns = useMemo(() => {
    if (columnCount <= 1)
      return [[...photos.map((photo, index) => ({ photo, index }))]];

    const result: { photo: Photo; index: number }[][] = Array.from(
      { length: columnCount },
      () => [],
    );

    photos.forEach((photo, index) => {
      const colIndex = index % columnCount;
      result[colIndex].push({ photo, index });
    });

    return result;
  }, [photos, columnCount]);

  const hasPhotos = photos.length > 0;
  const isSearching = useSearchEndpoint && Boolean(filters?.search);

  return (
    <div className="container mx-auto px-4 py-4">
      {searchError && (
        <div className="mb-6 rounded-lg bg-red-100 p-4 text-red-800 dark:bg-red-900/20 dark:text-red-200">
          {searchError}
        </div>
      )}

      {isSearching && !loading && !hasPhotos && (
        <div className="mb-4 py-6 text-center">
          <p className="text-muted-foreground">
            Buscando por &quot;{filters?.search}&quot;...
          </p>
        </div>
      )}

      <div
        className="ordered-masonry-grid"
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${columnCount}, 1fr)`,
          gap: "24px",
        }}
      >
        {columns.map((column, colIndex) => (
          <div key={`column-${colIndex}`} className="masonry-column">
            {column.map(({ photo, index }) => {
              const isLast = index === photos.length - 1;
              return (
                <PhotoItem
                  key={photo.id}
                  photo={photo}
                  innerRef={isLast ? handleLastPhotoRef : null}
                  useDirectLink={useDirectLinks}
                />
              );
            })}
          </div>
        ))}
      </div>

      {!loading && !hasPhotos && (
        <div className="py-12 text-center">
          <p className="text-muted-foreground">
            {isSearching && filters?.search
              ? `Nenhuma foto encontrada para "${filters.search}"`
              : "Nenhuma foto encontrada"}
          </p>
        </div>
      )}

      {loading && !hasPhotos && <SkeletonLoader columnCount={columnCount} />}

      <style jsx>{`
        .masonry-column {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
      `}</style>
    </div>
  );
}
