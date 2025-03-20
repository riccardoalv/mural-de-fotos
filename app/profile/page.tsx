"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import Header from "@/components/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Save, Upload } from "lucide-react"

export default function ProfilePage() {
  const { user, isAuthenticated, updateProfile } = useAuth()
  const router = useRouter()

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [avatar, setAvatar] = useState("")
  const [success, setSuccess] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Redirecionar se não estiver autenticado
  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login?redirect=/profile")
    } else if (user) {
      setName(user.name)
      setEmail(user.email)
      setAvatar(user.avatar || "")
    }
  }, [isAuthenticated, router, user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSuccess(false)
    setIsSubmitting(true)

    try {
      // Atualizar o perfil
      updateProfile({ name, email, avatar })
      setSuccess(true)

      // Limpar a mensagem de sucesso após 3 segundos
      setTimeout(() => {
        setSuccess(false)
      }, 3000)
    } catch (error) {
      console.error("Erro ao atualizar perfil:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Função simulada para upload de avatar
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return

    const file = e.target.files[0]
    const reader = new FileReader()

    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        setAvatar(reader.result)
      }
    }

    reader.readAsDataURL(file)
  }

  if (!isAuthenticated || !user) {
    return null // Não renderizar nada enquanto verifica autenticação
  }

  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-8 flex justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Seu Perfil</CardTitle>
            <CardDescription>Visualize e edite suas informações de perfil</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {success && (
                <div className="p-3 text-sm text-white bg-green-500 rounded-md">Perfil atualizado com sucesso!</div>
              )}

              <div className="flex flex-col items-center space-y-4">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={avatar || "/placeholder.svg?height=96&width=96"} />
                  <AvatarFallback>{name.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>

                <div className="flex items-center">
                  <Input id="avatar" type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById("avatar")?.click()}
                    size="sm"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Alterar foto
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  "Salvando..."
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Salvar Alterações
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </>
  )
}

