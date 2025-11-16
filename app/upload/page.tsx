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
import { Upload, ImageIcon, X, Film } from "lucide-react";
import Image from "next/image";
import api from "@/lib/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type MediaType = "image" | "video";

type MediaPreview = {
  id: string;
  file: File;
  preview: string;
  title: string;
  description: string;
  isPublic: boolean;
  type: MediaType;
};

type MediaCardProps = {
  media: MediaPreview;
  onRemove: (id: string) => void;
  onChange: (
    id: string,
    field: keyof MediaPreview,
    value: string | boolean,
  ) => void;
};

function MediaCard({ media, onRemove, onChange }: MediaCardProps) {
  return (
    <div className="border rounded-lg p-4 space-y-4">
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

      <Input
        value={media.title}
        onChange={(e) => onChange(media.id, "title", e.target.value)}
        placeholder="Título"
        required
      />

      <Textarea
        value={media.description}
        onChange={(e) => onChange(media.id, "description", e.target.value)}
        placeholder="Descrição (opcional)"
        rows={2}
      />

      <div className="flex items-center space-x-2">
        <Checkbox
          checked={media.isPublic}
          onCheckedChange={(checked) =>
            onChange(media.id, "isPublic", checked === true)
          }
        />
        <Label>Tornar pública</Label>
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
  onChange: (
    id: string,
    field: keyof MediaPreview,
    value: string | boolean,
  ) => void;
};

function MediaGrid({
  media,
  emptyIcon,
  emptyTitle,
  emptyDescription,
  onRemove,
  onChange,
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
      {media.map((item) => (
        <MediaCard
          key={item.id}
          media={item}
          onRemove={onRemove}
          onChange={onChange}
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
  const [activeTab, setActiveTab] = useState<"images" | "videos">("images");

  const fileInputRef = useRef<HTMLInputElement | null>(null);

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
          title: file.name.split(".")[0],
          description: "",
          isPublic: false,
          type: isVideo ? "video" : "image",
        };
      });

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

  const handleUpdateMediaField = (
    id: string,
    field: keyof MediaPreview,
    value: string | boolean,
  ) => {
    setSelectedMedia((prev) =>
      prev.map((media) =>
        media.id === id ? { ...media, [field]: value } : media,
      ),
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMedia.length) return;

    setIsSubmitting(true);
    const token = localStorage.getItem("token");

    try {
      await Promise.all(
        selectedMedia.map(async (media) => {
          const formData = new FormData();
          formData.append("caption", media.title);
          formData.append("description", media.description);
          formData.append("public", String(media.isPublic));
          formData.append("image", media.file, media.file.name);

          await api.post("/posts", formData, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data",
            },
          });
        }),
      );

      router.push("/");
    } catch (error) {
      console.error("Erro ao enviar os arquivos:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredMedia =
    activeTab === "images"
      ? selectedMedia.filter((media) => media.type === "image")
      : selectedMedia.filter((media) => media.type === "video");

  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-6 max-w-4xl">
        <h1 className="text-2xl font-bold mb-6">Enviar Novas Mídias</h1>

        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as "images" | "videos")}
        >
          <div className="flex justify-between items-center mb-4">
            <TabsList>
              <TabsTrigger value="images" className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                Imagens
              </TabsTrigger>
              <TabsTrigger value="videos" className="flex items-center gap-2">
                <Film className="h-4 w-4" />
                Vídeos
              </TabsTrigger>
            </TabsList>

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

          <form onSubmit={handleSubmit} className="space-y-6">
            <TabsContent value="images">
              <MediaGrid
                media={filteredMedia}
                emptyIcon={<ImageIcon />}
                emptyTitle="Nenhuma imagem selecionada"
                emptyDescription="Selecione imagens usando o botão acima."
                onRemove={handleRemoveMedia}
                onChange={handleUpdateMediaField}
              />
            </TabsContent>

            <TabsContent value="videos">
              <MediaGrid
                media={filteredMedia}
                emptyIcon={<Film />}
                emptyTitle="Nenhum vídeo selecionado"
                emptyDescription="Selecione vídeos usando o botão acima."
                onRemove={handleRemoveMedia}
                onChange={handleUpdateMediaField}
              />
            </TabsContent>

            {selectedMedia.length > 0 && (
              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting || !selectedMedia.length}
              >
                {isSubmitting
                  ? "Enviando..."
                  : `Enviar ${selectedMedia.length} arquivo(s)`}
              </Button>
            )}
          </form>
        </Tabs>
      </main>
    </>
  );
}
