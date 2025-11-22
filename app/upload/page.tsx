"use client";

import type React from "react";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import Header from "@/components/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Upload, ImageIcon, X, GripVertical } from "lucide-react";
import Image from "next/image";
import api from "@/lib/api";

type MediaType = "image" | "video";

type MediaPreview = {
  id: string;
  file: File;
  preview: string;
  type: MediaType;
};

type MediaCardProps = {
  media: MediaPreview;
  index: number;
  onRemove: (id: string) => void;
  onDragStart: (index: number) => void;
  onDragEnter: (index: number) => void;
  onDragEnd: () => void;
};

function MediaCard({
  media,
  index,
  onRemove,
  onDragStart,
  onDragEnter,
  onDragEnd,
}: MediaCardProps) {
  return (
    <div
      className="border rounded-lg p-4 space-y-4 bg-background cursor-move"
      draggable
      onDragStart={() => onDragStart(index)}
      onDragEnter={() => onDragEnter(index)}
      onDragEnd={onDragEnd}
      onDragOver={(e) => e.preventDefault()}
    >
      <div className="flex items-center justify-between mb-2 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <GripVertical className="h-4 w-4" />
          <span>Arraste para reordenar</span>
        </div>
      </div>

      <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100">
        {media.type === "image" ? (
          <Image
            src={media.preview || "/placeholder.svg"}
            alt="Preview"
            fill
            className="object-contain"
          />
        ) : (
          <video
            src={media.preview}
            className="w-full h-full object-contain"
            controls
            muted
          />
        )}
        <Button
          variant="destructive"
          size="icon"
          className="absolute top-2 right-2"
          type="button"
          onClick={() => onRemove(media.id)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

type MediaGridProps = {
  media: MediaPreview[];
  emptyIcon: React.ReactNode;
  emptyTitle: string;
  emptyDescription: string;
  onRemove: (id: string) => void;
  onDragStart: (index: number) => void;
  onDragEnter: (index: number) => void;
  onDragEnd: () => void;
};

function MediaGrid({
  media,
  emptyIcon,
  emptyTitle,
  emptyDescription,
  onRemove,
  onDragStart,
  onDragEnter,
  onDragEnd,
}: MediaGridProps) {
  if (media.length === 0) {
    return (
      <div className="border-2 border-dashed rounded-lg p-8 text-center">
        <div className="h-10 w-10 text-muted-foreground mb-2 mx-auto">
          {emptyIcon}
        </div>
        <p className="text-sm font-medium mb-1">{emptyTitle}</p>
        <p className="text-sm text-muted-foreground">{emptyDescription}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {media.map((item, index) => (
        <MediaCard
          key={item.id}
          media={item}
          index={index}
          onRemove={onRemove}
          onDragStart={onDragStart}
          onDragEnter={onDragEnter}
          onDragEnd={onDragEnd}
        />
      ))}
    </div>
  );
}

export default function UploadPage() {
  const { user } = useAuth();
  const isAuthenticated = Boolean(user);
  const router = useRouter();

  const [selectedMedia, setSelectedMedia] = useState<MediaPreview[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Campos do POST (um único post)
  const [caption, setCaption] = useState("");
  const [isPostPublic, setIsPostPublic] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // refs para drag & drop
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  useEffect(() => {
    if (!isAuthenticated) router.push("/");
  }, [isAuthenticated, router]);

  useEffect(
    () => () =>
      selectedMedia.forEach((media) => URL.revokeObjectURL(media.preview)),
    [selectedMedia],
  );

  const handleSelectFiles = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const filesArray = Array.from(e.target.files);

    const newMedia = filesArray
      .filter((file) => {
        const isImage = file.type.startsWith("image/");
        const isVideo = file.type.startsWith("video/");
        return isImage || isVideo;
      })
      .map<MediaPreview>((file) => {
        const isVideo = file.type.startsWith("video/");
        return {
          id: Math.random().toString(36).slice(2),
          file,
          preview: URL.createObjectURL(file),
          type: isVideo ? "video" : "image",
        };
      });

    // a ordem que o usuário escolheu entra aqui
    setSelectedMedia((prev) => [...prev, ...newMedia]);
    e.target.value = "";
  };

  const handleRemoveMedia = (id: string) => {
    setSelectedMedia((prev) => {
      const media = prev.find((item) => item.id === id);
      if (media) URL.revokeObjectURL(media.preview);
      return prev.filter((item) => item.id !== id);
    });
  };

  // Drag and drop handlers
  const handleDragStart = (position: number) => {
    dragItem.current = position;
  };

  const handleDragEnter = (position: number) => {
    dragOverItem.current = position;
  };

  const handleDragEnd = () => {
    if (
      dragItem.current === null ||
      dragOverItem.current === null ||
      dragItem.current === dragOverItem.current
    ) {
      dragItem.current = null;
      dragOverItem.current = null;
      return;
    }

    setSelectedMedia((prev) => {
      const updated = [...prev];
      const item = updated[dragItem.current as number];
      updated.splice(dragItem.current as number, 1);
      updated.splice(dragOverItem.current as number, 0, item);
      return updated;
    });

    dragItem.current = null;
    dragOverItem.current = null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMedia.length) return;

    setIsSubmitting(true);
    const token = localStorage.getItem("token");

    try {
      const formData = new FormData();

      // Campos do post (um único registro)
      formData.append("caption", caption);
      formData.append("public", String(isPostPublic));

      // Array de mídias (ordem = ordem do array)
      selectedMedia.forEach((media) => {
        formData.append("media", media.file, media.file.name);
      });

      await api.post("/posts", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      router.push("/");
    } catch (error) {
      console.error("Erro ao enviar os arquivos:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-6 max-w-4xl">
        <h1 className="text-2xl font-bold mb-6">Enviar Novas Mídias</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Campos do post */}
          <div className="space-y-4 border rounded-lg p-4">
            <div className="space-y-2">
              <Label htmlFor="caption">Legenda do post</Label>
              <Textarea
                id="caption"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Escreva uma legenda para este post"
                rows={2}
                required
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="post-public"
                checked={isPostPublic}
                onCheckedChange={(checked) => setIsPostPublic(checked === true)}
              />
              <Label htmlFor="post-public">Post público</Label>
            </div>
          </div>

          {/* Seletor de arquivos */}
          <div className="flex justify-between items-center mb-4">
            <div>
              <Input
                ref={fileInputRef}
                id="media"
                type="file"
                accept="image/*,video/*"
                multiple
                onChange={handleFileChange}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleSelectFiles}
              >
                <Upload className="h-4 w-4 mr-2" />
                Selecionar arquivos
              </Button>
            </div>
          </div>

          <MediaGrid
            media={selectedMedia}
            emptyIcon={<ImageIcon className="inline-block mr-1" />}
            emptyTitle="Nenhuma mídia selecionada"
            emptyDescription="Selecione imagens e vídeos usando o botão acima e arraste para reordenar."
            onRemove={handleRemoveMedia}
            onDragStart={handleDragStart}
            onDragEnter={handleDragEnter}
            onDragEnd={handleDragEnd}
          />

          {selectedMedia.length > 0 && (
            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting || !selectedMedia.length}
            >
              {isSubmitting
                ? "Enviando..."
                : `Enviar ${selectedMedia.length} arquivo(s) na ordem atual`}
            </Button>
          )}
        </form>
      </main>
    </>
  );
}
