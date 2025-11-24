"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import api from "@/lib/api";
import Header from "@/components/header";
import { useAuth } from "@/context/auth-context";
import { useIsClient } from "@/hooks/use-is-client";
import { LabelClusterDialog } from "./components/dialog";
import { ClusterCard } from "./components/cluster-card";

type BBox = {
  x1: number;
  x2: number;
  y1: number;
  y2: number;
};

export type LabelingEntity = {
  id: string;
  entityPath: string;
  bbox: BBox;
  className: string;
  confidence: number;
  name: string | null;
  isAboveThreshold: boolean;
  mediaId: string;
  clusterId: string;
  userId: string | null;
  media: {
    id: string;
    order: number;
    imageUrl: string;
    isVideo: boolean;
    createdAt: string;
    updatedAt: string;
    isProcessed: boolean;
    postId: string;
  };
};

export type LabelingCluster = {
  id: string;
  name: string | null;
  description: string | null;
  threshold: number;
  createdAt: string;
  updatedAt: string;
  userId: string | null;
  entities: LabelingEntity[];
  user: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
  } | null;
};

export type Meta = {
  total: number;
  lastPage: number;
  currentPage: number;
  perPage: number;
  prev: number | null;
  next: number | null;
};

const PAGE_SIZE = 20;

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

export default function DetectFacesPage() {
  const isClient = useIsClient();
  const { user } = useAuth();
  const isAuthenticated = Boolean(user);
  const { token, loaded: tokenLoaded } = useAuthToken(isClient);

  const [clusters, setClusters] = useState<LabelingCluster[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const observer = useRef<IntersectionObserver | null>(null);

  const [open, setOpen] = useState(false);
  const [selectedCluster, setSelectedCluster] =
    useState<LabelingCluster | null>(null);

  useEffect(() => {
    if (!tokenLoaded || loading || !hasMore || !isFetchingMore) return;

    const fetchClusters = async () => {
      setLoading(true);
      setError(null);

      try {
        const headers =
          isAuthenticated && token
            ? {
                Accept: "application/json",
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              }
            : undefined;

        const response = await api.get("/labeling", {
          headers,
          params: {
            limit: PAGE_SIZE,
            page,
          },
        });

        const data: LabelingCluster[] = response.data.data || [];
        const meta: Meta = response.data.meta || {
          total: 0,
          lastPage: 1,
          currentPage: 1,
          perPage: PAGE_SIZE,
          prev: null,
          next: null,
        };

        if (page === 1) {
          setClusters(data);
        } else {
          setClusters((prev) => {
            const existingIds = new Set(prev.map((c) => c.id));
            const unique = data.filter((c) => !existingIds.has(c.id));
            return unique.length > 0 ? [...prev, ...unique] : prev;
          });
        }

        setHasMore(meta.currentPage < meta.lastPage);
      } catch (err) {
        console.error("Erro ao buscar labeling:", err);
        setError("Não foi possível carregar os rostos para classificação.");
        setHasMore(false);
      } finally {
        setLoading(false);
        setIsFetchingMore(false);
      }
    };

    fetchClusters();
  }, [
    page,
    tokenLoaded,
    loading,
    hasMore,
    isFetchingMore,
    isAuthenticated,
    token,
  ]);

  useEffect(() => {
    if (tokenLoaded && !loading && hasMore && clusters.length === 0) {
      setIsFetchingMore(true);
    }
  }, [tokenLoaded, loading, hasMore, clusters.length]);

  const handleLastClusterRef = useCallback(
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

  const openClusterModal = (cluster: LabelingCluster) => {
    setSelectedCluster(cluster);
    setOpen(true);
  };

  const handleClusterLabeled = (updated: LabelingCluster) => {
    setClusters((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  };

  const hasClusters = clusters.length > 0;

  return (
    <>
      <Header />
      <main className="container mx-auto max-w-6xl px-4 py-6">
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Ajude a classificar minha IA</h1>
            <p className="text-sm text-muted-foreground">
              Agrupamos rostos parecidos em clusters. Selecione quem é quem para
              melhorar o reconhecimento, como no Google Fotos.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {clusters.map((cluster, index) => {
            const isLast = index === clusters.length - 1;

            return (
              <ClusterCard
                key={cluster.id}
                cluster={cluster}
                innerRef={isLast ? handleLastClusterRef : undefined}
                onClick={() => openClusterModal(cluster)}
              />
            );
          })}
        </div>

        {!loading && !hasClusters && (
          <div className="py-12 text-center text-muted-foreground">
            Nenhum rosto detectado para classificação.
          </div>
        )}

        {loading && !hasClusters && (
          <div className="py-12 text-center text-muted-foreground">
            Carregando rostos...
          </div>
        )}

        <LabelClusterDialog
          open={open}
          onOpenChange={(value) => {
            setOpen(value);
            if (!value) setSelectedCluster(null);
          }}
          cluster={selectedCluster}
          token={token}
          isAuthenticated={isAuthenticated}
          onClusterLabeled={handleClusterLabeled}
        />
      </main>
    </>
  );
}
