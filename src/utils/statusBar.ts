import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';

export class StatusBarManager {
  private static isNative = Capacitor.isNativePlatform();

  /**
   * Initialize status bar with theme colors
   */
  static async initialize() {
    if (!this.isNative) return;

    try {
      // Set status bar to light content (white text/icons) with rose background
      await StatusBar.setStyle({ style: Style.Light });
      await StatusBar.setBackgroundColor({ color: '#e11d48' }); // rose-600
      await StatusBar.show();
      
    } catch (error) {
      console.warn('⚠️ Status bar initialization failed:', error);
    }
  }

  /**
   * Set status bar style based on current theme
   */
  static async setThemeStyle(isDark = false) {
    if (!this.isNative) return;

    try {
      if (isDark) {
        await StatusBar.setStyle({ style: Style.Dark });
        await StatusBar.setBackgroundColor({ color: '#1f2937' }); // gray-800
      } else {
        await StatusBar.setStyle({ style: Style.Light });
        await StatusBar.setBackgroundColor({ color: '#e11d48' }); // rose-600
      }
    } catch (error) {
      console.warn('⚠️ Status bar theme update failed:', error);
    }
  }

  /**
   * Hide status bar (for immersive content)
   */
  static async hide() {
    if (!this.isNative) return;
    
    try {
      await StatusBar.hide();
    } catch (error) {
      console.warn('⚠️ Status bar hide failed:', error);
    }
  }

  /**
   * Show status bar
   */
  static async show() {
    if (!this.isNative) return;
    
    try {
      await StatusBar.show();
    } catch (error) {
      console.warn('⚠️ Status bar show failed:', error);
    }
  }

  /**
   * Set status bar to overlay web view (for transparent status bar)
   */
  static async setOverlay(overlay = true) {
    if (!this.isNative) return;
    
    try {
      await StatusBar.setOverlaysWebView({ overlay });
    } catch (error) {
      console.warn('⚠️ Status bar overlay failed:', error);
    }
  }
}
