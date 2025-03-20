import { Search } from "lucide-react"
import PhotoGrid from "@/components/photo-grid"
import { Input } from "@/components/ui/input"
import Header from "@/components/header"

export default function Home() {
  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-3">Mural de Fotos - Ciência da Computação UNIR</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Bem-vindo ao mural de fotos do curso de Ciência da Computação da UNIR. Este espaço foi criado para
            compartilhar visualizações, diagramas e projetos relacionados às disciplinas do curso. Explore as imagens,
            comente e interaja com os trabalhos dos seus colegas e professores.
          </p>
        </div>

        <div className="flex items-center space-x-2 mb-8 max-w-md mx-auto">
          <div className="relative w-full">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input type="search" placeholder="Pesquisar fotos..." className="w-full pl-8" />
          </div>
        </div>
        <PhotoGrid />
      </main>
    </>
  )
}

