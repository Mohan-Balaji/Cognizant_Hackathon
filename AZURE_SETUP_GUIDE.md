# Azure Static Web Apps Deployment Guide

## Current Issue
The deployment is failing with: "No matching Static Web App was found or the api key was invalid"

## Step-by-Step Solution

### 1. Verify Azure Static Web App Exists
1. Go to [Azure Portal](https://portal.azure.com)
2. Search for "Static Web Apps"
3. Check if you have a Static Web App with one of these names:
   - `thankful-stone-027672c10`
   - `calm-pond-07d9e7300`

### 2. Create Static Web App (if it doesn't exist)
1. Click "Create Static Web App"
2. Fill in the details:
   - **Subscription**: Your subscription
   - **Resource Group**: Create new or use existing
   - **Name**: Choose a name (e.g., `healthcare-prediction-app`)
   - **Region**: Choose closest region
   - **Build Details**:
     - **Build Preset**: Custom
     - **App location**: `/frontend`
     - **Output location**: `/out`
     - **API location**: Leave empty

### 3. Get the API Token
1. In your Static Web App, go to **Configuration**
2. Click **Management tokens**
3. Copy the **API token**

### 4. Update GitHub Secrets
1. Go to your GitHub repository
2. **Settings** → **Secrets and variables** → **Actions**
3. Update these secrets:
   - `AZURE_STATIC_WEB_APPS_API_TOKEN_THANKFUL_STONE_027672C10` (if using first workflow)
   - `AZURE_STATIC_WEB_APPS_API_TOKEN_CALM_POND_07D9E7300` (if using second workflow)

### 5. Alternative: Use a Single Workflow
If you want to simplify, you can delete one of the workflow files and use only one:

**Option A**: Keep `azure-static-web-apps-thankful-stone-027672c10.yml`
**Option B**: Keep `azure-static-web-apps-calm-pond-07d9e7300.yml`

### 6. Test the Deployment
1. Make a small change to your code
2. Commit and push to the `main` branch
3. Check the GitHub Actions tab to see if deployment succeeds

## Troubleshooting

### If you get "API key invalid":
- Double-check the API token from Azure Portal
- Ensure the token is copied correctly (no extra spaces)
- Verify the Static Web App name matches the workflow

### If you get "No matching Static Web App":
- Verify the Static Web App exists in Azure
- Check that you're using the correct subscription
- Ensure the app name in the workflow matches your Azure app

### If build succeeds but deployment fails:
- Check the `output_location` in the workflow matches your build output
- Verify the `app_location` points to the correct directory

## Current Workflow Configuration
The app is configured for static export with:
- **Build output**: `out/` directory
- **Static files**: Generated HTML files for each route
- **Authentication**: Demo mode (works without Firebase)

## Demo Credentials
Once deployed, users can access the app with:
- **Email**: demo@example.com
- **Password**: demo123
