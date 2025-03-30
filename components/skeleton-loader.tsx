"use client";
import { useState, useEffect } from "react";

interface SkeletonLoaderProps {
  columnCount?: number;
}

export function SkeletonLoader({ columnCount = 3 }: SkeletonLoaderProps) {
  const items = Array.from({ length: 12 });
  const [isMounted, setIsMounted] = useState(false);

  // Definir isMounted após a montagem do componente para evitar problemas de hidratação
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Organizar skeletons em colunas
  const skeletonsByColumn = () => {
    if (columnCount <= 1) return [items];

    const columns: any[][] = Array.from({ length: columnCount }, () => []);

    items.forEach((_, index) => {
      const columnIndex = index % columnCount;
      columns[columnIndex].push(_);
    });

    return columns;
  };

  const columns = skeletonsByColumn();

  return (
    <div
      className="ordered-masonry-grid"
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${columnCount}, 1fr)`,
        gap: "20px",
      }}
    >
      {columns.map((column, colIndex) => (
        <div key={`skeleton-column-${colIndex}`} className="masonry-column">
          {column.map((_, itemIndex) => {
            // Determinar aleatoriamente se este skeleton deve ser horizontal
            const isHorizontal = isMounted ? Math.random() > 0.6 : false;
            const isVeryHorizontal = isMounted ? Math.random() > 0.8 : false;
            const aspectRatio = isMounted
              ? isVeryHorizontal
                ? 2.2 + Math.random() * 0.5
                : isHorizontal
                  ? 1.6 + Math.random() * 0.3
                  : 0.7 + Math.random() * 0.5
              : 1.5;

            return (
              <SkeletonItem
                key={`skeleton-${colIndex}-${itemIndex}`}
                aspectRatio={aspectRatio}
                isHorizontal={isHorizontal}
                isVeryHorizontal={isVeryHorizontal}
                isMounted={isMounted}
              />
            );
          })}
        </div>
      ))}

      <style jsx>{`
        .masonry-column {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
      `}</style>
    </div>
  );
}

function SkeletonItem({
  aspectRatio,
  isHorizontal,
  isVeryHorizontal,
  isMounted,
}: {
  aspectRatio: number;
  isHorizontal: boolean;
  isVeryHorizontal: boolean;
  isMounted: boolean;
}) {
  // Determinar a classe de destaque
  const getHighlightClass = () => {
    if (!isMounted) return "";

    if (isVeryHorizontal) {
      return "very-horizontal-skeleton";
    }

    if (isHorizontal) {
      return "horizontal-skeleton";
    }

    return "";
  };

  return (
    <div className={`skeleton-item ${getHighlightClass()}`}>
      <div className="overflow-hidden rounded-lg shadow-md bg-background relative">
        <div
          className="w-full bg-gray-200 dark:bg-gray-800 animate-pulse"
          style={{ aspectRatio: aspectRatio.toString() }}
        />
        {/* Simular os contadores no canto inferior direito */}
        {isMounted && (
          <div className="absolute bottom-2 right-2 flex gap-2">
            <div className="w-8 h-4 rounded-full bg-gray-400 dark:bg-gray-600 animate-pulse"></div>
            <div className="w-8 h-4 rounded-full bg-gray-400 dark:bg-gray-600 animate-pulse"></div>
          </div>
        )}
      </div>

      {/* Estilo para skeletons horizontais */}
      <style jsx>{`
        /* Estilo para skeletons moderadamente horizontais */
        .horizontal-skeleton {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        /* Estilo para skeletons muito horizontais (panorâmicos) */
        .very-horizontal-skeleton {
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
        }
      `}</style>
    </div>
  );
}
