import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useMobile } from "@/hooks/use-mobile";
import {
  Cog,
  Image,
  LayoutDashboard,
  LogOut,
  Menu,
  Users,
  X,
} from "lucide-react";

interface AdminLayoutProps {
  children: ReactNode;
  title?: string;
}

export function AdminLayout({ children, title }: AdminLayoutProps) {
  const [location] = useLocation();
  const { logoutMutation } = useAuth();
  const isMobile = useMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    {
      name: "Dashboard",
      path: "/",
      icon: <LayoutDashboard className="h-5 w-5 mr-3" />,
    },
    {
      name: "Clients",
      path: "/clients",
      icon: <Users className="h-5 w-5 mr-3" />,
    },
    {
      name: "Content",
      path: "/content",
      icon: <Image className="h-5 w-5 mr-3" />,
    },
    {
      name: "Settings",
      path: "/settings",
      icon: <Cog className="h-5 w-5 mr-3" />,
    },
  ];

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Mobile Header */}
      {isMobile && (
        <div className="fixed top-0 left-0 right-0 z-30 bg-white shadow-sm">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="text-gray-500"
              >
                <Menu className="h-6 w-6" />
              </Button>
              <h1 className="ml-4 text-lg font-semibold text-gray-800">
                Client Repository
              </h1>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="text-gray-500 hover:text-gray-700"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-40 w-64 transform transition-transform duration-300 ease-in-out bg-sidebar border-r border-sidebar-border overflow-y-auto ${
          sidebarOpen || !isMobile ? "translate-x-0" : "-translate-x-full"
        } ${isMobile ? "top-0" : "top-0"}`}
      >
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center">
            <span className="text-xl font-bold text-sidebar-foreground">
              Client Repository
            </span>
          </div>
          {isMobile && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(false)}
              className="text-sidebar-foreground hover:text-sidebar-foreground/80"
            >
              <X className="h-6 w-6" />
            </Button>
          )}
        </div>

        <nav className="mt-6 px-3">
          {navItems.map((item) => (
            <Link key={item.path} href={item.path}>
              <a
                className={`flex items-center px-3 py-2.5 mb-1 text-sm font-medium rounded-md transition ${
                  location === item.path
                    ? "text-sidebar-primary bg-sidebar-accent"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                }`}
                onClick={() => isMobile && setSidebarOpen(false)}
              >
                {item.icon}
                {item.name}
              </a>
            </Link>
          ))}

          <Separator className="my-4 bg-sidebar-border" />

          <button
            onClick={handleLogout}
            className="flex w-full items-center px-3 py-2.5 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent/50 rounded-md transition"
          >
            <LogOut className="h-5 w-5 mr-3" />
            Logout
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div
        className={`flex-1 ${isMobile ? "mt-12" : ""} ${
          !isMobile && "lg:pl-64"
        }`}
      >
        {/* Desktop Header */}
        {!isMobile && (
          <header className="bg-white shadow-sm h-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
              <div className="flex justify-between items-center h-full">
                <h1 className="text-xl font-semibold text-gray-800">
                  {title || "Dashboard"}
                </h1>
                <div className="flex items-center space-x-4">
                  <button className="flex items-center text-sm text-gray-700 hover:text-gray-900">
                    <img
                      className="h-8 w-8 rounded-full object-cover"
                      src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                      alt="Admin User"
                    />
                    <span className="ml-2">Admin User</span>
                  </button>
                </div>
              </div>
            </div>
          </header>
        )}

        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 sm:p-6">
          {children}
        </main>

        <footer className="bg-white border-t border-gray-200 p-4">
          <div className="max-w-7xl mx-auto text-center text-sm text-gray-500">
            &copy; {new Date().getFullYear()} Client Repository System. All rights reserved.
          </div>
        </footer>
      </div>
    </div>
  );
}
