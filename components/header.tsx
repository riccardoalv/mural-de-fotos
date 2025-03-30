"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Upload,
  LogIn,
  LogOut,
  UserCircle,
  UserPlus,
  Menu,
  X,
} from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useIsClient } from "@/hooks/use-is-client";

export default function Header() {
  const isClient = useIsClient();
  const { user, logout } = useAuth();
  const isAuthenticated = isClient && Boolean(user);
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSubmitPhoto = () => {
    if (isAuthenticated) {
      router.push("/upload");
    } else {
      router.push("/login?redirect=/upload");
    }
  };

  // Close mobile menu when route changes
  useEffect(() => {
    const handleRouteChange = () => {
      setMobileMenuOpen(false);
    };

    window.addEventListener("popstate", handleRouteChange);
    return () => {
      window.removeEventListener("popstate", handleRouteChange);
    };
  }, []);

  return (
    <header className="border-b sticky top-0 bg-background z-50">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link href="/" className="text-xl font-bold">
          Mural UNIR
        </Link>

        {/* Mobile menu button */}
        <button
          className="md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? "Fechar menu" : "Abrir menu"}
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>

        {/* Desktop navigation */}
        <div className="hidden md:flex items-center gap-2">
          <ThemeToggle />

          <Button variant="ghost" size="sm" asChild>
            <Link href="/about">Sobre</Link>
          </Button>

          <Button variant="outline" onClick={handleSubmitPhoto}>
            <Upload className="h-4 w-4 mr-2" />
            <span>Enviar Foto</span>
          </Button>

          {isClient && (
            <>
              {isAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="relative h-8 w-8 rounded-full"
                      aria-label="Menu do usuário"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage
                          src={
                            user?.avatarUrl ||
                            "/placeholder.svg?height=32&width=32"
                          }
                          alt={user?.name || "Avatar do usuário"}
                        />
                        <AvatarFallback>
                          {user?.name?.charAt(0).toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <div className="flex flex-col space-y-1 p-2">
                      <p className="text-sm font-medium leading-none">
                        {user?.name}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user?.email}
                      </p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link
                        href="/profile"
                        className="flex items-center w-full"
                      >
                        <UserCircle className="mr-2 h-4 w-4" />
                        <span>Perfil</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => logout()}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Sair</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="flex items-center gap-2">
                  <Button variant="outline" asChild>
                    <Link href="/register" className="flex items-center">
                      <UserPlus className="h-4 w-4 mr-2" />
                      <span>Criar Conta</span>
                    </Link>
                  </Button>
                  <Button asChild>
                    <Link href="/login" className="flex items-center">
                      <LogIn className="h-4 w-4 mr-2" />
                      <span>Login</span>
                    </Link>
                  </Button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Mobile navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-x-0 top-[57px] bg-background border-b shadow-lg z-40">
            <div className="flex flex-col p-4 space-y-3">
              <Button
                variant="outline"
                onClick={handleSubmitPhoto}
                className="justify-start"
              >
                <Upload className="h-4 w-4 mr-2" />
                <span>Enviar Foto</span>
              </Button>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Tema</span>
                <ThemeToggle />
              </div>

              <Button variant="ghost" asChild className="justify-start w-full">
                <Link href="/about">
                  <span>Sobre</span>
                </Link>
              </Button>

              <div className="h-px bg-border my-1" />

              {isClient && (
                <>
                  {isAuthenticated ? (
                    <>
                      {user?.name && (
                        <div className="flex items-center space-x-3 py-2">
                          <Avatar className="h-10 w-10">
                            <AvatarImage
                              src={
                                user?.avatarUrl ||
                                "/placeholder.svg?height=40&width=40"
                              }
                              alt={user?.name || "Avatar do usuário"}
                            />
                            <AvatarFallback>
                              {user?.name?.charAt(0).toUpperCase() || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">{user?.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {user?.email}
                            </p>
                          </div>
                        </div>
                      )}

                      <Button
                        variant="outline"
                        asChild
                        className="justify-start"
                      >
                        <Link href="/profile">
                          <UserCircle className="mr-2 h-4 w-4" />
                          <span>Perfil</span>
                        </Link>
                      </Button>

                      <Button
                        variant="outline"
                        className="justify-start text-destructive border-destructive hover:bg-destructive/10"
                        onClick={() => {
                          logout();
                          setMobileMenuOpen(false);
                        }}
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Sair</span>
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button asChild>
                        <Link
                          href="/login"
                          className="flex items-center justify-center"
                        >
                          <LogIn className="h-4 w-4 mr-2" />
                          <span>Login</span>
                        </Link>
                      </Button>

                      <Button variant="outline" asChild>
                        <Link
                          href="/register"
                          className="flex items-center justify-center"
                        >
                          <UserPlus className="h-4 w-4 mr-2" />
                          <span>Criar Conta</span>
                        </Link>
                      </Button>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
