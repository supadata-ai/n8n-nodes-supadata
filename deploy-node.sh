#!/bin/bash
# This script builds your custom node, deploys it to your local n8n custom nodes folder,
# kills any running n8n process, and restarts it in the background.

set -e

##############################
# Step 0: Get Package Name
##############################
PACKAGE_NAME=$(node -p "require('./package.json').name")

if [ -z "$PACKAGE_NAME" ]; then
  echo "Error: Could not determine package name from package.json."
  exit 1
fi

# Change this to match where your local n8n setup loads custom nodes from
N8N_CUSTOM_DIR="$HOME/.n8n/custom/$PACKAGE_NAME"

echo "Detected package name: '$PACKAGE_NAME'"
echo "Target deployment directory: '$N8N_CUSTOM_DIR'"

##############################
# Step 1: Build the Node
##############################
echo "Building the node..."
pnpm run build

##############################
# Step 2: Deploy the Build Output
##############################
SOURCE_DIR="./dist"

echo "Deploying build output from '$SOURCE_DIR' to '$N8N_CUSTOM_DIR'..."
rm -rf "$N8N_CUSTOM_DIR"
mkdir -p "$N8N_CUSTOM_DIR"
cp -r "$SOURCE_DIR/"* "$N8N_CUSTOM_DIR/"

echo "Deployment complete."

##############################
# Step 3: Restart n8n
##############################
echo "Restarting n8n..."

# Kill any running n8n processes
pkill -f "n8n" || echo "No running n8n process found."

# Wait briefly to ensure the process has shut down
sleep 2

# Start n8n in the background
# nohup n8n > ~/.n8n/n8n.log 2>&1 
nohup bash -c 'source ~/.zshrc && n8n' > ~/.n8n/n8n.log 2>&1 &

echo "n8n restarted. Logs are in ~/.n8n/n8n.log"
