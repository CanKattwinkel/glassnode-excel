# Glassnode Excel Add-In

A Microsoft Excel add-in that provides direct access to Glassnode's cryptocurrency data API within Excel spreadsheets.

## Overview

This Excel add-in enables users to fetch cryptocurrency metrics and data directly from Glassnode's API using custom Excel functions. Users can analyze blockchain data, market metrics, and cryptocurrency statistics without leaving their Excel environment.

## Features

- **API Key Management**: Secure storage and configuration of your Glassnode API key
- **Asset Discovery**: Retrieve available cryptocurrency assets from Glassnode
- **Metric Data**: Access comprehensive blockchain and market metrics with flexible date ranges
- **Excel Integration**: Native Excel functions that work seamlessly with Excel's calculation engine

## Functions

### `GN.ASSETS(limit?)`
Returns a list of available cryptocurrency assets from Glassnode.

**Parameters:**
- `limit` (optional): Maximum number of assets to return (default: 100)

**Returns:** Array of asset IDs (e.g., "BTC", "ETH", "ADA")

**Example:**
```excel
=GN.ASSETS()          // Returns first 100 assets
=GN.ASSETS(50)        // Returns first 50 assets
```

### `GN.METRIC(asset, metric, startDate, endDate?)`
Fetches metric data from Glassnode API with flexible return format.

**Parameters:**
- `asset` (required): Asset ID (e.g., "BTC")
- `metric` (required): Metric path (e.g., "/addresses/active_count")
- `startDate` (required): Start date as Excel date serial number
- `endDate` (optional): End date as Excel date serial number

**Returns:**
- Single value when only `startDate` is provided
- Table with Date and metric columns when both dates are provided

**Examples:**
```excel
=GN.METRIC("BTC", "/market/price_usd_close", DATE(2025,1,1))
// Returns single price value

=GN.METRIC("BTC", "/market/price_usd_close", DATE(2025,1,1), DATE(2025,1,31))
// Returns table with dates and prices
```

## Setup

1. **API Key Configuration**: 
   - Open the add-in task pane in Excel
   - Enter your Glassnode API key
   - The key is securely stored in your browser's local storage

2. **Function Usage**:
   - Use the functions directly in Excel cells
   - Functions support Excel's native calculation and refresh capabilities

## Development

### Local Development Setup

To run the add-in locally for development:

1. **Build and Start Dev Server:**
   ```bash
   npm run build && npm run dev-server
   ```

2. **Start Excel Integration:**
   ```bash
   npm start
   ```

### Development Notes

- Live reload functionality is currently limited
- For reliable reloads when modifying `functions.ts`:
  1. Re-run `npm run build && npm run dev-server`
  2. Refresh the add-in in Safari's debug tab
- This workflow ensures consistent function updates during development

### Testing

The project includes Jest-based unit testing for custom functions:

**Test Scripts:**
- `npm test` - Run all tests
- `npm run test:coverage` - Run tests with coverage report
- `npm run test:watch` - Run tests in watch mode

**Test Coverage:**
- HTTP request mocking with `jest.fn()`
- localStorage mocking for API key functionality
- Error handling and edge cases
- Both `ASSETS` and `METRIC` functions

Tests are automatically excluded from webpack builds and run independently of the development workflow.

