import Link from "next/link";
import { Github, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/header";

export default function AboutPage() {
  return (
    <>
      <Header />
      <main className="container max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Button variant="ghost" asChild className="mb-4">
            <Link href="/" className="flex items-center">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para o mural
            </Link>
          </Button>

          <h1 className="text-3xl font-bold mb-2">Sobre o Mural UNIR</h1>
          <p className="text-muted-foreground">
            Uma plataforma para compartilhar momentos da comunidade acadêmica
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">O Projeto</h2>
            <p>
              O Mural UNIR é uma plataforma de compartilhamento de fotos
              desenvolvida para a comunidade da Universidade Federal de
              Rondônia. O projeto permite que estudantes, professores e
              funcionários compartilhem momentos e experiências do dia a dia
              acadêmico.
            </p>
            <p>
              A aplicação foi construída utilizando tecnologias modernas como
              Next.js para o frontend e uma API RESTful para o backend,
              proporcionando uma experiência fluida e responsiva.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Recursos</h2>
            <ul className="space-y-2 list-disc pl-5">
              <li>
                Layout de grade em estilo masonry para visualização de fotos
              </li>
              <li>Carregamento infinito para navegação contínua</li>
              <li>Sistema de autenticação de usuários</li>
              <li>Funcionalidades de curtir e comentar em fotos</li>
              <li>Upload de imagens</li>
              <li>Design responsivo para todos os dispositivos</li>
              <li>Suporte a modo claro e escuro</li>
            </ul>
          </div>
        </div>

        {/* Section de Classificação da IA */}
        <div className="mt-10 pt-6 border-t pb-6">
          <div className="text-center space-y-4">
            <h2 className="text-xl font-semibold">Classificação de Rostos</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Ajude a treinar e melhorar o classificador de rostos do Mural
              UNIR. Basta acessar a ferramenta e identificar quem é quem nas
              fotos.
            </p>

            <Button asChild className="mx-auto">
              <Link href="/detect-faces">Ajude a classificar minha IA</Link>
            </Button>
          </div>
        </div>

        {/* divisor antes do código fonte */}
        <div className="border-t mt-10 pt-6"></div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Código Fonte</h2>
          <p>
            Este projeto é open source e está disponível no GitHub. Sinta-se à
            vontade para explorar o código, reportar problemas ou contribuir com
            melhorias.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <Link
              href="https://github.com/riccardoalv/mural-de-fotos"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 p-4 border rounded-lg hover:bg-accent transition-colors"
            >
              <Github className="h-5 w-5" />
              <div>
                <p className="font-medium">Frontend</p>
                <p className="text-sm text-muted-foreground">
                  github.com/riccardoalv/mural-de-fotos
                </p>
              </div>
            </Link>

            <Link
              href="https://github.com/riccardoalv/mural-de-fotos-backend"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 p-4 border rounded-lg hover:bg-accent transition-colors"
            >
              <Github className="h-5 w-5" />
              <div>
                <p className="font-medium">Backend</p>
                <p className="text-sm text-muted-foreground">
                  github.com/riccardoalv/mural-de-fotos-backend
                </p>
              </div>
            </Link>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t text-center text-sm text-muted-foreground">
          <p>
            © {new Date().getFullYear()} Mural UNIR. Desenvolvido por Riccardo.
          </p>
        </div>
      </main>
    </>
  );
}
