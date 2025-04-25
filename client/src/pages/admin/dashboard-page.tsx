import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { DashboardStats, Client } from "@shared/schema";
import { AdminLayout } from "@/components/admin-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, getInitials } from "@/lib/utils";
import { 
  Image, 
  UserPlus, 
  Upload, 
  Video as VideoIcon, 
  Eye
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function DashboardPage() {
  const { data: stats, isLoading: isLoadingStats } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: recentActivity, isLoading: isLoadingActivity } = useQuery<any[]>({
    queryKey: ["/api/dashboard/activity"],
  });

  const { data: recentAccess, isLoading: isLoadingAccess } = useQuery<any[]>({
    queryKey: ["/api/dashboard/access"],
  });

  return (
    <AdminLayout title="Painel">
      <div className="space-y-6">
        {/* Stats Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total de Clientes"
            value={stats?.clientCount}
            icon={<UserPlus className="h-5 w-5" />}
            iconColor="bg-blue-100 text-primary"
            isLoading={isLoadingStats}
          />
          <StatsCard
            title="Total de Fotos"
            value={stats?.photoCount}
            icon={<Image className="h-5 w-5" />}
            iconColor="bg-green-100 text-success"
            isLoading={isLoadingStats}
          />
          <StatsCard
            title="Total de Vídeos"
            value={stats?.videoCount}
            icon={<VideoIcon className="h-5 w-5" />}
            iconColor="bg-purple-100 text-accent"
            isLoading={isLoadingStats}
          />
          <StatsCard
            title="Total de Visualizações"
            value={stats?.totalViews}
            icon={<Eye className="h-5 w-5" />}
            iconColor="bg-yellow-100 text-warning"
            isLoading={isLoadingStats}
          />
        </div>

        {/* Activity and Access Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <Card>
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-800">Atividade Recente</h2>
            </div>
            <CardContent className="p-6">
              {isLoadingActivity ? (
                <ActivitySkeleton count={3} />
              ) : recentActivity && recentActivity.length > 0 ? (
                <ul className="divide-y divide-gray-200">
                  {recentActivity.map((activity, index) => (
                    <li key={index} className="py-3 flex items-start">
                      <ActivityIcon type={activity.type} />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-800">
                          {activity.title}
                        </p>
                        <p className="text-sm text-gray-600">{activity.description}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDate(activity.createdAt)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-center py-8">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma atividade recente</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Comece a adicionar conteúdo para ver as atividades aqui.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Client Access */}
          <Card>
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-800">Acessos Recentes de Clientes</h2>
            </div>
            <CardContent className="p-6">
              {isLoadingAccess ? (
                <AccessSkeleton count={3} />
              ) : recentAccess && recentAccess.length > 0 ? (
                <ul className="divide-y divide-gray-200">
                  {recentAccess.map((access, index) => (
                    <li key={index} className="py-3 flex justify-between items-center">
                      <div className="flex items-center">
                        <div className="w-10 h-10 flex-shrink-0 bg-gray-200 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-600">
                            {getInitials(access.client.name)}
                          </span>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-800 hover:underline">
                            <Link href={`/client/${access.client.uniqueId}`}>
                              {access.client.name}
                            </Link>
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatDate(access.accessedAt)}
                          </p>
                        </div>
                      </div>
                      <AccessStatusBadge lastAccessed={access.accessedAt} />
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-center py-8">
                  <UserPlus className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum acesso de cliente ainda</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Quando os clientes visualizarem seus repositórios, você verá os registros de acesso aqui.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}

interface StatsCardProps {
  title: string;
  value?: number;
  icon: React.ReactNode;
  iconColor: string;
  isLoading?: boolean;
}

function StatsCard({ title, value, icon, iconColor, isLoading = false }: StatsCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        {isLoading ? (
          <>
            <div className="flex items-center justify-between mb-2">
              <Skeleton className="h-5 w-24" />
              <Skeleton className={`h-8 w-8 rounded-full`} />
            </div>
            <Skeleton className="h-9 w-16" />
          </>
        ) : (
          <>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">{title}</h3>
              <div className={`p-2 rounded-full ${iconColor}`}>{icon}</div>
            </div>
            <p className="text-2xl font-bold">{value !== undefined ? value : "-"}</p>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function ActivityIcon({ type }: { type: string }) {
  switch (type) {
    case "client":
      return (
        <div className="p-2 rounded-full bg-blue-100 text-primary">
          <UserPlus className="h-4 w-4" />
        </div>
      );
    case "photo":
      return (
        <div className="p-2 rounded-full bg-green-100 text-success">
          <Image className="h-4 w-4" />
        </div>
      );
    case "video":
      return (
        <div className="p-2 rounded-full bg-purple-100 text-accent">
          <VideoIcon className="h-4 w-4" />
        </div>
      );
    default:
      return (
        <div className="p-2 rounded-full bg-gray-100 text-gray-500">
          <Upload className="h-4 w-4" />
        </div>
      );
  }
}

function AccessStatusBadge({ lastAccessed }: { lastAccessed: string }) {
  const lastAccess = new Date(lastAccessed).getTime();
  const now = new Date().getTime();
  const hoursDiff = Math.floor((now - lastAccess) / (1000 * 60 * 60));

  if (hoursDiff < 1) {
    return <Badge variant="default" className="bg-green-500">Agora mesmo</Badge>;
  } else if (hoursDiff < 24) {
    return <Badge variant="secondary">Hoje</Badge>;
  } else if (hoursDiff < 168) { // 7 days
    return <Badge variant="default" className="bg-yellow-500">Esta semana</Badge>;
  } else {
    return <Badge variant="outline">Mais antigo</Badge>;
  }
}

function ActivitySkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array(count)
        .fill(0)
        .map((_, i) => (
          <div key={i} className="flex items-start">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="ml-4 space-y-2 flex-1">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-2 w-1/4" />
            </div>
          </div>
        ))}
    </div>
  );
}

function AccessSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array(count)
        .fill(0)
        .map((_, i) => (
          <div key={i} className="flex justify-between items-center">
            <div className="flex items-center">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="ml-3 space-y-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
        ))}
    </div>
  );
}