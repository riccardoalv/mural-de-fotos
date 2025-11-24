// app/detect-faces/page.tsx
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import api from "@/lib/api";
import Header from "@/components/header";
import { useAuth } from "@/context/auth-context";
import { useIsClient } from "@/hooks/use-is-client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";

type BBox = {
  x1: number;
  x2: number;
  y1: number;
  y2: number;
};

type LabelingEntity = {
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

type LabelingCluster = {
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

type ApiUser = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
};

type Meta = {
  total: number;
  lastPage: number;
  currentPage: number;
  perPage: number;
  prev: number | null;
  next: number | null;
};

const PAGE_SIZE = 12;

// ---------------- HOOKS ----------------

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

// ---------------- COMPONENTES AUXILIARES ----------------

type ClusterCardProps = {
  cluster: LabelingCluster;
  innerRef?: (node: HTMLDivElement | null) => void;
  onClick: () => void;
};

function ClusterCard({ cluster, innerRef, onClick }: ClusterCardProps) {
  const first = cluster.entities[0];
  if (!first) return null;

  const labeledName = cluster.name ?? cluster.user?.name ?? "Sem rótulo";

  return (
    <div
      ref={innerRef}
      className={`group flex cursor-pointer flex-col items-center rounded-2xl border bg-card p-4 shadow-sm transition-transform hover:-translate-y-1 hover:shadow-md ${
        cluster.userId ? "border-emerald-500/50" : "border-border"
      }`}
      onClick={onClick}
    >
      {/* STACK DE IMAGENS */}
      <div className="relative mb-3 flex w-full justify-center">
        <div className="relative h-24 w-32">
          {cluster.entities.slice(0, 4).map((entity, index) => (
            <div
              key={entity.id}
              className="absolute flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-muted ring-2 ring-background/80 shadow-sm transition-transform group-hover:translate-y-[-2px]"
              style={{
                left: `${index * 18}px`,
                zIndex: 10 + index,
              }}
            >
              <img
                src={entity.entityPath}
                alt="Rosto"
                className="h-full w-full object-cover"
              />
            </div>
          ))}

          {cluster.entities.length > 4 && (
            <div className="absolute -right-1 -bottom-1 flex h-8 w-8 items-center justify-center rounded-full bg-card text-[11px] text-muted-foreground border shadow-sm">
              +{cluster.entities.length - 4}
            </div>
          )}
        </div>
      </div>

      <div className="w-full text-center">
        <p className="truncate text-sm font-medium">{labeledName}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {cluster.userId ? "Já classificado" : "Clique para classificar"}
        </p>
      </div>
    </div>
  );
}

type LabelClusterDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cluster: LabelingCluster | null;
  token: string | null;
  isAuthenticated: boolean;
  onClusterLabeled: (updated: LabelingCluster) => void;
};

