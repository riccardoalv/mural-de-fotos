import { useCallback, useEffect, useMemo, useState } from "react";
import { LabelingCluster, LabelingEntity, Meta } from "../page";
import api from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type ApiUser = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
};

type LabelClusterDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cluster: LabelingCluster | null;
  token: string | null;
  isAuthenticated: boolean;
  onClusterLabeled: (updated: LabelingCluster) => void;
};

type ImageSize = {
  width: number;
  height: number;
  naturalWidth: number;
  naturalHeight: number;
};

// Modal “solto”, mas limitado à viewport
const dialogContentClassName = "max-w-[90vw] max-h-[90vh] overflow-y-auto";

function buildAuthHeaders(token: string | null, isAuthenticated: boolean) {
  if (!token || !isAuthenticated) return undefined;

  return {
    Accept: "application/json",
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

function useUserSearch({
  open,
  token,
  isAuthenticated,
}: {
  open: boolean;
  token: string | null;
  isAuthenticated: boolean;
}) {
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);

  // Reset ao fechar o modal
  useEffect(() => {
    if (!open) {
      setSearch("");
      setSearchInput("");
      setUsers([]);
      setMeta(null);
      setPage(1);
      setHasMore(true);
    }
  }, [open]);

  // 🔎 Busca automática com debounce (2+ caracteres)
  useEffect(() => {
    if (!open) return;

    const trimmed = searchInput.trim();

    // Se tiver menos de 2 caracteres, limpa resultados
    if (trimmed.length < 2) {
      setSearch("");
      setUsers([]);
      setMeta(null);
      setPage(1);
      setHasMore(true);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setSearch(trimmed);
      setPage(1);
      setHasMore(true);
      setUsers([]);
      setMeta(null);
    }, 400); // debounce ~400ms

    return () => window.clearTimeout(timeoutId);
  }, [searchInput, open]);

  useEffect(() => {
    if (!open || !search) return;

    const fetchUsers = async () => {
      setLoading(true);
      try {
        const headers = buildAuthHeaders(token, isAuthenticated);

        const response = await api.get("/users", {
          headers,
          params: {
            name: search,
            limit: 8,
            page,
          },
        });

        const data: ApiUser[] = response.data.data || [];
        const metaResponse: Meta = response.data.meta;

        setUsers((prev) => {
          if (page === 1) return data;

          const existingIds = new Set(prev.map((u) => u.id));
          const unique = data.filter((u) => !existingIds.has(u.id));
          return unique.length > 0 ? [...prev, ...unique] : prev;
        });

        setMeta(metaResponse);
        setHasMore(metaResponse.currentPage < metaResponse.lastPage);
      } catch (err) {
        console.error("Erro ao buscar usuários:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [search, page, open, token, isAuthenticated]);

  const handleLoadMore = () => {
    if (!meta || loading) return;
    if (meta.currentPage >= meta.lastPage) return;
    setPage((prev) => prev + 1);
  };

  const reset = useCallback(() => {
    setSearch("");
    setSearchInput("");
    setPage(1);
    setHasMore(true);
    setUsers([]);
    setMeta(null);
  }, []);

  return {
    searchInput,
    setSearchInput,
    users,
    loading,
    hasMore,
    handleLoadMore,
    reset,
  };
}

export function LabelClusterDialog({
  open,
  onOpenChange,
  cluster,
  token,
  isAuthenticated,
  onClusterLabeled,
}: LabelClusterDialogProps) {
  const [currentCluster, setCurrentCluster] = useState<LabelingCluster | null>(
    null,
  );
  const [selectedEntity, setSelectedEntity] = useState<LabelingEntity | null>(
    null,
  );
  const [imageSize, setImageSize] = useState<ImageSize | null>(null);

  const {
    searchInput,
    setSearchInput,
    users,
    loading: userLoading,
    hasMore: userHasMore,
    handleLoadMore: handleLoadMoreUsers,
    reset: resetUserSearch,
  } = useUserSearch({ open, token, isAuthenticated });

  const [selectedUser, setSelectedUser] = useState<ApiUser | null>(null);
  const [manualName, setManualName] = useState("");

  const [labelingLoading, setLabelingLoading] = useState(false);
  const [labelingError, setLabelingError] = useState<string | null>(null);
  const [labelingSuccess, setLabelingSuccess] = useState<string | null>(null);
  const [removingEntityId, setRemovingEntityId] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !cluster) return;

    setCurrentCluster(cluster);
    setSelectedEntity(cluster.entities[0] ?? null);
    setImageSize(null);
    setSelectedUser(cluster.user ?? null);
    setManualName(cluster.name ?? "");
    setLabelingError(null);
    setLabelingSuccess(null);
    resetUserSearch();
  }, [open, cluster, resetUserSearch]);

  const handleClose = () => {
    onOpenChange(false);
  };

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

  // Cálculo do bbox baseado no tamanho REAL em tela
  const boxStyle = useMemo(() => {
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
  }, [imageSize, selectedEntity]);

  const handleConfirmLabel = async () => {
    if (!currentCluster) return;

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
      const headers = buildAuthHeaders(token, true);

      await api.post(
        `/labeling/label`,
        {
          name: labelName,
          userId: userIdToSend,
        },
        {
          headers,
          params: {
            clusterId: currentCluster.id,
          },
        },
      );

      const updatedCluster: LabelingCluster = {
        ...currentCluster,
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

      // atualiza estado local + pai
      setCurrentCluster(updatedCluster);
      onClusterLabeled(updatedCluster);
      setLabelingSuccess("Rosto classificado com sucesso!");
    } catch (err) {
      console.error("Erro ao fazer labeling:", err);
      setLabelingError("Não foi possível salvar o rótulo. Tente novamente.");
    } finally {
      setLabelingLoading(false);
    }
  };

  const handleRemoveEntity = async (entityId: string) => {
    if (!currentCluster) return;

    setLabelingError(null);
    setLabelingSuccess(null);
    setRemovingEntityId(entityId);

    try {
      const headers = buildAuthHeaders(token, true);

      await api.delete(`/labeling/entity/${entityId}/cluster`, {
        headers,
      });

      const remainingEntities = currentCluster.entities.filter(
        (e) => e.id !== entityId,
      );

      const updatedCluster: LabelingCluster = {
        ...currentCluster,
        entities: remainingEntities,
      };

      // atualiza estado local (aqui a listagem já muda na hora)
      setCurrentCluster(updatedCluster);

      // se o removido era o selecionado, pega outro
      if (selectedEntity && selectedEntity.id === entityId) {
        setSelectedEntity(remainingEntities[0] ?? null);
        setImageSize(null);
      }

      // se não sobrou nada, fecha
      if (remainingEntities.length === 0) {
        onClusterLabeled(updatedCluster);
        onOpenChange(false);
        return;
      }

      // avisa o pai também
      onClusterLabeled(updatedCluster);
      setLabelingSuccess("Rosto removido do cluster com sucesso!");
    } catch (err) {
      console.error("Erro ao remover entity do cluster:", err);
      setLabelingError(
        "Não foi possível remover este rosto do cluster. Tente novamente.",
      );
    } finally {
      setRemovingEntityId(null);
    }
  };

  if (!currentCluster || !selectedEntity) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className={dialogContentClassName}>
          <DialogHeader>
            <DialogTitle>Classificar rosto</DialogTitle>
            <DialogDescription>Nenhum cluster selecionado.</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!value) handleClose();
        else onOpenChange(value);
      }}
    >
      <DialogContent className={dialogContentClassName}>
        <DialogHeader>
          <DialogTitle>Classificar rosto</DialogTitle>
          <DialogDescription>
            Escolha a pessoa a quem este cluster de rostos pertence.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <div className="space-y-4">
            <div className="rounded-xl border bg-muted/40 p-3">
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                Imagem original com destaque do rosto
              </p>

              <div className="flex justify-center">
                <div className="relative inline-block">
                  <img
                    src={selectedEntity.media.imageUrl}
                    alt="Imagem original"
                    className="max-h-[70vh] max-w-full h-auto w-auto"
                    onLoad={handleImageLoad}
                  />
                  {imageSize && (
                    <div
                      className="pointer-events-none absolute border-2 border-emerald-400 shadow-[0_0_0_2px_rgba(0,0,0,0.35)]"
                      style={boxStyle}
                    />
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">
                Rostos neste cluster ({currentCluster.entities.length})
              </p>

              <ScrollArea className="h-32 rounded-xl border bg-muted/40 p-2">
                <div className="flex w-max gap-3">
                  {currentCluster.entities.map((entity) => (
                    <div key={entity.id} className="relative h-20 w-20">
                      {/* Selecionar rosto */}
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedEntity(entity);
                          setImageSize(null);
                        }}
                        className={`flex h-full w-full items-center justify-center overflow-hidden rounded-full border bg-background shadow-sm transition-transform hover:scale-105 ${
                          selectedEntity?.id === entity.id
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

                      {/* X para remover */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveEntity(entity.id);
                        }}
                        disabled={removingEntityId === entity.id}
                        className="absolute right-0 top-0 flex h-5 w-5 translate-x-1/4 -translate-y-1/4 items-center justify-center rounded-full bg-black/70 text-[11px] font-semibold text-white shadow-lg hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
                        title="Remover este rosto do cluster"
                      >
                        {removingEntityId === entity.id ? "…" : "×"}
                      </button>
                    </div>
                  ))}
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </div>
          </div>

          {/* DIREITA: Seleção de usuário */}
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">
                Buscar usuário existente
              </p>
              {/* Busca automática (sem botão) */}
              <Input
                placeholder="Digite pelo menos 2 letras do nome..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground">
                A busca é feita automaticamente após digitar pelo menos{" "}
                <span className="font-semibold">2 caracteres</span>.
              </p>
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
                        {searchInput.trim().length < 2
                          ? "Digite pelo menos 2 caracteres para iniciar a busca."
                          : "Nenhum usuário encontrado para essa busca."}
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
                <span className="font-semibold">userId</span> será o usuário que
                você selecionou acima.
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
      </DialogContent>
    </Dialog>
  );
}
