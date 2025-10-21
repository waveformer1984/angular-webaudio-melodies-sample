import { Injectable, Renderer2, RendererFactory2 } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private renderer: Renderer2;
  private currentTheme: string = 'dark-theme'; // Default theme

  constructor(rendererFactory: RendererFactory2) {
    this.renderer = rendererFactory.createRenderer(null, null);
  }

  /**
   * Sets the active theme for the application.
   * @param themeName The name of the theme class (e.g., 'light-theme', 'solarized-dark-theme').
   */
  setTheme(themeName: string): void {
    if (this.currentTheme) {
      this.renderer.removeClass(document.body, this.currentTheme);
    }
    this.renderer.addClass(document.body, themeName);
    this.currentTheme = themeName;
    console.log(`Theme changed to: ${themeName}`);
  }

  /**
   * Gets the currently active theme.
   */
  getCurrentTheme(): string {
    return this.currentTheme;
  }

  /**
   * Initializes the default theme on the body element.
   */
  initializeTheme(): void {
    this.renderer.addClass(document.body, this.currentTheme);
  }
}
