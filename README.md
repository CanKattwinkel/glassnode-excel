# Glassnode Add-In for Excel

A Microsoft Excel add-in that provides direct access to Glassnode's digital asset data API within Excel spreadsheets.

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
- `limit` (optional): Maximum number of assets to return (default: all assets)

**Returns:** Array of asset IDs (e.g., "BTC", "ETH", "ADA")

**Example:**
```excel
=GN.ASSETS()          // Returns all available assets
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

For development setup, testing instructions, and contribution guidelines, see [DEVELOPMENT.md](DEVELOPMENT.md).

