import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { AdminLayout } from "@/components/admin-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { FileInput } from "@/components/ui/file-input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  User, 
  Settings, 
  PaintBucket, 
  Image as ImageIcon, 
  Lock, 
  Bell, 
  Database, 
  Infinity as InfinityIcon 
} from "lucide-react";

// Perfil do Usuário
const profileFormSchema = z.object({
  firstName: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  lastName: z.string().min(2, "Sobrenome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Digite um email válido"),
});

// Segurança
const passwordFormSchema = z.object({
  currentPassword: z.string().min(1, "Senha atual é obrigatória"),
  newPassword: z
    .string()
    .min(8, "Senha deve ter pelo menos 8 caracteres")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Senha deve conter pelo menos uma letra maiúscula, uma minúscula e um número"
    ),
  confirmPassword: z.string().min(1, "Confirme sua senha"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

// Notificações
const notificationFormSchema = z.object({
  emailNotifications: z.boolean().default(true),
  browserNotifications: z.boolean().default(true),
});

// Configurações do Sistema
const systemSettingsSchema = z.object({
  linkExpiry: z.boolean().default(false), // Links não expiram por padrão
  uploadQuality: z.enum(["low", "medium", "high", "original"]).default("original"),
  videoQuality: z.enum(["low", "medium", "high", "auto", "original"]).default("original"),
  maxUploadSize: z.enum(["10mb", "50mb", "100mb", "500mb", "1gb", "unlimited"]).default("unlimited"),
  batchUpload: z.boolean().default(true),
  compressImages: z.boolean().default(false)
});

// Aparência
const appearanceSchema = z.object({
  theme: z.enum(["system", "light", "dark"]).default("system"),
  primaryColor: z.string().default("#0091ff"),
  accentColor: z.string().default("#6941C6"),
  fontSize: z.enum(["small", "default", "large"]).default("default"),
  borderRadius: z.enum(["none", "small", "default", "large", "full"]).default("default"),
  customCss: z.string().optional(),
});

// Marca
const brandingSchema = z.object({
  siteName: z.string().min(2, "Nome do site deve ter pelo menos 2 caracteres").default("Repositório de Mídia"),
  siteDescription: z.string().optional(),
  logo: z.any().optional(), // Para arquivo de upload
  favicon: z.any().optional(), // Para arquivo de upload
  clientPageHeader: z.string().optional(),
  clientPageFooter: z.string().optional(),
});

// Variáveis de Tipos
type ProfileFormValues = z.infer<typeof profileFormSchema>;
type PasswordFormValues = z.infer<typeof passwordFormSchema>;
type NotificationFormValues = z.infer<typeof notificationFormSchema>;
type SystemSettingsValues = z.infer<typeof systemSettingsSchema>;
type AppearanceValues = z.infer<typeof appearanceSchema>;
type BrandingValues = z.infer<typeof brandingSchema>;

export default function SettingsPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const logoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);
  
  // Estado para armazenamento
  const [storageUsed] = useState(4.2); // Em GB - apenas para exibição, sem limites reais
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [faviconPreview, setFaviconPreview] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("profile");

  // Configuração dos forms
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      firstName: "Admin",
      lastName: "User",
      email: user?.username || "",
    },
  });

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const notificationForm = useForm<NotificationFormValues>({
    resolver: zodResolver(notificationFormSchema),
    defaultValues: {
      emailNotifications: true,
      browserNotifications: true,
    },
  });

  const systemSettingsForm = useForm<SystemSettingsValues>({
    resolver: zodResolver(systemSettingsSchema),
    defaultValues: {
      linkExpiry: false,
      uploadQuality: "original",
      videoQuality: "original",
      maxUploadSize: "unlimited",
      batchUpload: true,
      compressImages: false
    },
  });
  
  const appearanceForm = useForm<AppearanceValues>({
    resolver: zodResolver(appearanceSchema),
    defaultValues: {
      theme: "system",
      primaryColor: "#0091ff",
      accentColor: "#6941C6",
      fontSize: "default",
      borderRadius: "default",
      customCss: ""
    }
  });
  
  const brandingForm = useForm<BrandingValues>({
    resolver: zodResolver(brandingSchema),
    defaultValues: {
      siteName: "Repositório de Mídia",
      siteDescription: "Repositório de mídia seguro para meus clientes",
      clientPageHeader: "",
      clientPageFooter: ""
    }
  });

  // Mutations
  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormValues) => {
      const res = await apiRequest("PUT", "/api/settings/profile", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Perfil atualizado",
        description: "Suas informações pessoais foram atualizadas com sucesso",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updatePasswordMutation = useMutation({
    mutationFn: async (data: PasswordFormValues) => {
      const res = await apiRequest("PUT", "/api/settings/password", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Senha atualizada",
        description: "Sua senha foi atualizada com sucesso",
      });
      passwordForm.reset({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateNotificationsMutation = useMutation({
    mutationFn: async (data: NotificationFormValues) => {
      const res = await apiRequest("PUT", "/api/settings/notifications", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Notificações atualizadas",
        description: "Suas preferências de notificação foram atualizadas",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateSystemSettingsMutation = useMutation({
    mutationFn: async (data: SystemSettingsValues) => {
      const res = await apiRequest("PUT", "/api/settings/system", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Configurações atualizadas",
        description: "As configurações do sistema foram atualizadas com sucesso",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const updateAppearanceMutation = useMutation({
    mutationFn: async (data: AppearanceValues) => {
      const res = await apiRequest("PUT", "/api/settings/appearance", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Aparência atualizada",
        description: "As configurações de aparência foram atualizadas com sucesso",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const updateBrandingMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const res = await fetch('/api/settings/branding', {
        method: 'POST',
        body: data,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Marca atualizada",
        description: "As configurações de marca foram atualizadas com sucesso",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handlers
  const onSubmitProfile = (data: ProfileFormValues) => {
    updateProfileMutation.mutate(data);
  };

  const onSubmitPassword = (data: PasswordFormValues) => {
    updatePasswordMutation.mutate(data);
  };

  const onSubmitNotifications = (data: NotificationFormValues) => {
    updateNotificationsMutation.mutate(data);
  };

  const onSubmitSystemSettings = (data: SystemSettingsValues) => {
    updateSystemSettingsMutation.mutate(data);
  };
  
  const onSubmitAppearance = (data: AppearanceValues) => {
    updateAppearanceMutation.mutate(data);
  };
  
  const onSubmitBranding = (data: BrandingValues) => {
    const formData = new FormData();
    
    // Adicionar texto de campos
    formData.append('siteName', data.siteName);
    if (data.siteDescription) formData.append('siteDescription', data.siteDescription);
    if (data.clientPageHeader) formData.append('clientPageHeader', data.clientPageHeader);
    if (data.clientPageFooter) formData.append('clientPageFooter', data.clientPageFooter);
    
    // Adicionar arquivos
    if (data.logo && data.logo[0]) formData.append('logo', data.logo[0]);
    if (data.favicon && data.favicon[0]) formData.append('favicon', data.favicon[0]);
    
    updateBrandingMutation.mutate(formData);
  };
  
  const handleFilesSelected = (files: File[], type: 'logo' | 'favicon') => {
    if (files.length === 0) return;
    
    const file = files[0];
    const reader = new FileReader();
    
    reader.onload = (e) => {
      if (type === 'logo') {
        setLogoPreview(e.target?.result as string);
        brandingForm.setValue('logo', files);
      } else {
        setFaviconPreview(e.target?.result as string);
        brandingForm.setValue('favicon', files);
      }
    };
    
    reader.readAsDataURL(file);
  };

  return (
    <AdminLayout title="Configurações">
      <div className="container mx-auto py-6">
        <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-8">
          {/* Sidebar de Navegação */}
          <div className="hidden md:block space-y-6">
            <Card>
              <CardContent className="p-4">
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold mb-4 px-2">Configurações</h3>
                  <Button 
                    variant={activeTab === "profile" ? "default" : "ghost"} 
                    className="w-full justify-start" 
                    onClick={() => setActiveTab("profile")}
                  >
                    <User className="h-4 w-4 mr-2" />
                    Perfil
                  </Button>
                  <Button 
                    variant={activeTab === "security" ? "default" : "ghost"} 
                    className="w-full justify-start" 
                    onClick={() => setActiveTab("security")}
                  >
                    <Lock className="h-4 w-4 mr-2" />
                    Segurança
                  </Button>
                  <Button 
                    variant={activeTab === "notifications" ? "default" : "ghost"} 
                    className="w-full justify-start" 
                    onClick={() => setActiveTab("notifications")}
                  >
                    <Bell className="h-4 w-4 mr-2" />
                    Notificações
                  </Button>
                  <Button 
                    variant={activeTab === "system" ? "default" : "ghost"} 
                    className="w-full justify-start" 
                    onClick={() => setActiveTab("system")}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Sistema
                  </Button>
                  <Button 
                    variant={activeTab === "appearance" ? "default" : "ghost"} 
                    className="w-full justify-start" 
                    onClick={() => setActiveTab("appearance")}
                  >
                    <PaintBucket className="h-4 w-4 mr-2" />
                    Aparência
                  </Button>
                  <Button 
                    variant={activeTab === "branding" ? "default" : "ghost"} 
                    className="w-full justify-start" 
                    onClick={() => setActiveTab("branding")}
                  >
                    <ImageIcon className="h-4 w-4 mr-2" />
                    Marca
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            {/* Cartão de Armazenamento */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2 mb-2">
                  <Database className="h-6 w-6 text-primary" />
                  <h3 className="text-lg font-medium">Armazenamento</h3>
                </div>
                <div className="mt-3">
                  <div className="flex justify-between mb-1 items-center">
                    <span className="text-sm text-gray-500">{storageUsed.toFixed(1)} GB</span>
                    <div className="flex items-center text-green-600">
                      <InfinityIcon className="h-4 w-4 mr-1" />
                      <span className="text-xs">Ilimitado</span>
                    </div>
                  </div>
                  <Progress value={15} className="h-2 bg-gray-100" />
                  <p className="text-xs text-gray-500 mt-2">
                    Seu plano tem armazenamento ilimitado
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Conteúdo Principal */}
          <div className="space-y-6">
            {/* Configurações de Perfil */}
            {activeTab === "profile" && (
              <Card>
                <CardHeader>
                  <CardTitle>Informações Pessoais</CardTitle>
                  <CardDescription>
                    Atualize suas informações pessoais
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...profileForm}>
                    <form
                      onSubmit={profileForm.handleSubmit(onSubmitProfile)}
                      className="space-y-4"
                    >
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <FormField
                          control={profileForm.control}
                          name="firstName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nome</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={profileForm.control}
                          name="lastName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Sobrenome</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={profileForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input {...field} type="email" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex justify-end">
                        <Button
                          type="submit"
                          disabled={updateProfileMutation.isPending}
                        >
                          {updateProfileMutation.isPending ? "Salvando..." : "Salvar Alterações"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            )}

            {/* Configurações de Segurança */}
            {activeTab === "security" && (
              <Card>
                <CardHeader>
                  <CardTitle>Segurança</CardTitle>
                  <CardDescription>
                    Gerencie a segurança da sua conta
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...passwordForm}>
                    <form
                      onSubmit={passwordForm.handleSubmit(onSubmitPassword)}
                      className="space-y-4"
                    >
                      <FormField
                        control={passwordForm.control}
                        name="currentPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Senha atual</FormLabel>
                            <FormControl>
                              <Input {...field} type="password" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={passwordForm.control}
                        name="newPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nova senha</FormLabel>
                            <FormControl>
                              <Input {...field} type="password" />
                            </FormControl>
                            <FormDescription>
                              A senha deve ter pelo menos 8 caracteres e incluir letras maiúsculas, minúsculas e números
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={passwordForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirmar senha</FormLabel>
                            <FormControl>
                              <Input {...field} type="password" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex justify-end">
                        <Button
                          type="submit"
                          disabled={updatePasswordMutation.isPending}
                        >
                          {updatePasswordMutation.isPending ? "Atualizando..." : "Atualizar Senha"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            )}

            {/* Configurações de Notificações */}
            {activeTab === "notifications" && (
              <Card>
                <CardHeader>
                  <CardTitle>Notificações</CardTitle>
                  <CardDescription>
                    Personalize como você quer receber notificações
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...notificationForm}>
                    <form
                      onSubmit={notificationForm.handleSubmit(onSubmitNotifications)}
                      className="space-y-4"
                    >
                      <FormField
                        control={notificationForm.control}
                        name="emailNotifications"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Notificações por email</FormLabel>
                              <FormDescription>
                                Receba notificações por email quando clientes acessarem seus repositórios
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={notificationForm.control}
                        name="browserNotifications"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Notificações do navegador</FormLabel>
                              <FormDescription>
                                Receba notificações no navegador quando estiver usando o sistema
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />
                      <div className="flex justify-end">
                        <Button
                          type="submit"
                          disabled={updateNotificationsMutation.isPending}
                        >
                          {updateNotificationsMutation.isPending ? "Salvando..." : "Salvar Preferências"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            )}

            {/* Configurações do Sistema */}
            {activeTab === "system" && (
              <Card>
                <CardHeader>
                  <CardTitle>Configurações do Sistema</CardTitle>
                  <CardDescription>
                    Gerencie as configurações gerais do sistema
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...systemSettingsForm}>
                    <form
                      onSubmit={systemSettingsForm.handleSubmit(onSubmitSystemSettings)}
                      className="space-y-6"
                    >
                      <div className="space-y-3">
                        <h3 className="text-base font-medium text-gray-900">
                          Configurações de Armazenamento
                        </h3>
                        
                        <FormField
                          control={systemSettingsForm.control}
                          name="maxUploadSize"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tamanho máximo de upload</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione o tamanho máximo de upload" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="10mb">10 MB</SelectItem>
                                  <SelectItem value="50mb">50 MB</SelectItem>
                                  <SelectItem value="100mb">100 MB</SelectItem>
                                  <SelectItem value="500mb">500 MB</SelectItem>
                                  <SelectItem value="1gb">1 GB</SelectItem>
                                  <SelectItem value="unlimited">Ilimitado</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormDescription>
                                Define o tamanho máximo de arquivos que podem ser enviados
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={systemSettingsForm.control}
                          name="compressImages"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel>Compressão de imagens</FormLabel>
                                <FormDescription>
                                  Comprimir automaticamente imagens para reduzir espaço de armazenamento
                                </FormDescription>
                              </div>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={systemSettingsForm.control}
                          name="batchUpload"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel>Upload em lote</FormLabel>
                                <FormDescription>
                                  Permitir upload de múltiplos arquivos simultaneamente
                                </FormDescription>
                              </div>
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <Separator />
                      
                      <div className="space-y-3">
                        <h3 className="text-base font-medium text-gray-900">
                          Configurações de Qualidade
                        </h3>
                        
                        <FormField
                          control={systemSettingsForm.control}
                          name="uploadQuality"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Qualidade padrão de upload</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione a qualidade" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="original">
                                    Original (tamanho total)
                                  </SelectItem>
                                  <SelectItem value="high">
                                    Alta (2560px máx)
                                  </SelectItem>
                                  <SelectItem value="medium">
                                    Média (1920px máx)
                                  </SelectItem>
                                  <SelectItem value="low">
                                    Baixa (1280px máx)
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                              <FormDescription>
                                Define a qualidade padrão para imagens enviadas
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={systemSettingsForm.control}
                          name="videoQuality"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Qualidade padrão de vídeo</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione a qualidade de vídeo" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="original">Original</SelectItem>
                                  <SelectItem value="high">Alta (1080p)</SelectItem>
                                  <SelectItem value="medium">Média (720p)</SelectItem>
                                  <SelectItem value="low">Baixa (480p)</SelectItem>
                                  <SelectItem value="auto">Auto (adaptativa)</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormDescription>
                                Define a qualidade padrão para reprodução de vídeos do YouTube
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <Separator />
                      
                      <div className="space-y-3">
                        <h3 className="text-base font-medium text-gray-900">
                          Configurações de Segurança
                        </h3>
                        
                        <FormField
                          control={systemSettingsForm.control}
                          name="linkExpiry"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel>Expiração de links</FormLabel>
                                <FormDescription>
                                  Links de cliente expiram automaticamente após 30 dias de inatividade
                                </FormDescription>
                              </div>
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="flex justify-end space-x-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            systemSettingsForm.reset({
                              linkExpiry: false,
                              uploadQuality: "original",
                              videoQuality: "original",
                              maxUploadSize: "unlimited",
                              batchUpload: true,
                              compressImages: false
                            });
                          }}
                        >
                          Restaurar Padrões
                        </Button>
                        <Button
                          type="submit"
                          disabled={updateSystemSettingsMutation.isPending}
                        >
                          {updateSystemSettingsMutation.isPending ? "Salvando..." : "Salvar Configurações"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            )}
            
            {/* Configurações de Aparência */}
            {activeTab === "appearance" && (
              <Card>
                <CardHeader>
                  <CardTitle>Aparência</CardTitle>
                  <CardDescription>
                    Personalize a aparência do painel administrativo
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...appearanceForm}>
                    <form
                      onSubmit={appearanceForm.handleSubmit(onSubmitAppearance)}
                      className="space-y-6"
                    >
                      <div className="space-y-3">
                        <h3 className="text-base font-medium text-gray-900">
                          Tema
                        </h3>
                        
                        <FormField
                          control={appearanceForm.control}
                          name="theme"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Modo de Tema</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione o tema" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="light">Claro</SelectItem>
                                  <SelectItem value="dark">Escuro</SelectItem>
                                  <SelectItem value="system">Sistema (automático)</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormDescription>
                                Escolha entre tema claro, escuro ou baseado nas configurações do sistema
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="space-y-3">
                        <h3 className="text-base font-medium text-gray-900">
                          Cores
                        </h3>
                        
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <FormField
                            control={appearanceForm.control}
                            name="primaryColor"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Cor Primária</FormLabel>
                                <FormControl>
                                  <div className="flex">
                                    <Input {...field} type="color" className="w-12 h-10 p-1 mr-2" />
                                    <Input {...field} className="flex-1" />
                                  </div>
                                </FormControl>
                                <FormDescription>
                                  Cor principal usada em botões e elementos de destaque
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={appearanceForm.control}
                            name="accentColor"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Cor de Destaque</FormLabel>
                                <FormControl>
                                  <div className="flex">
                                    <Input {...field} type="color" className="w-12 h-10 p-1 mr-2" />
                                    <Input {...field} className="flex-1" />
                                  </div>
                                </FormControl>
                                <FormDescription>
                                  Cor secundária usada para detalhes e acentos
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <h3 className="text-base font-medium text-gray-900">
                          Interface
                        </h3>
                        
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <FormField
                            control={appearanceForm.control}
                            name="fontSize"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Tamanho da Fonte</FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Selecione o tamanho da fonte" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="small">Pequeno</SelectItem>
                                    <SelectItem value="default">Médio (padrão)</SelectItem>
                                    <SelectItem value="large">Grande</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormDescription>
                                  Ajuste o tamanho da fonte em toda a interface
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={appearanceForm.control}
                            name="borderRadius"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Arredondamento de Bordas</FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Selecione o arredondamento" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="none">Nenhum (quadrado)</SelectItem>
                                    <SelectItem value="small">Suave</SelectItem>
                                    <SelectItem value="default">Médio (padrão)</SelectItem>
                                    <SelectItem value="large">Grande</SelectItem>
                                    <SelectItem value="full">Máximo</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormDescription>
                                  Ajuste o arredondamento das bordas dos elementos
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <h3 className="text-base font-medium text-gray-900">
                          CSS Personalizado
                        </h3>
                        
                        <FormField
                          control={appearanceForm.control}
                          name="customCss"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>CSS Personalizado</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder=".my-class { color: #ff0000; }"
                                  className="font-mono h-32"
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>
                                Adicione CSS personalizado para personalizar o painel ainda mais
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="flex justify-end space-x-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            appearanceForm.reset({
                              theme: "system",
                              primaryColor: "#0091ff",
                              accentColor: "#6941C6",
                              fontSize: "default",
                              borderRadius: "default",
                              customCss: ""
                            });
                          }}
                        >
                          Restaurar Padrões
                        </Button>
                        <Button
                          type="submit"
                          disabled={updateAppearanceMutation.isPending}
                        >
                          {updateAppearanceMutation.isPending ? "Salvando..." : "Salvar Aparência"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            )}
            
            {/* Configurações de Marca */}
            {activeTab === "branding" && (
              <Card>
                <CardHeader>
                  <CardTitle>Marca</CardTitle>
                  <CardDescription>
                    Personalize a marca e identidade visual do sistema
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...brandingForm}>
                    <form
                      onSubmit={brandingForm.handleSubmit(onSubmitBranding)}
                      className="space-y-6"
                    >
                      <div className="space-y-3">
                        <h3 className="text-base font-medium text-gray-900">
                          Informações Básicas
                        </h3>
                        
                        <FormField
                          control={brandingForm.control}
                          name="siteName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nome do Site</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormDescription>
                                Nome principal exibido no cabeçalho e título do site
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={brandingForm.control}
                          name="siteDescription"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Descrição do Site</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Uma breve descrição do seu sistema de repositório de mídia"
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>
                                Usada em meta tags e em alguns lugares na interface
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="space-y-3">
                        <h3 className="text-base font-medium text-gray-900">
                          Identidade Visual
                        </h3>
                        
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                          <div>
                            <FormLabel className="block mb-2">Logo</FormLabel>
                            {logoPreview && (
                              <div className="mb-2 border rounded-md p-2 w-full">
                                <img 
                                  src={logoPreview} 
                                  alt="Logo Preview" 
                                  className="max-h-32 mx-auto"
                                />
                              </div>
                            )}
                            <FileInput
                              onFilesSelected={(files) => handleFilesSelected(files, 'logo')}
                              accept="image/*"
                              maxSize={5}
                              label="Selecione uma imagem (PNG, JPG, SVG)"
                              description="Recomendado: 200x50px, max 5MB"
                            />
                          </div>
                          
                          <div>
                            <FormLabel className="block mb-2">Favicon</FormLabel>
                            {faviconPreview && (
                              <div className="mb-2 border rounded-md p-2 w-full flex items-center justify-center">
                                <img 
                                  src={faviconPreview} 
                                  alt="Favicon Preview" 
                                  className="h-16 w-16"
                                />
                              </div>
                            )}
                            <FileInput
                              onFilesSelected={(files) => handleFilesSelected(files, 'favicon')}
                              accept="image/png,image/x-icon,image/svg+xml"
                              maxSize={1}
                              label="Selecione um favicon (ICO, PNG, SVG)"
                              description="Recomendado: 32x32px ou 16x16px, max 1MB"
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <h3 className="text-base font-medium text-gray-900">
                          Página do Cliente
                        </h3>
                        
                        <FormField
                          control={brandingForm.control}
                          name="clientPageHeader"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Cabeçalho Personalizado</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Texto HTML personalizado para o cabeçalho da página do cliente"
                                  className="h-24"
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>
                                HTML personalizado para exibir no topo da página do cliente
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={brandingForm.control}
                          name="clientPageFooter"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Rodapé Personalizado</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Texto HTML personalizado para o rodapé da página do cliente"
                                  className="h-24"
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>
                                HTML personalizado para exibir no rodapé da página do cliente
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="flex justify-end space-x-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            brandingForm.reset({
                              siteName: "Repositório de Mídia",
                              siteDescription: "Repositório de mídia seguro para meus clientes",
                              clientPageHeader: "",
                              clientPageFooter: ""
                            });
                            setLogoPreview(null);
                            setFaviconPreview(null);
                          }}
                        >
                          Restaurar Padrões
                        </Button>
                        <Button
                          type="submit"
                          disabled={updateBrandingMutation.isPending}
                        >
                          {updateBrandingMutation.isPending ? "Salvando..." : "Salvar Marca"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}