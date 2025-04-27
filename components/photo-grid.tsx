"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import api, { searchPosts } from "@/lib/api";
import { PhotoItem } from "@/components/photo-item";
import { SkeletonLoader } from "@/components/skeleton-loader";
import { useAuth } from "@/context/auth-context";
import { useIsClient } from "@/hooks/use-is-client";
import type { FilterOptions } from "@/components/filters";

interface PhotoGridProps {
  filters?: FilterOptions;
  useDirectLinks?: boolean;
  useSearchEndpoint?: boolean; // New prop to control whether to use search endpoint
}

export default function PhotoGrid({
  filters,
  useDirectLinks = false,
  useSearchEndpoint = false,
}: PhotoGridProps) {
  const isClient = useIsClient();
  const { user } = useAuth();
  const isAuthenticated = Boolean(user);
  const [token, setToken] = useState<string | null>(null);
  const [photos, setPhotos] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const observer = useRef<IntersectionObserver>();
  const [tokenLoaded, setTokenLoaded] = useState(false);
  const [columnCount, setColumnCount] = useState(3);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Atualizar o número de colunas com base no tamanho da tela
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
      } else if (width < 1280) {
        setColumnCount(4);
      } else {
        setColumnCount(4); // Reduzido de 5 para 4 para aumentar o tamanho das imagens
      }
    };

    updateColumnCount();
    window.addEventListener("resize", updateColumnCount);
    return () => window.removeEventListener("resize", updateColumnCount);
  }, [isClient]);

  // Referência para controlar se os filtros mudaram
  const filtersRef = useRef(filters);
  const searchEndpointRef = useRef(useSearchEndpoint);

  // Reset photos when filters change or when switching between regular and search endpoints
  useEffect(() => {
    // Store current values for comparison
    const currentFilters = JSON.stringify(filters);
    const prevFilters = JSON.stringify(filtersRef.current);

    // Only reset if something meaningful changed
    if (
      prevFilters !== currentFilters ||
      searchEndpointRef.current !== useSearchEndpoint
    ) {
      setPhotos([]);
      setPage(1);
      setHasMore(true);

      // Update refs with new values
      filtersRef.current = filters;
      searchEndpointRef.current = useSearchEndpoint;
    }
  }, [filters, useSearchEndpoint]);

  useEffect(() => {
    if (!isClient) return;

    const saved = localStorage.getItem("token");
    setToken(saved);
    setTokenLoaded(true);
  }, [isClient]);

  useEffect(() => {
    // Só fazer requisição quando:
    // 1. O token estiver carregado
    // 2. Não estiver já carregando
    // 3. Tiver mais itens para carregar
    // 4. Estiver explicitamente buscando mais (ao chegar no final da lista)
    if (!tokenLoaded || loading || !hasMore || !isFetchingMore) return;

    const fetchPhotos = async () => {
      setLoading(true);
      setSearchError(null);

      try {
        // Use search endpoint if useSearchEndpoint is true and we have a search term
        if (useSearchEndpoint && filters?.search) {
          try {
            const searchResult = await searchPosts(filters.search, page, 24);
            const newPhotos = searchResult.data || [];
            const meta = searchResult.meta || {};

            // Verificar se estamos na página 1 (reset) ou adicionando mais fotos
            if (page === 1) {
              setPhotos(newPhotos);
            } else {
              // Adicionar apenas fotos que ainda não existem no array
              const existingIds = new Set(photos.map((p) => p.id));
              const uniqueNewPhotos = newPhotos.filter(
                (p: any) => !existingIds.has(p.id),
              );

              if (uniqueNewPhotos.length > 0) {
                setPhotos((prev) => [...prev, ...uniqueNewPhotos]);
              }
            }

            // Verificar se há mais páginas para carregar
            const hasMorePages = meta.currentPage < meta.lastPage;
            setHasMore(hasMorePages);
          } catch (error) {
            console.error(
              "Erro ao buscar fotos com o termo de pesquisa:",
              error,
            );
            setSearchError(
              "Não foi possível realizar a pesquisa. Tente novamente.",
            );
            setHasMore(false);
          }
        } else {
          // Construct URL with filters for regular endpoint
          let url = `posts?limit=24&page=${page}`;

          if (filters) {
            if (filters.order) url += `&order=${filters.order}`;
            if (filters.orderBy) url += `&orderBy=${filters.orderBy}`;
            if (filters.userId && filters.userId !== "all")
              url += `&userId=${filters.userId}`;
          }

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

          const response = await api.get(url, config);
          const newPhotos = response.data.data || [];
          const meta = response.data.meta || {};

          // Verificar se estamos na página 1 (reset) ou adicionando mais fotos
          if (page === 1) {
            setPhotos(newPhotos);
          } else {
            // Adicionar apenas fotos que ainda não existem no array
            const existingIds = new Set(photos.map((p) => p.id));
            const uniqueNewPhotos = newPhotos.filter(
              (p: any) => !existingIds.has(p.id),
            );

            if (uniqueNewPhotos.length > 0) {
              setPhotos((prev) => [...prev, ...uniqueNewPhotos]);
            }
          }

          // Verificar se há mais páginas para carregar
          const hasMorePages = meta.currentPage < meta.lastPage;
          setHasMore(hasMorePages);
        }
      } catch (error) {
        console.error("Erro ao buscar fotos:", error);
        setHasMore(false);
      } finally {
        setLoading(false);
        setIsFetchingMore(false);
      }
    };

    fetchPhotos();
  }, [
    page,
    isAuthenticated,
    token,
    tokenLoaded,
    filters,
    loading,
    hasMore,
    isFetchingMore,
    useSearchEndpoint,
  ]);

  // Iniciar a primeira busca quando o componente montar
  useEffect(() => {
    if (tokenLoaded && !loading && hasMore && photos.length === 0) {
      setIsFetchingMore(true);
    }
  }, [tokenLoaded, loading, hasMore, photos.length]);

  // Configuração otimizada para carregamento infinito sem animação
  const lastPhotoElementRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (!isClient || loading || !hasMore) return;
      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasMore) {
            setPage((prevPage) => prevPage + 1);
            setIsFetchingMore(true);
          }
        },
        {
          rootMargin: "300px", // Aumentado para 300px para carregar ainda mais cedo
          threshold: 0.1,
        },
      );

      if (node) {
        observer.current.observe(node);
      }
    },
    [loading, hasMore, isClient],
  );

  // Organizar fotos em colunas
  const photosByColumn = () => {
    if (columnCount <= 1) return [photos];

    const columns: any[][] = Array.from({ length: columnCount }, () => []);

    photos.forEach((photo, index) => {
      const columnIndex = index % columnCount;
      columns[columnIndex].push(photo);
    });

    return columns;
  };

  const columns = photosByColumn();

  // Encontrar o último item para o observador de interseção
  const getLastItemRef = (photo: any, colIndex: number, photoIndex: number) => {
    // Calcular a posição aproximada do item na lista completa
    const totalItems = photos.length;
    const itemsPerColumn = Math.ceil(totalItems / columnCount);
    const isNearEnd = photoIndex >= itemsPerColumn - 3; // Considerar os 3 últimos itens de cada coluna

    // Se estiver perto do final da coluna e for a última ou penúltima coluna
    if (isNearEnd && colIndex >= columnCount - 2) {
      return lastPhotoElementRef;
    }

    return null;
  };

  return (
    <div className="container mx-auto px-4 py-4">
      {searchError && (
        <div className="bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200 p-4 rounded-lg mb-6">
          {searchError}
        </div>
      )}

      {useSearchEndpoint &&
        filters?.search &&
        photos.length === 0 &&
        !loading && (
          <div className="text-center py-6 mb-4">
            <p className="text-muted-foreground">
              Buscando por "{filters.search}"...
            </p>
          </div>
        )}

      <div
        className="ordered-masonry-grid"
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${columnCount}, 1fr)`,
          gap: "24px", // Aumentado de 20px para 24px para dar mais espaço entre as imagens
        }}
      >
        {columns.map((column, colIndex) => (
          <div key={`column-${colIndex}`} className="masonry-column">
            {column.map((photo, photoIndex) => (
              <PhotoItem
                key={photo.id}
                photo={photo}
                innerRef={getLastItemRef(photo, colIndex, photoIndex)}
                useDirectLink={useDirectLinks} // Passar a prop para o PhotoItem
              />
            ))}
          </div>
        ))}
      </div>

      {!loading && photos.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {useSearchEndpoint && filters?.search
              ? `Nenhuma foto encontrada para "${filters.search}"`
              : "Nenhuma foto encontrada"}
          </p>
        </div>
      )}

      {loading && photos.length === 0 && (
        <SkeletonLoader columnCount={columnCount} />
      )}

      <style jsx>{`
        .masonry-column {
          display: flex;
          flex-direction: column;
          gap: 24px; /* Aumentado de 20px para 24px para dar mais espaço entre as imagens */
        }
      `}</style>
    </div>
  );
}
