import { LabelingCluster } from "../page";

type ClusterCardProps = {
  cluster: LabelingCluster;
  innerRef?: (node: HTMLDivElement | null) => void;
  onClick: () => void;
};

export function ClusterCard({ cluster, innerRef, onClick }: ClusterCardProps) {
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
