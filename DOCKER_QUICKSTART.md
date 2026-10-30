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

| Role         | Username     | Password     |
| ------------ | ------------ | ------------ |
| Admin        | admin        | admin        |
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

**Solusi**: Database belum ter-migrasi. Container harus menjalankan migrasi
secara otomatis.

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

## 🔄 Docker Compose (Recommended)

Project ini sudah punya `docker-compose.yml` (port host **3001**, named volume,
healthcheck):

```powershell
# Build & start (background)
docker compose up -d --build

# Lihat status & health
docker compose ps

# Lihat logs
docker compose logs -f app

# Stop
docker compose down

# Stop + hapus volume (HAPUS database!)
docker compose down -v
```

Isi `docker-compose.yml`:

```yaml
services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    image: aplikasi-reservasi:latest
    container_name: aplikasi-reservasi
    restart: unless-stopped
    ports:
      - '3001:3000' # host:container (3000 dipakai container lain di mesin ini)
    environment:
      DATABASE_URL: 'file:/app/data/prod.db'
      NODE_ENV: production
      SECURE_COOKIES: 'false'
      NEXT_PUBLIC_API_URL: 'http://localhost:3001'
      # Attachment uploads directory (inside the persistent volume)
      UPLOAD_DIR: '/app/data/uploads'
    volumes:
      - sqlite_data:/app/data # persistensi SQLite + file attachment
    healthcheck:
      test:
        [
          'CMD-SHELL',
          'wget -qO- http://127.0.0.1:3000/ >/dev/null 2>&1 || exit 1',
        ]
      interval: 30s
      timeout: 10s
      retries: 5
      start_period: 40s

volumes:
  sqlite_data:
```

Akses: `http://localhost:3001` — login `admin`/`admin` atau
`receptionist`/`receptionist`.

**Catatan**: Saat container start, entrypoint otomatis menjalankan
`prisma migrate deploy` + seed (upsert, aman dijalankan berulang). Database
tersimpan di named volume `sqlite_data`, jadi data bertahan antar
restart/rebuild container. File attachment (bukti transfer DP, dll) juga
tersimpan di volume yang sama (`/app/data/uploads`), sehingga ikut bertahan.

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

### Backup File Attachment (Bukti Transfer DP, dll)

```powershell
# Copy seluruh folder uploads dari container
docker cp nama-container:/app/data/uploads ./uploads-backup
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
2. **Check entrypoint script**:
   `docker exec nama-container cat /app/docker-entrypoint.sh`
3. **Read DOCKER_BACKUP_INFO.md** untuk detail lengkap
4. **Check src/middleware.ts** untuk auth logic
5. **Check src/actions/auth.ts** untuk login logic

---

**Last Updated**: 30 Oktober 2026 **Version**: 2.1 (Tambah Fitur Attachment
Bukti Transfer DP)
