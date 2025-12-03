import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type Language = 'en' | 'hi';

interface LanguageState {
  language: Language;
}

const initialState: LanguageState = {
  language: 'en',
};

const languageSlice = createSlice({
  name: 'language',
  initialState,
  reducers: {
    setLanguage: (state, action: PayloadAction<Language>) => {
      state.language = action.payload;
    },
  },
});

export const { setLanguage } = languageSlice.actions;

// Selectors
export const selectLanguage = (state: { language: LanguageState }) => state.language?.language || 'en';

export default languageSlice.reducer;