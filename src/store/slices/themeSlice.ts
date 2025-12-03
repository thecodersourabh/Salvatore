import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Theme } from '../../types/theme';

interface ThemeState {
  theme: Theme;
  isDarkMode: boolean;
}

const initialState: ThemeState = {
  theme: 'light',
  isDarkMode: false,
};

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<Theme>) => {
      state.theme = action.payload;
      state.isDarkMode = action.payload === 'dark';
    },
    toggleTheme: (state) => {
      state.theme = state.theme === 'light' ? 'dark' : 'light';
      state.isDarkMode = state.theme === 'dark';
    },
  },
});

export const { setTheme, toggleTheme } = themeSlice.actions;

// Selectors
export const selectTheme = (state: { theme: ThemeState }) => state.theme?.theme || 'light';
export const selectIsDarkMode = (state: { theme: ThemeState }) => state.theme?.isDarkMode || false;

export default themeSlice.reducer;