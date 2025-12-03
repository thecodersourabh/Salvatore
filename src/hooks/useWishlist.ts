import { useAppSelector, useAppDispatch } from '../store/hooks';
import {
  addToWishlist,
  removeFromWishlist,
  clearWishlist,
  updateWishlistItem,
  selectWishlistItems,
  selectWishlistCount,
  WishlistItem,
} from '../store/slices/wishlistSlice';
import { useMemo, useCallback } from 'react';

// Custom hook that provides wishlist functionality using Redux
export const useWishlist = () => {
  const dispatch = useAppDispatch();
  const wishlistItems = useAppSelector(selectWishlistItems);
  const wishlistCount = useAppSelector(selectWishlistCount);

  const addItem = useCallback((item: Omit<WishlistItem, 'createdAt'>) => {
    dispatch(addToWishlist(item));
  }, [dispatch]);

  const removeItem = useCallback((itemId: string) => {
    dispatch(removeFromWishlist(itemId));
  }, [dispatch]);

  const clearWishlistItems = useCallback(() => {
    dispatch(clearWishlist());
  }, [dispatch]);

  const updateItem = useCallback((id: string, updates: Partial<WishlistItem>) => {
    dispatch(updateWishlistItem({ id, updates }));
  }, [dispatch]);

  const isInWishlist = useCallback((itemId: string) => {
    return wishlistItems.some((item: WishlistItem) => item.id === itemId);
  }, [wishlistItems]);

  const toggleWishlist = useCallback((item: Omit<WishlistItem, 'createdAt'>) => {
    if (isInWishlist(item.id)) {
      removeItem(item.id);
    } else {
      addItem(item);
    }
  }, [isInWishlist, removeItem, addItem]);

  return useMemo(() => ({
    wishlistItems,
    wishlistCount,
    addToWishlist: addItem,
    removeFromWishlist: removeItem,
    isInWishlist,
    clearWishlist: clearWishlistItems,
    updateWishlistItem: updateItem,
    toggleWishlist,
  }), [
    wishlistItems,
    wishlistCount,
    addItem,
    removeItem,
    isInWishlist,
    clearWishlistItems,
    updateItem,
    toggleWishlist,
  ]);
};