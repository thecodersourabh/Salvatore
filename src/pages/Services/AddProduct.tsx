import React, { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import ProductForm from "../../components/ProductForm/ProductForm";

export const AddProductPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const editProductId = searchParams.get("edit");

  // Handle Android back button
  useEffect(() => {
    let backButtonListener: any = null;

    const setupBackButtonHandler = async () => {
      if (!Capacitor.isNativePlatform()) return;

      try {
        // Listen for the hardware back button
        backButtonListener = await CapacitorApp.addListener('backButton', () => {
          // Navigate back to dashboard
          navigate('/', { replace: true });
        });
      } catch (error) {
        console.error('Failed to setup back button handler:', error);
      }
    };

    setupBackButtonHandler();

    // Cleanup listener when component unmounts
    return () => {
      if (backButtonListener) {
        backButtonListener.remove();
      }
    };
  }, [navigate]);

  return (
    <div className="p-4">
      <ProductForm editProductId={editProductId} />
    </div>
  );
};

export default AddProductPage;
