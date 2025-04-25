import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import ClientView from "@/pages/client-view";
import ClientNotFound from "@/pages/client-not-found";
import AuthPage from "@/pages/auth-page";
import { ProtectedRoute } from "./lib/protected-route";
import DashboardPage from "./pages/admin/dashboard-page";
import ClientsPage from "./pages/admin/clients-page";
import ContentPage from "./pages/admin/content-page";
import SettingsPage from "./pages/admin/settings-page";
import { AuthProvider } from "./hooks/use-auth";

function Router() {
  return (
    <Switch>
      {/* Admin routes */}
      <ProtectedRoute path="/" component={DashboardPage} />
      <ProtectedRoute path="/clients" component={ClientsPage} />
      <ProtectedRoute path="/content" component={ContentPage} />
      <ProtectedRoute path="/settings" component={SettingsPage} />
      
      {/* Auth route */}
      <Route path="/auth" component={AuthPage} />
      
      {/* Client routes */}
      <Route path="/client/:uniqueId">
        {(params) => <ClientView uniqueId={params.uniqueId} />}
      </Route>
      <Route path="/client-not-found" component={ClientNotFound} />
      
      {/* 404 route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
