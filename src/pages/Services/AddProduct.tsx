import React from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { usePageBackButton } from '../../hooks/useBackButton';
import ProductForm from "../../components/ProductForm/ProductForm";

export const AddProductPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const editProductId = searchParams.get("edit");

  // Handle Android back button
  usePageBackButton(() => {
    navigate('/', { replace: true });
  });

  return (
    <div>
      <ProductForm editProductId={editProductId} />
    </div>
  );
};

export default AddProductPage;
