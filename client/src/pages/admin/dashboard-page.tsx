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
    <AdminLayout title="Dashboard">
      <div className="space-y-6">
        {/* Stats Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total Clients"
            value={stats?.clientCount}
            icon={<UserPlus className="h-5 w-5" />}
            iconColor="bg-blue-100 text-primary"
            isLoading={isLoadingStats}
          />
          <StatsCard
            title="Total Photos"
            value={stats?.photoCount}
            icon={<Image className="h-5 w-5" />}
            iconColor="bg-green-100 text-success"
            isLoading={isLoadingStats}
          />
          <StatsCard
            title="Total Videos"
            value={stats?.videoCount}
            icon={<VideoIcon className="h-5 w-5" />}
            iconColor="bg-purple-100 text-accent"
            isLoading={isLoadingStats}
          />
          <StatsCard
            title="Total Views"
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
              <h2 className="text-lg font-medium text-gray-800">Recent Activity</h2>
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
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No recent activity</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Start adding content to see activity here.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Client Access */}
          <Card>
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-800">Recent Client Access</h2>
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
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-800">
                            {access.client.name}
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
                  <Eye className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No recent access</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Clients haven't accessed their repositories yet.
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
        <div className="flex items-center">
          <div className={`p-3 rounded-full ${iconColor} mr-4`}>{icon}</div>
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            {isLoading ? (
              <Skeleton className="h-8 w-16 mt-1" />
            ) : (
              <p className="text-2xl font-semibold text-gray-800">
                {value?.toLocaleString() || 0}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ActivityIcon({ type }: { type: string }) {
  switch (type) {
    case "photo":
      return (
        <div className="w-10 h-10 flex-shrink-0 bg-blue-100 text-primary rounded-full flex items-center justify-center">
          <Upload className="h-5 w-5" />
        </div>
      );
    case "video":
      return (
        <div className="w-10 h-10 flex-shrink-0 bg-purple-100 text-accent rounded-full flex items-center justify-center">
          <VideoIcon className="h-5 w-5" />
        </div>
      );
    case "client":
      return (
        <div className="w-10 h-10 flex-shrink-0 bg-green-100 text-success rounded-full flex items-center justify-center">
          <UserPlus className="h-5 w-5" />
        </div>
      );
    default:
      return (
        <div className="w-10 h-10 flex-shrink-0 bg-gray-100 text-gray-500 rounded-full flex items-center justify-center">
          <Eye className="h-5 w-5" />
        </div>
      );
  }
}

function AccessStatusBadge({ lastAccessed }: { lastAccessed: string }) {
  const date = new Date(lastAccessed);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 1) {
    return (
      <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">
        Active
      </Badge>
    );
  } else if (diffDays < 7) {
    return (
      <Badge variant="outline" className="bg-blue-100 text-blue-800 hover:bg-blue-100">
        Recent
      </Badge>
    );
  } else {
    return (
      <Badge variant="outline" className="bg-gray-100 text-gray-800 hover:bg-gray-100">
        Inactive
      </Badge>
    );
  }
}

function ActivitySkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array(count)
        .fill(0)
        .map((_, i) => (
          <div key={i} className="flex items-start">
            <Skeleton className="w-10 h-10 rounded-full" />
            <div className="ml-4 space-y-2 flex-1">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-1/4" />
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
          <div key={i} className="flex items-center justify-between">
            <div className="flex items-center">
              <Skeleton className="w-10 h-10 rounded-full" />
              <div className="ml-4 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
        ))}
    </div>
  );
}
