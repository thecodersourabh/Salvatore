import { Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "../components/ProtectedRoute";
import { useAuth } from "../hooks/useAuth";

// Pages
import { About } from "../pages/About";
import { Home } from "../pages/Home";
import { ClientHome } from "../pages/ClientHome";
import { QuickService } from "../pages/QuickService";
import { SolutionQuery } from "../pages/SolutionQuery";
import { Auth } from "../pages/Auth/Auth";
import { Dashboard } from "../pages/Dashboard/Dashboard";
import { ProfileLayout } from "../pages/Profile/ProfileLayout";
import { ProfileView } from "../pages/Profile/ProfileView";
import { Orders } from "../pages/Orders/Orders";
import { Addresses } from "../pages/Profile/Addresses/Addresses";
import { Wishlist } from "../pages/Profile/Wishlist/Wishlist";
import { Settings } from "../pages/Settings/Settings";
import PaymentPage from "../pages/Payments/PaymentPage";
import NotificationTestPage from "../pages/NotificationTestPage";
import AddProductPage from "../pages/Services/AddProduct";
import { ProductDetailPage } from "../pages/Products/ProductDetailPage";

export const AppRoutes = () => {
  const { user } = useAuth();
  
  // Determine if user is a client (not a service provider)
  const isClient = user && !user.serviceProviderProfile;
  
  return (
    <Routes>
      <Route path="/" element={
        <ProtectedRoute>
          {isClient ? <ClientHome /> : <Dashboard />}
        </ProtectedRoute>
      } />
      <Route path="/home" element={<Home />} />
      <Route path="/client-home" element={
        <ProtectedRoute>
          <ClientHome />
        </ProtectedRoute>
      } />
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />
      <Route path="/quick-service" element={
        <ProtectedRoute>
          <QuickService />
        </ProtectedRoute>
      } />
      <Route path="/solution-query" element={
        <ProtectedRoute>
          <SolutionQuery />
        </ProtectedRoute>
      } />
      <Route path="/about" element={<About />} />
      <Route path="/auth" element={
        <ProtectedRoute>
          <Auth />
        </ProtectedRoute>
      } />
      <Route path="/profile" element={
        <ProtectedRoute>
          <ProfileLayout />
        </ProtectedRoute>
      } />
      <Route path="/profile/complete" element={
        <ProtectedRoute>
          <ProfileLayout />
        </ProtectedRoute>
      } />
      <Route path="/profile/:username" element={
        <ProtectedRoute>
          <ProfileView />
        </ProtectedRoute>
      } />
      <Route path="/orders" element={
        <ProtectedRoute>
          <Orders />
        </ProtectedRoute>
      } />
      <Route path="/addresses" element={
        <ProtectedRoute>
          <Addresses />
        </ProtectedRoute>
      } />
      <Route path="/payments" element={
        <ProtectedRoute>
          <PaymentPage />
        </ProtectedRoute>
      } />
      <Route path="/wishlist" element={
        <ProtectedRoute>
          <Wishlist />
        </ProtectedRoute>
      } />
      <Route path="/settings" element={
        <ProtectedRoute>
          <Settings />
        </ProtectedRoute>
      } />
      <Route path="/notification-test" element={
        <ProtectedRoute>
          <NotificationTestPage />
        </ProtectedRoute>
      } />
      <Route path="/add-product" element={
        <ProtectedRoute>
          <AddProductPage />
        </ProtectedRoute>
      } />
      <Route path="/products/:productId" element={
        <ProductDetailPage />
      } />
    </Routes>
  );
};
