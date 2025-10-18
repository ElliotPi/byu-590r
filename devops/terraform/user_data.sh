#!/bin/bash
set -e

# Update system
apt update && apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# Install PHP 8.3 and extensions
apt install -y software-properties-common
add-apt-repository ppa:ondrej/php -y
apt update
apt install -y php8.3 php8.3-mysql php8.3-xml php8.3-mbstring php8.3-curl php8.3-zip php8.3-gd php8.3-cli php8.3-common libapache2-mod-php8.3

# Install Composer
curl -sS https://getcomposer.org/installer | php
mv composer.phar /usr/local/bin/composer
chmod +x /usr/local/bin/composer

# Install MySQL
apt install -y mysql-server
systemctl enable mysql
systemctl start mysql

# Install Apache
apt install -y apache2
systemctl enable apache2
systemctl start apache2

# Install Git
apt install -y git

# Create application directories
mkdir -p /var/www/html/app
mkdir -p /var/www/html/api
chown -R ubuntu:ubuntu /var/www/html/app
chown -R ubuntu:ubuntu /var/www/html/api

# Create database and user
mysql -u root << 'EOF'
CREATE DATABASE IF NOT EXISTS byu_590r_app;
CREATE USER IF NOT EXISTS 'byu_user'@'localhost' IDENTIFIED BY 'trees243';
GRANT ALL PRIVILEGES ON byu_590r_app.* TO 'byu_user'@'localhost';
FLUSH PRIVILEGES;
EOF

# Configure Apache Virtual Hosts

# Enable Apache modules
a2enmod rewrite
a2enmod headers

# Create virtual hosts with port-based routing
tee /etc/apache2/sites-available/byu-590r-backend.conf > /dev/null << 'APACHE_BACKEND_EOF'
<VirtualHost *:4444>
    ServerName localhost
    DocumentRoot /var/www/html/api/public
    
    <Directory /var/www/html/api/public>
        AllowOverride All
        Require all granted
        
        # Laravel routing
        RewriteEngine On
        RewriteCond %%{REQUEST_FILENAME} !-f
        RewriteCond %%{REQUEST_FILENAME} !-d
        RewriteRule ^(.*)$ index.php [QSA,L]
        
        # Set index files
        DirectoryIndex index.php index.html
    </Directory>
    
    ErrorLog ${apache_log_dir}/byu590r_backend_error.log
    CustomLog ${apache_log_dir}/byu590r_backend_access.log combined
</VirtualHost>
APACHE_BACKEND_EOF

tee /etc/apache2/sites-available/byu-590r-frontend.conf > /dev/null << 'APACHE_FRONTEND_EOF'
<VirtualHost *:80>
    ServerName localhost
    DocumentRoot /var/www/html/app/browser
    
    <Directory /var/www/html/app/browser>
        AllowOverride All
        Require all granted
        
        # Angular routing support
        RewriteEngine On
        RewriteRule ^index\.html$ - [L]
        RewriteCond %%{REQUEST_FILENAME} !-f
        RewriteCond %%{REQUEST_FILENAME} !-d
        RewriteRule . /index.html [L]
        
        # Set index files
        DirectoryIndex index.html
    </Directory>
    
    ErrorLog ${apache_log_dir}/byu590r_frontend_error.log
    CustomLog ${apache_log_dir}/byu590r_frontend_access.log combined
</VirtualHost>
APACHE_FRONTEND_EOF

# Enable sites and disable default
a2ensite byu-590r-backend.conf
a2ensite byu-590r-frontend.conf
a2dissite 000-default

# Add ports to Apache configuration
echo "Listen 4444" | tee -a /etc/apache2/ports.conf

systemctl reload apache2

# Final Apache restart to ensure all changes take effect
systemctl restart apache2
echo "[SUCCESS] Apache configuration complete"

# Set proper permissions for Laravel (if directories exist)
if [ -d "/var/www/html/api" ]; then
    chown -R www-data:www-data /var/www/html/api
    chmod -R 755 /var/www/html/api
    
    # Create Laravel directories if they don't exist
    mkdir -p /var/www/html/api/storage
    mkdir -p /var/www/html/api/bootstrap/cache
    
    # Set permissions for Laravel-specific directories
    chmod -R 775 /var/www/html/api/storage
    chmod -R 775 /var/www/html/api/bootstrap/cache
else
    echo "[INFO] Laravel application directory not found yet - permissions will be set during deployment"
fi

# Ensure Laravel can write to all necessary directories (if they exist)
if [ -d "/var/www/html/api/storage" ]; then
    mkdir -p /var/www/html/api/storage/logs
    mkdir -p /var/www/html/api/storage/framework
    mkdir -p /var/www/html/api/storage/app
    chmod -R 775 /var/www/html/api/storage/logs
    chmod -R 775 /var/www/html/api/storage/framework
    chmod -R 775 /var/www/html/api/storage/app
fi

# Create .env file if it doesn't exist
if [ ! -f /var/www/html/api/.env ]; then
    if [ -f /var/www/html/api/.env.example ]; then
        cp /var/www/html/api/.env.example /var/www/html/api/.env
        chown www-data:www-data /var/www/html/api/.env
        chmod 644 /var/www/html/api/.env
        echo "[SUCCESS] Created .env file from .env.example"
    else
        echo "[INFO] .env.example not found - .env will be created during deployment"
    fi
fi

echo "Server setup complete! Ready for GitHub Actions deployment."
