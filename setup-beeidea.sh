#!/bin/bash

# Setup script for beeidea.pragyaa.ai on port 3002
# This script sets up nginx configuration and SSL certificate

set -e

echo "Setting up beeidea.pragyaa.ai on port 3002..."

# Step 1: Copy nginx configuration
echo "Step 1: Creating nginx configuration file..."
sudo cp nginx-beeidea.conf /etc/nginx/sites-available/beeidea

# Step 2: Enable the site
echo "Step 2: Enabling the site..."
sudo ln -sf /etc/nginx/sites-available/beeidea /etc/nginx/sites-enabled/

# Step 3: Test nginx configuration
echo "Step 3: Testing nginx configuration..."
sudo nginx -t

if [ $? -eq 0 ]; then
    echo "Nginx configuration test passed!"
    echo "Step 4: Reloading nginx..."
    sudo systemctl reload nginx
    echo "Nginx reloaded successfully!"
else
    echo "ERROR: Nginx configuration test failed!"
    exit 1
fi

# Step 5: SSL Certificate setup
echo ""
echo "Step 5: Setting up SSL certificate with Certbot..."
echo "Please run the following command manually to get SSL certificate:"
echo "sudo certbot --nginx -d beeidea.pragyaa.ai"
echo ""
echo "When prompted, choose option 2 to redirect HTTP to HTTPS."
echo ""
echo "After SSL is set up, you can start the application in tmux using:"
echo "  ./start-gemini-tmux.sh"
echo ""
echo "Or manually:"
echo "  tmux new-session -d -s gemini-hms 'npm start'"
