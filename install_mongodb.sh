#!/bin/bash

# Function to get the current Ubuntu release
get_ubuntu_release() {
    lsb_release -cs
}

# Get the current Ubuntu release
current_release=$(get_ubuntu_release)

echo "Current Ubuntu release: $current_release"

# Adjust the repository URL based on the Ubuntu release
case "$current_release" in
    jammy|focal|bionic|cosmic|disco|eoan|focal|jammy)
        repo_url="https://repo.mongodb.org/apt/ubuntu $current_release/mongodb-org/8.0 multiverse"
        ;;
    xenial|trusty|precise|lucid)
        repo_url="https://repo.mongodb.org/apt/ubuntu $current_release/mongodb-org/4.4 multiverse"
        ;;
    *)
        echo "Unsupported Ubuntu release"
        exit 1
        ;;
esac

echo "Using repository URL: $repo_url"

# Add MongoDB repository
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-8.0.gpg ] \
    $repo_url" | sudo tee /etc/apt/sources.list.d/mongodb-org-8.0.list

# Update package lists
sudo apt-get update

# Install MongoDB
sudo apt-get install -y mongodb-org