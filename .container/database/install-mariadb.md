## MariaDb Installation

### 1. create container for mariadb

```
docker compose -f .container/database/mariadb.yml up -d
```

### 2. Check mariadb is installed

```
docker exec -it mariadb mariadb -u root -p
```

# remote access for root user 

```
GRANT ALL PRIVILEGES ON *.* TO 'root'@'%' WITH GRANT OPTION;
FLUSH PRIVILEGES;
```

# 4. Allow access on your Ubuntu host (firewall):
# If using UFW:

```
sudo ufw allow 3306/tcp
```
```
sudo ufw reload
```
```
sudo ufw status
```
status : inactive