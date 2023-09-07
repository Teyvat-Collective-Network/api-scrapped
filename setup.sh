user=$(cat .env | grep DATABASE_USER= | tail -c +16 | head -c -2)
pass=$(cat .env | grep DATABASE_PASSWORD= | tail -c +20 | head -c -2)

sudo mysql -u root -e "DROP USER IF EXISTS '$user'@'localhost'; CREATE USER '$user'@'localhost' IDENTIFIED WITH mysql_native_password BY '$pass'; GRANT ALL PRIVILEGES ON tcn.* TO '$user'@'localhost';"