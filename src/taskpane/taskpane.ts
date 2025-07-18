/*
 * Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
 * See LICENSE in the project root for license information.
 */

/* global console, document, Excel, Office */

// The initialize function must be run each time a new page is loaded
Office.onReady(() => {
  document.getElementById("sideload-msg").style.display = "none";
  document.getElementById("app-body").style.display = "flex";
  document.getElementById("save-api-key").onclick = saveApiKey;
  
  // Load existing API key if available
  loadApiKey();
});

export async function saveApiKey() {
  try {
    const apiKeyInput = document.getElementById("api-key-input") as HTMLInputElement;
    const apiKey = apiKeyInput.value.trim();
    const statusDiv = document.getElementById("api-status");
    
    if (!apiKey) {
      statusDiv.textContent = "Please enter an API key";
      statusDiv.style.color = "#d13438";
      return;
    }
    
    // Save to localStorage (works across all contexts)
    localStorage.setItem('glassnodeApiKey', apiKey);
    
    statusDiv.textContent = "API key saved successfully";
    statusDiv.style.color = "#107c10";
    
  } catch (error) {
    console.error('Error saving API key:', error);
    const statusDiv = document.getElementById("api-status");
    statusDiv.textContent = `Error saving API key: ${error instanceof Error ? error.message : 'Unknown error'}`;
    statusDiv.style.color = "#d13438";
  }
}

export function loadApiKey() {
  try {
    const apiKey = localStorage.getItem('glassnodeApiKey');
    
    if (apiKey) {
      const apiKeyInput = document.getElementById("api-key-input") as HTMLInputElement;
      apiKeyInput.value = apiKey;
      
      const statusDiv = document.getElementById("api-status");
      statusDiv.textContent = "API key loaded";
      statusDiv.style.color = "#107c10";
    }
  } catch (error) {
    console.error('Error loading API key:', error);
  }
}

// Helper function to get the API key for use in other functions
export function getApiKey(): string | null {
  try {
    return localStorage.getItem('glassnodeApiKey');
  } catch (error) {
    console.error('Error getting API key:', error);
    return null;
  }
}
