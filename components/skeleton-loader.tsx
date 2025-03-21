"use client";

import type React from "react";
import { useIsClient } from "@/hooks/use-is-client";

export function SkeletonLoader() {
  const isClient = useIsClient();

  // Use a stable seed for server rendering
  const items = Array.from({ length: 12 }).map((_, index) => {
    // Use deterministic values for server rendering
    // These will be replaced with random values on the client
    const aspectRatio = 0.75; // Fixed aspect ratio for server
    const rowSpan = 30; // Fixed row span for server

    return { index, aspectRatio, rowSpan };
  });

  return (
    <div className="masonry-grid px-2">
      {items.map((item) => {
        // Only use random values on the client
        const aspectRatio = isClient
          ? Math.random() * 0.6 + 0.5
          : item.aspectRatio;
        const rowSpan = isClient
          ? Math.floor(Math.random() * 20) + 20
          : item.rowSpan;

        return (
          <div
            key={item.index}
            className="masonry-item mb-4"
            style={
              isClient
                ? ({ "--row-span": rowSpan } as React.CSSProperties)
                : undefined
            }
          >
            <div className="overflow-hidden rounded-lg shadow-md bg-background">
              <div
                className="relative w-full bg-gray-300 animate-pulse"
                style={{ paddingBottom: `${aspectRatio * 100}%` }}
              />
              <div className="p-2">
                <div className="h-4 bg-gray-300 animate-pulse rounded w-3/4 mb-2"></div>
                <div className="flex space-x-2">
                  <div className="h-3 bg-gray-300 animate-pulse rounded w-16"></div>
                  <div className="h-3 bg-gray-300 animate-pulse rounded w-24"></div>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      <style jsx>{`
        .masonry-grid {
          display: grid;
          grid-template-columns: repeat(1, 1fr);
          grid-gap: 20px;
          grid-auto-rows: 10px;
        }

        @media (min-width: 640px) {
          .masonry-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (min-width: 1024px) {
          .masonry-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        .masonry-item {
          grid-row-end: span var(--row-span, 30);
        }
      `}</style>
    </div>
  );
}
