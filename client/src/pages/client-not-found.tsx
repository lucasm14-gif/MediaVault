import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Link as LinkIcon } from "lucide-react";

export default function ClientNotFound() {
  const [location, navigate] = useLocation();

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-100 p-4">
      <Card className="w-full max-w-lg">
        <CardContent className="pt-6 pb-6 flex flex-col items-center text-center">
          <div className="bg-red-100 rounded-full p-4 mb-4">
            <LinkIcon className="h-8 w-8 text-red-500" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Link de Cliente Inválido</h2>
          
          <p className="text-gray-600 mb-6">
            Este link de repositório de cliente é inválido ou expirou. 
            Por favor, entre em contato com o administrador para obter ajuda.
          </p>
          
          <div className="flex flex-wrap gap-3 justify-center">
            <Button
              variant="outline"
              onClick={() => navigate("/")}
            >
              Ir para Home
            </Button>
            
            <Button
              onClick={() => navigate("/auth")}
            >
              Entrar como Admin
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
