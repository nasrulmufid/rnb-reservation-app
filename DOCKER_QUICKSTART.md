# Docker Quick Start Guide

## 🚀 Menjalankan Aplikasi

### Persiapan (First Time Setup)
```powershell
# 1. Masuk ke folder project
cd "e:\PRibadi\Mufid\my Project\Aplikasi-reservasi"

# 2. Build image (optional, jika belum ada)
docker build -t aplikasi-reservasi:latest .

# 3. Jalankan container
docker run -p 3000:3000 --name app aplikasi-reservasi:latest
```

### Akses Aplikasi
```
URL: http://localhost:3000
```

### Login dengan Credentials
| Role | Username | Password |
|------|----------|----------|
| Admin | admin | admin |
| Receptionist | receptionist | receptionist |

---

## 🔧 Troubleshooting Common Issues

### Issue 1: "Login Berhasil tapi Redirect ke Login Page"
**Solusi**: Pastikan `SECURE_COOKIES` env var tidak diset atau diset ke `false`

```powershell
# Jalankan dengan explicit env var
docker run -p 3000:3000 \
  -e SECURE_COOKIES=false \
  aplikasi-reservasi:latest
```

### Issue 2: "The table `main.User` does not exist" (P2021 Error)
**Solusi**: Database belum ter-migrasi. Container harus menjalankan migrasi secara otomatis.

```powershell
# Cek logs
docker logs nama-container

# Jika masih error, cek apakah prisma & migrations ada di image
docker exec nama-container ls -la /app/prisma/migrations/
```

### Issue 3: "Port 3000 already in use"
```powershell
# Gunakan port berbeda
docker run -p 3001:3000 aplikasi-reservasi:latest

# Atau stop container yang sudah berjalan
docker stop nama-container
docker rm nama-container
```

### Issue 4: "Cannot reach http://localhost:3000"
```powershell
# Verifikasi container berjalan
docker ps | findstr aplikasi-reservasi

# Lihat logs
docker logs nama-container

# Cek network
docker network ls
docker network inspect bridge
```

---

## 📋 Commands Reference

### Container Management
```powershell
# List running containers
docker ps

# List all containers (including stopped)
docker ps -a

# Stop container
docker stop nama-container

# Start stopped container
docker start nama-container

# Remove container
docker rm nama-container

# Remove image
docker rmi aplikasi-reservasi:latest
```

### Debugging
```powershell
# View logs
docker logs nama-container

# Follow logs (real-time)
docker logs -f nama-container

# Enter container shell
docker exec -it nama-container sh

# Check file inside container
docker exec nama-container ls -la /app
```

### Database
```powershell
# Run migration manually
docker exec nama-container npx prisma migrate deploy

# Seed database manually
docker exec nama-container npm run db:seed

# Access SQLite database (inside container)
docker exec -it nama-container sqlite3 /app/data/prod.db
```

---

## 🔄 Docker Compose (Optional)

Jika ingin menggunakan docker-compose (lebih mudah):

**docker-compose.yml**:
```yaml
version: '3.8'

services:
  app:
    image: aplikasi-reservasi:latest
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=file:./data/prod.db
      - NODE_ENV=production
      - SECURE_COOKIES=false
      - NEXT_PUBLIC_API_URL=http://localhost:3000
    volumes:
      - ./data:/app/data  # Persist database
    restart: unless-stopped
```

Jalankan dengan:
```powershell
docker-compose up -d
docker-compose logs -f
docker-compose down
```

---

## 📦 Backup & Restore

### Backup Image
```powershell
docker save aplikasi-reservasi:latest -o backup.tar
```

### Restore Image
```powershell
docker load -i backup.tar
```

### Backup Database (SQLite)
```powershell
# Copy database file from container
docker cp nama-container:/app/data/prod.db ./prod-backup.db

# Copy back
docker cp ./prod-backup.db nama-container:/app/data/prod.db
```

---

## 📊 Performance Tips

### Memory Usage
```powershell
# Check memory usage
docker stats nama-container

# Limit memory
docker run --memory=512m -p 3000:3000 aplikasi-reservasi:latest
```

### Disk Space
```powershell
# Check Docker disk usage
docker system df

# Clean up (remove unused images, containers, volumes)
docker system prune
docker system prune -a  # Remove all unused, including tagged images
```

---

## 🔐 Security Notes

### Development
- ✅ `SECURE_COOKIES=false` (HTTP is OK for localhost)
- ✅ Default credentials OK for dev/testing
- ✅ SQLite OK for small datasets

### Production
- ❌ Change default credentials
- ❌ Use HTTPS only (`SECURE_COOKIES=true`)
- ❌ Use PostgreSQL instead of SQLite
- ❌ Store secrets in env vars, not in code
- ❌ Use reverse proxy (nginx/caddy) for HTTPS termination

---

## 📝 Environment Variables

Lihat file `.env.example` untuk dokumentasi lengkap:

```bash
cat .env.example
```

Untuk override, gunakan `-e` flag:
```powershell
docker run -p 3000:3000 \
  -e DATABASE_URL="file:./data/prod.db" \
  -e SECURE_COOKIES=false \
  -e NEXT_PUBLIC_API_URL=http://localhost:3000 \
  aplikasi-reservasi:latest
```

---

## ❓ Need Help?

1. **Check logs**: `docker logs -f nama-container`
2. **Check entrypoint script**: `docker exec nama-container cat /app/docker-entrypoint.sh`
3. **Read DOCKER_BACKUP_INFO.md** untuk detail lengkap
4. **Check src/middleware.ts** untuk auth logic
5. **Check src/actions/auth.ts** untuk login logic

---

**Last Updated**: 8 April 2026
**Version**: 2.0 (Fixed Auth Session)
