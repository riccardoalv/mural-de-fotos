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

type MediaPreview = {
  id: string;
  file: File;
  preview: string;
  title: string;
  description: string;
  isPublic: boolean;
  type: "image" | "video";
};

export default function UploadPage() {
  const { user, logout } = useAuth();
  const isAuthenticated = Boolean(user);
  const router = useRouter();
  const [selectedMedia, setSelectedMedia] = useState<MediaPreview[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<"images" | "videos">("images");
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!isAuthenticated) router.push("/");
  }, [isAuthenticated, router]);

  useEffect(() => {
    return () =>
      selectedMedia.forEach((media) => URL.revokeObjectURL(media.preview));
  }, [selectedMedia]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const newFiles = Array.from(e.target.files)
      .filter((file) => {
        const isImage = file.type.startsWith("image/");
        const isVideo = file.type.startsWith("video/");
        return isImage || isVideo;
      })
      .map((file) => {
        const isVideo = file.type.startsWith("video/");
        return {
          id: Math.random().toString(36).substring(2, 9),
          file,
          preview: URL.createObjectURL(file),
          title: file.name.split(".")[0],
          description: "",
          isPublic: false,
          type: isVideo ? ("video" as const) : ("image" as const),
        };
      });

    setSelectedMedia((prev) => [...prev, ...newFiles]);
    e.target.value = "";
  };

  const handleRemoveMedia = (id: string) =>
    setSelectedMedia((prev) => {
      const media = prev.find((i) => i.id === id);
      if (media) URL.revokeObjectURL(media.preview);
      return prev.filter((i) => i.id !== id);
    });

  const handleUpdateMediaField = (
    id: string,
    field: keyof MediaPreview,
    value: any,
  ) =>
    setSelectedMedia((prev) =>
      prev.map((media) =>
        media.id === id ? { ...media, [field]: value } : media,
      ),
    );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const token = localStorage.getItem("token");

    try {
      await Promise.all(
        selectedMedia.map(async (media) => {
          const formData = new FormData();
          formData.append("caption", media.title);
          formData.append("public", String(media.isPublic));

          // Usar o mesmo campo "image" para ambos os tipos de mídia
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

  const filteredMedia = selectedMedia.filter((media) =>
    activeTab === "images" ? media.type === "image" : media.type === "video",
  );

  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-6 max-w-4xl">
        <h1 className="text-2xl font-bold mb-6">Enviar Novas Mídias</h1>

        <Tabs
          defaultValue="images"
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
                id="media"
                type="file"
                accept={activeTab === "images" ? "image/*" : "video/*"}
                multiple
                onChange={handleFileChange}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById("media")?.click()}
              >
                <Upload className="h-4 w-4 mr-2" />
                Selecionar {activeTab === "images" ? "Imagens" : "Vídeos"}
              </Button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <TabsContent value="images">
              {filteredMedia.length === 0 ? (
                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                  <ImageIcon className="h-10 w-10 text-muted-foreground mb-2 mx-auto" />
                  <p className="text-sm text-muted-foreground mb-4">
                    Arraste e solte suas imagens ou clique no botão acima para
                    selecionar
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredMedia.map((media) => (
                    <div
                      key={media.id}
                      className="border rounded-lg p-4 space-y-4"
                    >
                      <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100">
                        <Image
                          src={media.preview || "/placeholder.svg"}
                          alt="Preview"
                          fill
                          className="object-contain"
                        />
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2"
                          onClick={() => handleRemoveMedia(media.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <Input
                        value={media.title}
                        onChange={(e) =>
                          handleUpdateMediaField(
                            media.id,
                            "title",
                            e.target.value,
                          )
                        }
                        placeholder="Título"
                        required
                      />
                      <Textarea
                        value={media.description}
                        onChange={(e) =>
                          handleUpdateMediaField(
                            media.id,
                            "description",
                            e.target.value,
                          )
                        }
                        placeholder="Descrição (opcional)"
                        rows={2}
                      />
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={media.isPublic}
                          onCheckedChange={(checked) =>
                            handleUpdateMediaField(
                              media.id,
                              "isPublic",
                              checked === true,
                            )
                          }
                        />
                        <Label>Tornar pública</Label>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="videos">
              {filteredMedia.length === 0 ? (
                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                  <Film className="h-10 w-10 text-muted-foreground mb-2 mx-auto" />
                  <p className="text-sm text-muted-foreground mb-4">
                    Arraste e solte seus vídeos ou clique no botão acima para
                    selecionar
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredMedia.map((media) => (
                    <div
                      key={media.id}
                      className="border rounded-lg p-4 space-y-4"
                    >
                      <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100">
                        <video
                          src={media.preview}
                          className="w-full h-full object-contain"
                          controls
                          muted
                          ref={videoRef}
                        />
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2"
                          onClick={() => handleRemoveMedia(media.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <Input
                        value={media.title}
                        onChange={(e) =>
                          handleUpdateMediaField(
                            media.id,
                            "title",
                            e.target.value,
                          )
                        }
                        placeholder="Título"
                        required
                      />
                      <Textarea
                        value={media.description}
                        onChange={(e) =>
                          handleUpdateMediaField(
                            media.id,
                            "description",
                            e.target.value,
                          )
                        }
                        placeholder="Descrição (opcional)"
                        rows={2}
                      />
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={media.isPublic}
                          onCheckedChange={(checked) =>
                            handleUpdateMediaField(
                              media.id,
                              "isPublic",
                              checked === true,
                            )
                          }
                        />
                        <Label>Tornar pública</Label>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
