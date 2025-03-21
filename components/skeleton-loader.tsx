"use client";

export function SkeletonLoader() {
  // Criar um array de 12 itens para o skeleton
  const items = Array.from({ length: 12 });

  return (
    <div className="masonry-container">
      {items.map((_, index) => {
        // Altura aleatória para simular imagens de diferentes tamanhos
        const height = Math.floor(Math.random() * 150) + 150; // Entre 150px e 300px

        return (
          <div key={index} className="mb-4 break-inside-avoid">
            <div className="overflow-hidden rounded-lg shadow-md bg-background">
              {/* Placeholder da imagem com altura variável */}
              <div
                className="w-full bg-gray-300 animate-pulse"
                style={{ height: `${height}px` }}
              />

              {/* Placeholder do texto com altura fixa */}
              <div className="p-3 h-[60px] flex flex-col justify-center">
                <div className="h-4 bg-gray-300 animate-pulse rounded w-3/4 mb-2"></div>
                <div className="flex space-x-3">
                  <div className="h-3 bg-gray-300 animate-pulse rounded w-16"></div>
                  <div className="h-3 bg-gray-300 animate-pulse rounded w-24"></div>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      <style jsx>{`
        .masonry-container {
          column-count: 1;
          column-gap: 1.5rem;
        }

        @media (min-width: 640px) {
          .masonry-container {
            column-count: 2;
          }
        }

        @media (min-width: 1024px) {
          .masonry-container {
            column-count: 3;
          }
        }
      `}</style>
    </div>
  );
}
