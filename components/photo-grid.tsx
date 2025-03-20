"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import PhotoModal from "@/components/photo-modal"
import { photos } from "./photo-data"

export default function PhotoGrid() {
  const [selectedPhoto, setSelectedPhoto] = useState<(typeof photos)[0] | null>(null)
  const [imageDimensions, setImageDimensions] = useState<{ [key: number]: { width: number; height: number } }>({})

  // Função para pré-carregar as imagens e obter suas dimensões
  useEffect(() => {
    const loadImageDimensions = async () => {
      const dimensions: { [key: number]: { width: number; height: number } } = {}

      const promises = photos.map((photo) => {
        return new Promise<void>((resolve) => {
          // Usar o construtor de Image do DOM, não o componente Next.js
          const img = new window.Image()

          img.onload = () => {
            dimensions[photo.id] = {
              width: img.width,
              height: img.height,
            }
            resolve()
          }

          img.onerror = () => {
            // Em caso de erro, usar dimensões padrão
            dimensions[photo.id] = {
              width: 300,
              height: 300,
            }
            resolve()
          }

          // Definir o src após configurar os handlers
          img.src = photo.src
        })
      })

      try {
        await Promise.all(promises)
        setImageDimensions(dimensions)
      } catch (error) {
        console.error("Erro ao carregar dimensões das imagens:", error)
        // Definir dimensões padrão para todas as imagens em caso de erro
        const defaultDimensions: { [key: number]: { width: number; height: number } } = {}
        photos.forEach((photo) => {
          defaultDimensions[photo.id] = { width: 300, height: 300 }
        })
        setImageDimensions(defaultDimensions)
      }
    }

    loadImageDimensions()
  }, [])

  return (
    <>
      {/* Layout Masonry (estilo Pinterest) */}
      <div className="columns-1 sm:columns-2 md:columns-3 gap-4 space-y-4">
        {photos.map((photo) => {
          const dimensions = imageDimensions[photo.id] || { width: 300, height: 300 }

          return (
            <div
              key={photo.id}
              className="break-inside-avoid mb-4 cursor-pointer overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300"
              onClick={() => setSelectedPhoto(photo)}
            >
              <div
                className="relative w-full"
                style={{ paddingBottom: `${(dimensions.height / dimensions.width) * 100}%` }}
              >
                <Image
                  src={photo.src || "/placeholder.svg"}
                  alt={photo.alt}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
                />
              </div>
              <div className="p-2 bg-background">
                <h3 className="text-sm font-medium truncate">{photo.alt}</h3>
                <p className="text-xs text-muted-foreground truncate">{photo.description}</p>
              </div>
            </div>
          )
        })}
      </div>

      {selectedPhoto && (
        <PhotoModal
          photo={selectedPhoto}
          onClose={() => setSelectedPhoto(null)}
          onAddComment={(photoId, comment) => {
            console.log(`Adding comment to photo ${photoId}:`, comment)
          }}
        />
      )}
    </>
  )
}

