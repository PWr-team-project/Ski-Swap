#!/bin/bash

source_nvm() {
    local nvm_path="$HOME/.nvm/nvm.sh"
    if [[ -f "$nvm_path" ]]; then
        . "$nvm_path"
    else
        echo "Error: nvm not found at $nvm_path"
        exit 1
    fi
}

echo "Updating package manager..."
sudo apt update && sudo apt upgrade -y

echo "Installing curl and git..."
sudo apt install -y curl git gnupg

echo "Installing nvm..."
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash

source_nvm

# Create backend directory
mkdir -p backend
cd backend

echo "Installing backend dependencies..."
npm install express mongoose jsonwebtoken

# Create frontend directory
cd ..
mkdir -p frontend
cd frontend

echo "Initializing frontend project..."
npm init -y

echo "Installing frontend dependencies..."
npm install @vue/compiler-sfc vite axios google-auth-library socket.io openai nodemailer


echo "Project structure set up and dependencies installed!"