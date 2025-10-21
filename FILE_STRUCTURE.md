# Project File Structure

This document provides a hierarchical overview of the project structure for the Angular Web Audio Melodies Sample application.

## Root Directory

- **.editorconfig**: Configuration file for code editors to maintain consistent coding styles.
- **.gitignore**: Specifies files and directories that Git should ignore.
- **angular.json**: Angular CLI configuration file containing project settings and build configurations.
- **LICENSE**: Apache License 2.0 license file.
- **package-lock.json**: Locks the versions of installed npm packages for consistent builds.
- **package.json**: Defines project metadata, dependencies, and scripts.
- **README.md**: Main project documentation with setup and usage instructions.
- **tsconfig.app.json**: TypeScript configuration for the application build.
- **tsconfig.json**: Base TypeScript configuration.
- **tsconfig.spec.json**: TypeScript configuration for test builds.

## .angular/ Directory

- Contains Angular CLI build artifacts and cache files.

## .idx/ Directory

- Project IDX (Google's cloud-based development environment) configuration files.

## .vscode/ Directory

- Visual Studio Code workspace settings and extensions configuration.

## docs/ Directory

- **CONTRIBUTING.md**: Guidelines for contributing to the project, including CLA and code review processes.

## src/ Directory

- **favicon.ico**: Website favicon.
- **index.html**: Main HTML entry point for the application.
- **main.ts**: Bootstrap file that starts the Angular application.
- **styles.css**: Global CSS styles.

### src/app/ Directory

- **app.component.css**: Styles for the root app component.
- **app.component.spec.ts**: Unit tests for the root app component.
- **app.component.ts**: Root component of the Angular application.
- **app.config.ts**: Application configuration, including routing and providers.
- **app.routes.ts**: Defines the application's routing configuration.
- **global-handler.ts**: Global error handling configuration.
- **keyboard.component.css**: Styles for the keyboard component.
- **keyboard.component.ts**: Component for rendering and handling the virtual keyboard.
- **note-frequencies.ts**: Utility file containing note frequency mappings.

### src/assets/ Directory

- **.gitkeep**: Placeholder file to ensure the assets directory is tracked by Git.
- (Place static assets like images, fonts, etc., here)

## Build and Configuration Files

- **angular.json**: Defines build, serve, and test configurations.
- **tsconfig*.json**: TypeScript compiler options for different build targets.
- **package.json**: NPM scripts for development, building, and testing.

## Development and Testing

- **src/app/*.spec.ts**: Unit test files for Angular components and services.
- **karma.conf.js** (implied): Karma test runner configuration (referenced in package.json).

## Deployment

- Built application files will be generated in the `dist/` directory (not shown, created during build).