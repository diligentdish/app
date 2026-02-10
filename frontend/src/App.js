import React from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider } from "./contexts/AuthContext";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
import { ProtectedRoute, AdminRoute } from "./components/ProtectedRoute";

// Pages
import HomePage from "./pages/HomePage";
import PricingPage from "./pages/PricingPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import AuthCallback from "./pages/AuthCallback";
import CheckoutPage from "./pages/CheckoutPage";
import PaymentSuccessPage from "./pages/PaymentSuccessPage";
import DashboardPage from "./pages/DashboardPage";
import TriggerLibraryPage from "./pages/TriggerLibraryPage";
import ProfilePage from "./pages/ProfilePage";
import AdminPage from "./pages/AdminPage";

// Layout wrapper that shows/hides navbar and footer
const Layout = ({ children }) => {
  const location = useLocation();
  const noLayoutRoutes = ['/auth/callback'];
  const showLayout = !noLayoutRoutes.includes(location.pathname);

  return (
    <div className="flex flex-col min-h-screen">
      {showLayout && <Navbar />}
      <main className="flex-1">
        {children}
      </main>
      {showLayout && <Footer />}
    </div>
  );
};

// App Router - checks for session_id in URL fragment before normal routing
const AppRouter = () => {
  const location = useLocation();
  
  // Check URL fragment for session_id (Google OAuth callback)
  // This is checked synchronously during render to prevent race conditions
  if (location.hash?.includes('session_id=')) {
    return <AuthCallback />;
  }

  return (
    <Layout>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        
        {/* Auth Required Routes */}
        <Route 
          path="/checkout" 
          element={
            <ProtectedRoute>
              <CheckoutPage />
            </ProtectedRoute>
          } 
        />
        <Route path="/payment/success" element={<PaymentSuccessPage />} />
        
        {/* Subscription Required Routes */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute requireSubscription>
              <DashboardPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/triggers" 
          element={
            <ProtectedRoute requireSubscription>
              <TriggerLibraryPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute requireSubscription>
              <ProfilePage />
            </ProtectedRoute>
          } 
        />
        
        {/* Admin Routes */}
        <Route 
          path="/admin" 
          element={
            <AdminRoute>
              <AdminPage />
            </AdminRoute>
          } 
        />
        
        {/* 404 Fallback */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
  );
};

// 404 Page
const NotFound = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <div className="text-center">
      <h1 className="heading-1 mb-4">404</h1>
      <p className="body mb-8">Page not found</p>
      <a href="/" className="btn-primary inline-block px-8 py-3 rounded-full">
        Go Home
      </a>
    </div>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRouter />
      </BrowserRouter>
      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            background: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            color: 'hsl(var(--foreground))',
          },
        }}
      />
    </AuthProvider>
  );
}

export default App;
