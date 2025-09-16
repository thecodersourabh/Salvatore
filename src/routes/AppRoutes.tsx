import { Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "../components/ProtectedRoute";

// Pages
import { About } from "../pages/About";
import { Home } from "../pages/Home";
import { Auth } from "../pages/Auth/Auth";
import { Dashboard } from "../pages/Dashboard/Dashboard";
import { ProfileLayout } from "../pages/Profile/ProfileLayout";
import { ProfileView } from "../pages/Profile/ProfileView";
import { Orders } from "../pages/Orders/Orders";
import { Addresses } from "../pages/Profile/Addresses/Addresses";
import { Wishlist } from "../pages/Profile/Wishlist/Wishlist";

export const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />
      <Route path="/home" element={<Home />} />
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
      <Route path="/wishlist" element={
        <ProtectedRoute>
          <Wishlist />
        </ProtectedRoute>
      } />
    </Routes>
  );
};
