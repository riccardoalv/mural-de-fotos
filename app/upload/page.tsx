"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import Header from "@/components/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Upload, ImageIcon, X, Plus } from "lucide-react"
import Image from "next/image"

type ImagePreview = {
  id: string
  file: File
  preview: string
  title: string
  description: string
  isPublic: boolean
}

export default function UploadPage() {
  const { isAuthenticated } = useAuth()
  const router = useRouter()
  const [selectedImages, setSelectedImages] = useState<ImagePreview[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Verificar se o usuário está autenticado
  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/")
    }
  }, [isAuthenticated, router])

  // Limpar URLs de objeto quando o componente for desmontado
  useEffect(() => {
    return () => {
      selectedImages.forEach((img) => URL.revokeObjectURL(img.preview))
    }
  }, [selectedImages])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      return
    }

    const newImages: ImagePreview[] = []

    Array.from(e.target.files).forEach((file) => {
      if (file.type.startsWith("image/")) {
        newImages.push({
          id: Math.random().toString(36).substring(2, 9),
          file,
          preview: URL.createObjectURL(file),
          title: file.name.split(".")[0], // Nome do arquivo como título padrão
          description: "",
          isPublic: false, // Padrão: privado
        })
      }
    })

    setSelectedImages((prev) => [...prev, ...newImages])

    // Limpar o input para permitir selecionar os mesmos arquivos novamente
    e.target.value = ""
  }

  const handleRemoveImage = (id: string) => {
    setSelectedImages((prev) => {
      const imageToRemove = prev.find((img) => img.id === id)
      if (imageToRemove) {
        URL.revokeObjectURL(imageToRemove.preview)
      }
      return prev.filter((img) => img.id !== id)
    })
  }

  const handleUpdateImageField = (id: string, field: keyof ImagePreview, value: any) => {
    setSelectedImages((prev) => prev.map((img) => (img.id === id ? { ...img, [field]: value } : img)))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (selectedImages.length === 0) {
      alert("Por favor, selecione pelo menos uma imagem.")
      return
    }

    // Verificar se todas as imagens têm título
    const missingTitles = selectedImages.some((img) => !img.title.trim())
    if (missingTitles) {
      alert("Por favor, adicione um título para todas as imagens.")
      return
    }

    setIsSubmitting(true)

    try {
      // Simulação de upload - em um app real, isso seria uma chamada API
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Redirecionar para a página principal após o "upload"
      alert(`${selectedImages.length} foto(s) enviada(s) com sucesso!`)
      router.push("/")
    } catch (error) {
      console.error("Erro ao enviar as fotos:", error)
      alert("Ocorreu um erro ao enviar as fotos. Tente novamente.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-6 max-w-4xl">
        <h1 className="text-2xl font-bold mb-6">Enviar Novas Fotos</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="photo">Selecionar Fotos</Label>

            {selectedImages.length === 0 ? (
              <div className="border-2 border-dashed rounded-lg p-8 text-center">
                <div className="flex flex-col items-center">
                  <ImageIcon className="h-10 w-10 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground mb-4">
                    Arraste e solte suas fotos aqui ou clique para selecionar
                  </p>
                  <Input
                    id="photo"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <Button type="button" variant="outline" onClick={() => document.getElementById("photo")?.click()}>
                    <Upload className="h-4 w-4 mr-2" />
                    Selecionar Arquivos
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-medium">{selectedImages.length} foto(s) selecionada(s)</h2>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById("photo")?.click()}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar mais
                  </Button>
                  <Input
                    id="photo"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {selectedImages.map((img) => (
                    <div key={img.id} className="border rounded-lg p-4 space-y-4">
                      <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                        <Image src={img.preview || "/placeholder.svg"} alt="Preview" fill className="object-contain" />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2"
                          onClick={() => handleRemoveImage(img.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="space-y-3">
                        <div className="space-y-1">
                          <Label htmlFor={`title-${img.id}`}>Título</Label>
                          <Input
                            id={`title-${img.id}`}
                            value={img.title}
                            onChange={(e) => handleUpdateImageField(img.id, "title", e.target.value)}
                            placeholder="Digite um título para sua foto"
                            required
                          />
                        </div>

                        <div className="space-y-1">
                          <Label htmlFor={`description-${img.id}`}>Descrição</Label>
                          <Textarea
                            id={`description-${img.id}`}
                            value={img.description}
                            onChange={(e) => handleUpdateImageField(img.id, "description", e.target.value)}
                            placeholder="Descreva sua foto (opcional)"
                            rows={2}
                          />
                        </div>

                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`public-${img.id}`}
                            checked={img.isPublic}
                            onCheckedChange={(checked) => handleUpdateImageField(img.id, "isPublic", checked === true)}
                          />
                          <Label htmlFor={`public-${img.id}`} className="text-sm font-normal">
                            Tornar esta foto pública
                          </Label>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting || selectedImages.length === 0}>
            {isSubmitting ? "Enviando..." : `Enviar ${selectedImages.length} foto(s)`}
          </Button>
        </form>
      </main>
    </>
  )
}