function LabelClusterDialog({
  open,
  onOpenChange,
  cluster,
  token,
  isAuthenticated,
  onClusterLabeled,
}: LabelClusterDialogProps) {
  const [selectedEntity, setSelectedEntity] = useState<LabelingEntity | null>(
    null,
  );

  const [imageSize, setImageSize] = useState<{
    width: number;
    height: number;
    naturalWidth: number;
    naturalHeight: number;
  } | null>(null);

  // busca de usuários
  const [userSearch, setUserSearch] = useState("");
  const [userSearchInput, setUserSearchInput] = useState("");
  const [userPage, setUserPage] = useState(1);
  const [userHasMore, setUserHasMore] = useState(true);
  const [userLoading, setUserLoading] = useState(false);
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [userMeta, setUserMeta] = useState<Meta | null>(null);
  const [selectedUser, setSelectedUser] = useState<ApiUser | null>(null);
  const [manualName, setManualName] = useState("");

  // feedback
  const [labelingLoading, setLabelingLoading] = useState(false);
  const [labelingError, setLabelingError] = useState<string | null>(null);
  const [labelingSuccess, setLabelingSuccess] = useState<string | null>(null);

  // Resetar estado quando abrir/cluster mudar
  useEffect(() => {
    if (!open || !cluster) return;
    setSelectedEntity(cluster.entities[0] ?? null);
    setImageSize(null);
    setSelectedUser(cluster.user ?? null);
    setManualName(cluster.name ?? "");
    setUsers([]);
    setUserMeta(null);
    setUserPage(1);
    setUserHasMore(true);
    setUserSearch("");
    setUserSearchInput("");
    setLabelingError(null);
    setLabelingSuccess(null);
  }, [open, cluster]);

  const handleClose = () => {
    onOpenChange(false);
  };

  // busca de usuários
  useEffect(() => {
    if (!userSearch || !open) {
      setUsers([]);
      setUserMeta(null);
      setUserPage(1);
      setUserHasMore(true);
      return;
    }

    const fetchUsers = async () => {
      setUserLoading(true);
      try {
        const headers =
          isAuthenticated && token
            ? {
                Accept: "application/json",
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              }
            : undefined;

        const response = await api.get("/users", {
          headers,
          params: {
            name: userSearch,
            limit: 8,
            page: userPage,
          },
        });

        const data: ApiUser[] = response.data.data || [];
        const meta: Meta = response.data.meta;

        if (userPage === 1) {
          setUsers(data);
        } else {
          setUsers((prev) => {
            const existingIds = new Set(prev.map((u) => u.id));
            const unique = data.filter((u) => !existingIds.has(u.id));
            return unique.length > 0 ? [...prev, ...unique] : prev;
          });
        }

        setUserMeta(meta);
        setUserHasMore(meta.currentPage < meta.lastPage);
      } catch (err) {
        console.error("Erro ao buscar usuários:", err);
      } finally {
        setUserLoading(false);
      }
    };

    fetchUsers();
  }, [userSearch, userPage, isAuthenticated, token, open]);

  const handleUserSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setUserPage(1);
    setUserHasMore(true);
    setUsers([]);
    setUserMeta(null);
    setUserSearch(userSearchInput.trim());
  };

  const handleLoadMoreUsers = () => {
    if (userMeta && userMeta.currentPage < userMeta.lastPage && !userLoading) {
      setUserPage((prev) => prev + 1);
    }
  };

  // BBOX
  const handleImageLoad = (
    e: React.SyntheticEvent<HTMLImageElement, Event>,
  ) => {
    const img = e.currentTarget;
    setImageSize({
      width: img.clientWidth,
      height: img.clientHeight,
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight,
    });
  };

  const computeBoxStyle = () => {
    if (!imageSize || !selectedEntity) return {};
    const { width, height, naturalWidth, naturalHeight } = imageSize;
    const { bbox } = selectedEntity;

    const scaleX = width / naturalWidth;
    const scaleY = height / naturalHeight;

    const left = bbox.x1 * scaleX;
    const top = bbox.y1 * scaleY;
    const boxWidth = (bbox.x2 - bbox.x1) * scaleX;
    const boxHeight = (bbox.y2 - bbox.y1) * scaleY;

    return {
      left,
      top,
      width: boxWidth,
      height: boxHeight,
    };
  };

  // LABELING
  const handleConfirmLabel = async () => {
    if (!cluster) return;

    const labelName = manualName.trim() || selectedUser?.name;
    if (!labelName) {
      setLabelingError("O nome é obrigatório.");
      return;
    }

    const userIdToSend = selectedUser?.id || null;

    setLabelingLoading(true);
    setLabelingError(null);
    setLabelingSuccess(null);

    try {
      const headers = token
        ? {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          }
        : undefined;

      await api.post(
        `/labeling/label`,
        {
          name: labelName,
          userId: userIdToSend,
        },
        {
          headers,
          params: {
            clusterId: cluster.id,
          },
        },
      );

      const updatedCluster: LabelingCluster = {
        ...cluster,
        name: labelName,
        userId: userIdToSend,
        user: selectedUser
          ? {
              id: selectedUser.id,
              name: selectedUser.name,
              email: selectedUser.email,
              avatarUrl: selectedUser.avatarUrl,
            }
          : null,
      };

      onClusterLabeled(updatedCluster);
      setLabelingSuccess("Rosto classificado com sucesso!");
    } catch (err) {
      console.error("Erro ao fazer labeling:", err);
      setLabelingError("Não foi possível salvar o rótulo. Tente novamente.");
    } finally {
      setLabelingLoading(false);
    }
  };

  const hasContent = cluster && selectedEntity;

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!value) handleClose();
        else onOpenChange(value);
      }}
    >
      <DialogContent
        // modal MAIOR
        className="max-w-5xl md:max-w-6xl max-h-[90vh] overflow-hidden"
      >
        <DialogHeader>
          <DialogTitle>Classificar rosto</DialogTitle>
          <DialogDescription>
            Escolha a pessoa a quem este cluster de rostos pertence.
          </DialogDescription>
        </DialogHeader>

        {hasContent && cluster && selectedEntity && (
          <div className="grid gap-6 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
            {/* ESQUERDA: Imagem original + bbox + thumbnails */}
            <div className="space-y-4">
              <div className="rounded-xl border bg-muted/40 p-3">
                <p className="mb-2 text-xs font-medium text-muted-foreground">
                  Imagem original com destaque do rosto
                </p>
                <div className="relative max-h-[420px] w-full overflow-hidden rounded-lg bg-black/5">
                  <img
                    src={selectedEntity.media.imageUrl}
                    alt="Imagem original"
                    className="h-full w-full object-contain"
                    onLoad={handleImageLoad}
                  />
                  {imageSize && (
                    <div
                      className="pointer-events-none absolute border-2 border-emerald-400 shadow-[0_0_0_2px_rgba(0,0,0,0.35)]"
                      style={computeBoxStyle()}
                    />
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">
                  Rostos neste cluster ({cluster.entities.length})
                </p>
                <ScrollArea className="h-32 rounded-xl border bg-muted/40 p-2">
                  <div className="flex gap-3">
                    {cluster.entities.map((entity) => (
                      <button
                        key={entity.id}
                        type="button"
                        onClick={() => {
                          setSelectedEntity(entity);
                          setImageSize(null);
                        }}
                        className={`flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border bg-background shadow-sm transition-transform hover:scale-105 ${
                          selectedEntity.id === entity.id
                            ? "ring-2 ring-emerald-500"
                            : ""
                        }`}
                      >
                        <img
                          src={entity.entityPath}
                          alt="Rosto"
                          className="h-full w-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>

            {/* DIREITA: Seleção de usuário */}
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">
                  Buscar usuário existente
                </p>
                <form onSubmit={handleUserSearchSubmit} className="flex gap-2">
                  <Input
                    placeholder="Nome da pessoa (ex: Ana)..."
                    value={userSearchInput}
                    onChange={(e) => setUserSearchInput(e.target.value)}
                  />
                  <Button type="submit" variant="secondary">
                    Buscar
                  </Button>
                </form>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">
                  Resultados da busca
                </p>
                <div className="rounded-xl border bg-muted/40">
                  <ScrollArea className="h-56">
                    <div className="divide-y">
                      {users.map((u) => (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => setSelectedUser(u)}
                          className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors hover:bg-accent ${
                            selectedUser?.id === u.id ? "bg-emerald-500/10" : ""
                          }`}
                        >
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={u.avatarUrl ?? ""} />
                            <AvatarFallback>
                              {u.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .slice(0, 2)
                                .toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="font-medium">{u.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {u.email}
                            </span>
                          </div>
                        </button>
                      ))}

                      {!userLoading && users.length === 0 && (
                        <p className="px-3 py-4 text-xs text-muted-foreground">
                          Nenhum usuário encontrado. Busque pelo nome para
                          encontrar alguém.
                        </p>
                      )}
                    </div>
                  </ScrollArea>
                  {userHasMore && users.length > 0 && (
                    <div className="border-t p-2 text-center">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleLoadMoreUsers}
                        disabled={userLoading}
                      >
                        {userLoading ? "Carregando..." : "Carregar mais"}
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">
                  Nome para este rosto (opcional)
                </p>
                <Input
                  placeholder="Ex: Ana, Professor João, Aluno desconhecido..."
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                />
                <p className="text-[11px] text-muted-foreground">
                  Este nome será salvo como rótulo do cluster, mas o{" "}
                  <span className="font-semibold">userId</span> será o usuário
                  que você selecionou acima.
                </p>
              </div>

              {labelingError && (
                <div className="rounded-md border border-destructive/40 bg-destructive/10 p-2 text-xs text-destructive">
                  {labelingError}
                </div>
              )}
              {labelingSuccess && (
                <div className="rounded-md border border-emerald-500/40 bg-emerald-500/10 p-2 text-xs text-emerald-600">
                  {labelingSuccess}
                </div>
              )}

              <DialogFooter className="mt-2 flex flex-col sm:flex-row sm:justify-between sm:space-x-2">
                <Button type="button" variant="outline" onClick={handleClose}>
                  Fechar
                </Button>
                <Button
                  type="button"
                  onClick={handleConfirmLabel}
                  disabled={
                    labelingLoading || (!selectedUser && !manualName.trim())
                  }
                >
                  {labelingLoading ? "Salvando..." : "Confirmar rótulo"}
                </Button>
              </DialogFooter>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ---------------- PAGE ----------------

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

  // Modal
  const [open, setOpen] = useState(false);
  const [selectedCluster, setSelectedCluster] =
    useState<LabelingCluster | null>(null);

  // ---- FETCH LABELING CLUSTERS ----
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
            alreadyClassified: false,
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
