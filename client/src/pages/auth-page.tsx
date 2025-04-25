import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const loginSchema = z.object({
  username: z.string().min(1, "Nome de usuário é obrigatório"),
  password: z.string().min(1, "Senha é obrigatória"),
});

const registerSchema = z.object({
  username: z.string().min(3, "Nome de usuário deve ter pelo menos 3 caracteres"),
  password: z
    .string()
    .min(8, "Senha deve ter pelo menos 8 caracteres")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Senha deve conter pelo menos uma letra maiúscula, uma letra minúscula e um número"
    ),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const [location, navigate] = useLocation();
  const { user, loginMutation, registerMutation, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("login");

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  const onLoginSubmit = (data: LoginFormValues) => {
    loginMutation.mutate(data);
  };

  const onRegisterSubmit = (data: RegisterFormValues) => {
    const { confirmPassword, ...registerData } = data;
    registerMutation.mutate(registerData);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Formulário de Autenticação */}
      <div className="flex flex-col justify-center items-center w-full md:w-1/2 p-6">
        <div className="w-full max-w-md">
          <Card>
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold">
                Sistema de Repositório de Clientes
              </CardTitle>
              <CardDescription>
                {activeTab === "login"
                  ? "Entre para gerenciar os repositórios de seus clientes"
                  : "Crie uma conta para começar"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs
                defaultValue="login"
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="login">Entrar</TabsTrigger>
                  <TabsTrigger value="register">Registrar</TabsTrigger>
                </TabsList>

                <TabsContent value="login">
                  <Form {...loginForm}>
                    <form
                      onSubmit={loginForm.handleSubmit(onLoginSubmit)}
                      className="space-y-4"
                    >
                      <FormField
                        control={loginForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email ou Nome de Usuário</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="admin@exemplo.com"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={loginForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Senha</FormLabel>
                            <FormControl>
                              <Input
                                type="password"
                                placeholder="••••••••"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button
                        type="submit"
                        className="w-full"
                        disabled={loginMutation.isPending}
                      >
                        {loginMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Entrando...
                          </>
                        ) : (
                          "Entrar"
                        )}
                      </Button>
                    </form>
                  </Form>
                </TabsContent>

                <TabsContent value="register">
                  <Form {...registerForm}>
                    <form
                      onSubmit={registerForm.handleSubmit(onRegisterSubmit)}
                      className="space-y-4"
                    >
                      <FormField
                        control={registerForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email ou Nome de Usuário</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="admin@exemplo.com"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Senha</FormLabel>
                            <FormControl>
                              <Input
                                type="password"
                                placeholder="••••••••"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirmar Senha</FormLabel>
                            <FormControl>
                              <Input
                                type="password"
                                placeholder="••••••••"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button
                        type="submit"
                        className="w-full"
                        disabled={registerMutation.isPending}
                      >
                        {registerMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Criando...
                          </>
                        ) : (
                          "Criar Conta"
                        )}
                      </Button>
                    </form>
                  </Form>
                </TabsContent>
              </Tabs>
            </CardContent>
            <CardFooter className="justify-center">
              <p className="text-sm text-gray-500">
                {activeTab === "login"
                  ? "Não tem uma conta? "
                  : "Já tem uma conta? "}
                <button
                  type="button"
                  className="text-primary hover:underline"
                  onClick={() =>
                    setActiveTab(activeTab === "login" ? "register" : "login")
                  }
                >
                  {activeTab === "login" ? "Registre-se" : "Entre"}
                </button>
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>

      {/* Seção Hero */}
      <div className="hidden md:flex md:w-1/2 bg-primary flex-col justify-center items-center p-10 text-white">
        <div className="max-w-md text-center">
          <h1 className="text-4xl font-bold mb-6">Repositório de Mídia para Clientes</h1>
          <p className="text-xl mb-8">
            Crie repositórios de mídia exclusivos para seus clientes com acesso seguro e gerenciamento fácil.
          </p>
          <div className="space-y-6">
            <div className="flex items-center">
              <div className="rounded-full bg-white/20 p-2 mr-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect width="18" height="18" x="3" y="3" rx="2" />
                  <circle cx="9" cy="9" r="2" />
                  <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                </svg>
              </div>
              <p className="text-left">Carregue e organize fotos para clientes</p>
            </div>
            <div className="flex items-center">
              <div className="rounded-full bg-white/20 p-2 mr-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m14 12-8.5 8.5a2.12 2.12 0 1 1-3-3L11 9" />
                  <path d="M14.5 9.5 18 6" />
                  <path d="m16 16 6-6" />
                  <path d="M8.5 8.5 6 11" />
                  <path d="M16 6 6 16" />
                </svg>
              </div>
              <p className="text-left">Incorpore vídeos do YouTube nos repositórios de clientes</p>
            </div>
            <div className="flex items-center">
              <div className="rounded-full bg-white/20 p-2 mr-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
              </div>
              <p className="text-left">Forneça links de acesso seguros e exclusivos para clientes</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
