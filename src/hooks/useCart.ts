import { useAppSelector, useAppDispatch } from '../store/hooks';
import {
  addItem,
  removeItem,
  updateQuantity,
  clearCart,
  setIsCartOpen,
  selectCartItems,
  selectIsCartOpen,
  selectCartTotal,
  selectCartItemCount,
  CartItem,
} from '../store/slices/cartSlice';
import { useMemo, useCallback } from 'react';

// Custom hook that provides cart functionality using Redux
export const useCart = () => {
  const dispatch = useAppDispatch();
  const items = useAppSelector(selectCartItems);
  const isCartOpen = useAppSelector(selectIsCartOpen);
  const total = useAppSelector(selectCartTotal);
  const itemCount = useAppSelector(selectCartItemCount);

  const addItemToCart = useCallback((item: Omit<CartItem, 'quantity'>) => {
    dispatch(addItem(item));
  }, [dispatch]);

  const removeItemFromCart = useCallback((id: string) => {
    dispatch(removeItem(id));
  }, [dispatch]);

  const updateItemQuantity = useCallback((id: string, quantity: number) => {
    dispatch(updateQuantity({ id, quantity }));
  }, [dispatch]);

  const clearCartItems = useCallback(() => {
    dispatch(clearCart());
  }, [dispatch]);

  const toggleCartOpen = useCallback((isOpen?: boolean) => {
    dispatch(setIsCartOpen(isOpen ?? !isCartOpen));
  }, [dispatch, isCartOpen]);

  return useMemo(() => ({
    items,
    isCartOpen,
    total,
    itemCount,
    addItem: addItemToCart,
    removeItem: removeItemFromCart,
    updateQuantity: updateItemQuantity,
    clearCart: clearCartItems,
    setIsCartOpen: toggleCartOpen,
  }), [
    items,
    isCartOpen,
    total,
    itemCount,
    addItemToCart,
    removeItemFromCart,
    updateItemQuantity,
    clearCartItems,
    toggleCartOpen,
  ]);
};