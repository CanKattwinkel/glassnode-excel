# Development Guide

This guide covers local development setup, testing, and development workflows for the Glassnode Excel Add-In.

## Local Development Setup

To run the add-in locally for development:

1. **Build and Start Dev Server:**
   ```bash
   npm run build:dev && npm run dev-server
   ```

2. **Start Excel Integration:**
   ```bash
   npm start
   ```

## Manual Side Loading (Mac)

For manual installation and testing on Mac without using the automated development tools:

1. **Build the manifest file:**
   ```bash
   # For development (localhost URLs)
   npm run build:dev
   
   # For production (if deploying to a server)
   npm run build
   ```

2. **Clean previous installations:**
   ```bash
   # Remove any existing manifest files from previous installations
   rm -f ~/Library/Containers/com.microsoft.Excel/Data/Documents/wef/*.xml
   ```

3. **Copy the manifest:**
   ```bash
   # Copy the built manifest to Excel's add-in directory
   cp dist/manifest.xml ~/Library/Containers/com.microsoft.Excel/Data/Documents/wef/
   ```

4. **Restart Excel:**
   - Close Excel completely
   - Reopen Excel to load the add-in

The add-in should now appear in Excel's ribbon under the "Home" tab or in the add-ins menu.

## Development Notes

- Live reload functionality is currently limited
- For reliable reloads when modifying `functions.ts`:
  1. Re-run `npm run build:dev && npm run dev-server`
  2. Refresh the add-in in Safari's debug tab
- This workflow ensures consistent function updates during development

## Testing

The project includes Jest-based unit testing for custom functions:

### Test Scripts
- `npm test` - Run all tests
- `npm run test:coverage` - Run tests with coverage report
- `npm run test:watch` - Run tests in watch mode

### Test Coverage
- HTTP request mocking with `jest.fn()`
- localStorage mocking for API key functionality
- Error handling and edge cases
- Both `ASSETS` and `METRIC` functions

Tests are automatically excluded from webpack builds and run independently of the development workflow.

## Available Tasks

The following development tasks are available via VS Code or npm:

- **Build (Development)**: `npm run build:dev` - Build for development
- **Build (Production)**: `npm run build` - Build for production  
- **Dev Server**: `npm run dev-server` - Start the development server
- **Debug: Excel Desktop**: `npm run start` Start debugging in Excel Desktop
- **Lint: Check for problems**: `npm run lint` - Check for linting issues
- **Lint: Fix problems**: `npm run lint:fix` - Auto-fix linting issues
- **Watch**: `npm run watch` - Watch for file changes and rebuild
- **Stop Debug**: `npm run stop` - Stop debugging session

## Releasing

To create and publish a new release of the add-in:

1. **Build the project:**
   ```bash
   npm run build
   ```

2. **Validate the manifest:**
   ```bash
   npx office-addin-manifest validate -p dist/manifest.xml
   ```

3. **Upload to CDN:**
   - Upload the `dist` folder to the bucket `cdn-mi-prod-msoffice-6ed0/msexcel`
   - Note: This CDN has an aggressive cache for 1 hour

4. **Submit to Microsoft Partner Center:**
   - Navigate to https://partner.microsoft.com/en-us/dashboard/office/
   - Select "Microsoft 365 and Copilot"
   - Select the add-in to submit a new release
   - Upload the manifest file and release

## Project Structure

```
src/
├── commands/           # Excel command handlers
│   ├── commands.html
│   └── commands.ts
├── functions/          # Custom Excel functions
│   ├── functions.html
│   ├── functions.ts
│   └── functions.test.ts
└── taskpane/          # Task pane UI
    ├── taskpane.html
    ├── taskpane.ts
    └── taskpane.css
```

## Debugging

On Mac you need to enable remote debugging in Safari and can then access the runtime via the develop menu item in 
the main toolbar. 