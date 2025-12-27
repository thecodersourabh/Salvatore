import { createAsyncThunk } from '@reduxjs/toolkit';
import { ProfileImageService } from '../../services/profileImageService';

export const fetchUserProfileImage = createAsyncThunk(
  'auth/fetchUserProfileImage',
  async ({ userId, idToken }: { userId: string, idToken?: string }) => {
    if (!userId) return null;
    const url = await ProfileImageService.getProfileImageUrl(userId, idToken);
    return url;
  }
);
