import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Client, Photo, Video } from "@shared/schema";
import { 
  Card, 
  CardContent 
} from "@/components/ui/card";
import { YoutubeEmbed } from "@/components/ui/youtube-embed";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

interface ClientViewProps {
  uniqueId: string;
}

export default function ClientView({ uniqueId }: ClientViewProps) {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("photos");

  const { data: client, isLoading: isLoadingClient, error } = useQuery<Client>({
    queryKey: [`/api/clients/public/${uniqueId}`],
  });

  const { data: photos, isLoading: isLoadingPhotos } = useQuery<Photo[]>({
    queryKey: [`/api/clients/${uniqueId}/photos`],
    enabled: !!client,
  });

  const { data: videos, isLoading: isLoadingVideos } = useQuery<Video[]>({
    queryKey: [`/api/clients/${uniqueId}/videos`],
    enabled: !!client,
  });

  useEffect(() => {
    if (error) {
      toast({
        title: "Erro",
        description: "Este link de repositório de cliente é inválido ou expirou.",
        variant: "destructive",
      });
      navigate("/client-not-found");
    }
  }, [error, navigate, toast]);

  if (isLoadingClient) {
    return (
      <div className="max-w-7xl mx-auto pt-8 px-4">
        <Skeleton className="h-24 w-full mb-8" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array(6)
            .fill(0)
            .map((_, i) => (
              <Skeleton key={i} className="h-64 w-full rounded-lg" />
            ))}
        </div>
      </div>
    );
  }

  if (!client) {
    return null; // Navegação para not-found acontece no useEffect
  }

  return (
    <div className="max-w-7xl mx-auto pt-6 px-4 pb-12">
      {/* Cabeçalho do Cliente */}
      <Card className="mb-6">
        <div className="border-b border-gray-200 px-6 py-5">
          <h1 className="text-2xl font-bold text-gray-800">{client.name}</h1>
          <p className="text-gray-600 mt-1">{client.description || "Seu repositório de conteúdo pessoal"}</p>
        </div>
        
        <div className="px-6 py-4">
          <div className="flex border-b mb-6">
            <button
              className={`px-4 py-2 font-medium ${
                activeTab === "photos"
                  ? "text-primary border-b-2 border-primary"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setActiveTab("photos")}
            >
              Fotos
            </button>
            <button
              className={`px-4 py-2 font-medium ${
                activeTab === "videos"
                  ? "text-primary border-b-2 border-primary"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setActiveTab("videos")}
            >
              Vídeos
            </button>
          </div>
          
          {/* Conteúdo de Fotos */}
          {activeTab === "photos" && (
            <div>
              {isLoadingPhotos ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Array(6)
                    .fill(0)
                    .map((_, i) => (
                      <Skeleton key={i} className="h-64 w-full rounded-lg" />
                    ))}
                </div>
              ) : photos && photos.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {photos.map((photo) => (
                    <div 
                      key={photo.id} 
                      className="bg-white rounded-lg shadow overflow-hidden"
                    >
                      <img 
                        src={photo.url}
                        alt={photo.title}
                        className="w-full h-48 object-cover object-center"
                        onClick={() => window.open(photo.url, '_blank')}
                        style={{ cursor: 'pointer' }}
                      />
                      <div className="p-4">
                        <h3 className="text-lg font-medium text-gray-800">{photo.title}</h3>
                        {photo.description && (
                          <p className="text-sm text-gray-600 mt-1">{photo.description}</p>
                        )}
                        <span className="text-xs text-gray-500 mt-2 block">
                          Adicionado em {formatDate(photo.createdAt)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 bg-white rounded-lg shadow">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-12 w-12 mx-auto text-gray-400"
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
                    />
                  </svg>
                  <h3 className="mt-4 text-lg font-medium text-gray-900">Nenhuma foto disponível</h3>
                  <p className="mt-2 text-sm text-gray-500">Não há fotos neste repositório ainda.</p>
                </div>
              )}
            </div>
          )}
          
          {/* Conteúdo de Vídeos */}
          {activeTab === "videos" && (
            <div>
              {isLoadingVideos ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {Array(4)
                    .fill(0)
                    .map((_, i) => (
                      <div key={i} className="rounded-lg overflow-hidden">
                        <Skeleton className="h-0 pb-[56.25%] w-full relative" />
                        <div className="p-4 bg-white">
                          <Skeleton className="h-6 w-3/4 mb-2" />
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-3 w-1/4 mt-2" />
                        </div>
                      </div>
                    ))}
                </div>
              ) : videos && videos.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {videos.map((video) => (
                    <div 
                      key={video.id}
                      className="bg-white rounded-lg shadow overflow-hidden"
                    >
                      <YoutubeEmbed 
                        videoId={video.youtubeUrl}
                        title={video.title}
                      />
                      <div className="p-4">
                        <h3 className="text-lg font-medium text-gray-800">{video.title}</h3>
                        {video.description && (
                          <p className="text-sm text-gray-600 mt-1">{video.description}</p>
                        )}
                        <span className="text-xs text-gray-500 mt-2 block">
                          Adicionado em {formatDate(video.createdAt)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 bg-white rounded-lg shadow">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-12 w-12 mx-auto text-gray-400"
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" 
                    />
                  </svg>
                  <h3 className="mt-4 text-lg font-medium text-gray-900">Nenhum vídeo disponível</h3>
                  <p className="mt-2 text-sm text-gray-500">Não há vídeos neste repositório ainda.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}