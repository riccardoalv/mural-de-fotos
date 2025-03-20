"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { X, Heart, MessageCircle, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"

type Comment = {
  id: number
  author: string
  text: string
}

type Photo = {
  id: number
  src: string
  alt: string
  description: string
  author: string
  likes: number
  comments: Comment[]
}

interface PhotoModalProps {
  photo: Photo
  onClose: () => void
  onAddComment: (photoId: number, comment: string) => void
}

export default function PhotoModal({ photo, onClose, onAddComment }: PhotoModalProps) {
  const [newComment, setNewComment] = useState("")
  const [liked, setLiked] = useState(false)
  const [likesCount, setLikesCount] = useState(photo.likes)
  const [comments, setComments] = useState<Comment[]>(photo.comments)
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number }>({ width: 800, height: 600 })

  useEffect(() => {
    // Carregar dimensões da imagem para calcular proporções
    if (typeof window !== "undefined") {
      const img = new window.Image()

      img.onload = () => {
        setImageDimensions({
          width: img.width,
          height: img.height,
        })
      }

      img.onerror = () => {
        // Em caso de erro, manter as dimensões padrão
        console.error("Erro ao carregar a imagem:", photo.src)
      }

      img.src = photo.src
    }

    // Desabilitar scroll do body quando o modal estiver aberto
    if (typeof document !== "undefined") {
      document.body.style.overflow = "hidden"
      return () => {
        document.body.style.overflow = "auto"
      }
    }
  }, [photo.src])

  const handleAddComment = () => {
    if (newComment.trim()) {
      const newCommentObj = {
        id: comments.length + 1,
        author: "current_user",
        text: newComment,
      }

      setComments([...comments, newCommentObj])
      onAddComment(photo.id, newComment)
      setNewComment("")
    }
  }

  const handleLike = () => {
    setLiked(!liked)
    setLikesCount(liked ? likesCount - 1 : likesCount + 1)
  }

  // Calcular o estilo do container da imagem baseado nas dimensões
  const getImageContainerStyle = () => {
    const aspectRatio = imageDimensions.width / imageDimensions.height
    const isLandscape = aspectRatio > 1

    if (isLandscape) {
      // Para imagens horizontais, limitar a largura
      return {
        width: "100%",
        height: "auto",
        maxHeight: "80vh",
      }
    } else {
      // Para imagens verticais, limitar a altura
      return {
        height: "80vh",
        width: "auto",
        maxWidth: "100%",
      }
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div
        className="bg-background rounded-lg overflow-hidden w-full max-h-screen flex flex-col lg:flex-row"
        style={{ maxWidth: "90vw" }}
      >
        {/* Close button */}
        <button onClick={onClose} className="absolute top-4 right-4 text-white hover:text-gray-300 z-10">
          <X className="h-6 w-6" />
        </button>

        {/* Image */}
        <div className="relative flex items-center justify-center bg-black lg:w-2/3 h-auto">
          <div className="relative" style={getImageContainerStyle()}>
            <Image
              src={photo.src || "/placeholder.svg"}
              alt={photo.alt}
              width={imageDimensions.width}
              height={imageDimensions.height}
              className="object-contain max-h-[80vh]"
              style={{ width: "100%", height: "auto" }}
              unoptimized
            />
          </div>
        </div>

        {/* Details and comments */}
        <div className="lg:w-1/3 flex flex-col h-full max-h-[50vh] lg:max-h-[80vh]">
          {/* Author info */}
          <div className="p-4 border-b flex items-center gap-3">
            <Avatar>
              <AvatarImage src="/placeholder.svg?height=40&width=40" />
              <AvatarFallback>{photo.author.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="font-medium">{photo.author}</div>
          </div>

          {/* Description */}
          <div className="p-4 border-b">
            <h3 className="font-medium mb-2">{photo.alt}</h3>
            <p className="text-sm text-muted-foreground">{photo.description}</p>
          </div>

          {/* Comments */}
          <div className="flex-1 overflow-y-auto p-4">
            {comments.map((comment) => (
              <div key={comment.id} className="mb-3 flex gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>{comment.author.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <span className="font-medium text-sm">{comment.author}</span>{" "}
                  <span className="text-sm">{comment.text}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="p-4 border-t">
            <div className="flex items-center gap-4 mb-3">
              <Button variant="ghost" size="icon" onClick={handleLike} className={liked ? "text-red-500" : ""}>
                <Heart className={`h-6 w-6 ${liked ? "fill-red-500" : ""}`} />
                <span className="sr-only">Like</span>
              </Button>
              <Button variant="ghost" size="icon">
                <MessageCircle className="h-6 w-6" />
                <span className="sr-only">Comment</span>
              </Button>
              <div className="ml-auto text-sm font-medium">{likesCount} likes</div>
            </div>

            {/* Add comment */}
            <div className="flex gap-2">
              <Input
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleAddComment()
                  }
                }}
                className="flex-1"
              />
              <Button size="icon" onClick={handleAddComment} disabled={!newComment.trim()}>
                <Send className="h-4 w-4" />
                <span className="sr-only">Send</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

