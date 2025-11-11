import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import ProductForm from "../../components/ProductForm/ProductForm";

const AddProductForm: React.FC = () => {
  const [title, setTitle] = useState("");
  const [sku, setSku] = useState("");
  const [price, setPrice] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: wire up real submit logic. For now just log the values.
    console.log("AddProduct submit", { title, sku, price });
  };

  return (
    <div>
      {/* Back Button */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/', { replace: true })}
          className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="text-sm font-medium">Back to Dashboard</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-4 rounded-md shadow-sm">
        <div className="grid grid-cols-1 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Product Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 block w-full border rounded-md p-2 bg-white dark:bg-gray-700"
              placeholder="Product title"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">SKU</label>
            <input
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              className="mt-1 block w-full border rounded-md p-2 bg-white dark:bg-gray-700"
              placeholder="Unique SKU"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Price (₹)</label>
            <input
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              type="number"
              className="mt-1 block w-full border rounded-md p-2 bg-white dark:bg-gray-700"
              placeholder="0"
              required
              min={0}
            />
          </div>

          <div className="pt-2">
            <button type="submit" className="inline-flex items-center px-4 py-2 bg-rose-600 text-white rounded-md">
              Save Product
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export const AddProductPage: React.FC = () => {
  const [tab, setTab] = useState<"service" | "product">("service");
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

  const handleBackToDashboard = () => {
    navigate('/', { replace: true });
  };

  return (
    <div className="p-4">
      {/* Header with Back Button */}
      <div className="mb-6">
        <div className="flex items-center mb-4">
          <button
            onClick={handleBackToDashboard}
            className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors mr-4"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="text-sm font-medium">Back to Dashboard</span>
          </button>
        </div>
        
        <div className="inline-flex rounded-md bg-gray-100 dark:bg-gray-700 p-1">
          <button
            onClick={() => setTab("service")}
            className={`px-4 py-2 rounded-md font-medium ${tab === "service" ? 'bg-white dark:bg-gray-800 shadow' : 'text-gray-600 dark:text-gray-300'}`}>
            {editProductId ? 'Edit Service' : 'Add Service'}
          </button>
          <button
            onClick={() => setTab("product")}
            className={`ml-2 px-4 py-2 rounded-md font-medium ${tab === "product" ? 'bg-white dark:bg-gray-800 shadow' : 'text-gray-600 dark:text-gray-300'}`}>
            {editProductId ? 'Edit Product' : 'Add Product'}
          </button>
        </div>
      </div>

      <div>
        {tab === "service" ? <ProductForm editProductId={editProductId} /> : <AddProductForm />}
      </div>
    </div>
  );
};

export default AddProductPage;
