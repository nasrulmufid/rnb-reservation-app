# Docker Image Backup Information

## Tanggal Update
**8 April 2026 - 14:35 WIB** (Fixed: Session/Auth Cookie Issue)

## Informasi Docker Image

### Image Details
- **Nama Image**: `aplikasi-reservasi`
- **Tag**: `latest`
- **Image ID**: `cae7ac100da84e61` (v2 - Fixed Auth)
- **Ukuran**: ~1,187 MB
- **Base Image**: `node:20-alpine`
- **Status**: ✅ Successfully Built & Tested

### Build Summary
- Build Duration: ~227.7 detik (~3.8 menit)
- Dependency Installation: ✅ npm ci
- Prisma Generation: ✅
- Application Build: ✅ npm run build
- Multi-stage Build: ✅ (deps, builder, runner)

## 🆕 Recent Fixes (v2)

### Fixed Issues
1. **Session Loss After Login** ✅
   - **Problem**: User login berhasil, tapi saat klik menu → redirect ke login page
   - **Root Cause**: Cookie `secure` flag diset ke `true` saat `NODE_ENV=production`, tapi aplikasi diakses via HTTP (localhost:3000), jadi browser tidak mengirim cookie
   - **Solution**: 
     - Ubah logic di `src/actions/auth.ts` untuk cek `SECURE_COOKIES` env var
     - Hanya set `secure: true` jika `SECURE_COOKIES=true` dan/atau HTTPS
     - Set `SECURE_COOKIES=false` di Dockerfile untuk localhost development
     - Buat `.env.example` untuk dokumentasi

2. **Prisma Schema Database URL** ✅
   - Changed: `url = "file:./dev.db"` → `url = env("DATABASE_URL")`
   - Flexible configuration untuk development dan production

3. **Automatic Database Migrations** ✅
   - Entrypoint script menjalankan `npx prisma migrate deploy` otomatis saat container start
   - Database di-seed dengan data initial (admin user, floors, tables, customers)

## Backup Files

### File Backup Tersedia
```
aplikasi-reservasi-backup-fixed.tar           (~1,186 MB) - v1 (Prisma fix only)
aplikasi-reservasi-backup-v2-fixed-auth.tar   (~1,186 MB) - v2 (Prisma + Auth cookie fix)  [LATEST]
Lokasi: E:\PRibadi\Mufid\my Project\Aplikasi-reservasi\
```

## Cara Menggunakan

### 1. **Jalankan Docker Container**
```bash
# Development (HTTP localhost - recommended)
docker run -p 3000:3000 aplikasi-reservasi:latest

# Production (HTTPS - update env vars)
docker run -p 443:3000 \
  -e SECURE_COOKIES=true \
  -e NEXT_PUBLIC_API_URL=https://yourdomain.com \
  aplikasi-reservasi:latest
```

### 2. **Restore Docker Image dari Backup**
```bash
docker load -i aplikasi-reservasi-backup-v2-fixed-auth.tar
```

### 3. **Verifikasi Image Setelah Restore**
```bash
docker images | findstr aplikasi-reservasi
docker run --rm -p 3000:3000 aplikasi-reservasi:latest
```

### 4. **Login & Test**
```
URL: http://localhost:3000
Admin Login:
  Username: admin
  Password: admin
  
Receptionist Login:
  Username: receptionist
  Password: receptionist
```

### 5. **Test Session Persistence**
1. Login dengan admin / admin
2. Klik menu: Dashboard → Customers → Reservations → Users → Logs
3. Verifikasi: **TIDAK kembali ke login page**, session tetap maintain

## Environment Variables

### Development (.env.local)
```env
DATABASE_URL="file:./dev.db"
NODE_ENV="development"
SECURE_COOKIES="false"
NEXT_PUBLIC_API_URL="http://localhost:3000"
```

### Production (Docker)
```env
DATABASE_URL="file:./data/prod.db"
NODE_ENV="production"
SECURE_COOKIES="false"  # Set to "true" jika menggunakan HTTPS
NEXT_PUBLIC_API_URL="http://localhost:3000"  # Ubah sesuai domain
```

### Setting HTTPS di Docker Production
```bash
# Jika menggunakan HTTPS (misal dengan reverse proxy/nginx)
docker run -p 443:3000 \
  -e SECURE_COOKIES=true \
  -e NEXT_PUBLIC_API_URL=https://yourdomain.com \
  -v /path/to/certs:/app/certs \
  aplikasi-reservasi:latest
```

## Docker Configuration

### Dockerfile Features
- ✅ Multi-stage build (deps, builder, runner)
- ✅ Optimized layer caching
- ✅ Security: Non-root user (nextjs)
- ✅ Prisma client generation
- ✅ Automatic migrations on startup (entrypoint.sh)
- ✅ Automatic database seeding
- ✅ Next.js standalone output
- ✅ Output file tracing untuk ukuran minimal
- ✅ Smart cookie security handling (HTTP vs HTTPS)

### Entrypoint Script (docker-entrypoint.sh)
```bash
#!/bin/sh
set -e

# Set default DATABASE_URL if not provided
if [ -z "$DATABASE_URL" ]; then
  export DATABASE_URL="file:./data/prod.db"
  mkdir -p ./data
fi

# Run migrations
npx prisma migrate deploy

# Seed database (optional)
npm run db:seed

# Start Next.js server
exec node server.js
```

## Troubleshooting

### Issue: "The table `main.User` does not exist" (P2021 Error)
**✅ FIXED** - Migrasi otomatis berjalan saat container start

### Issue: Login Berhasil tapi Redirect ke Login Page Saat Klik Menu
**✅ FIXED** - Cookie security logic diperbaiki
- Solusi: Pastikan `SECURE_COOKIES=false` untuk HTTP localhost
- Untuk HTTPS production: set `SECURE_COOKIES=true`

### Cek Logs Container
```bash
docker logs -f nama-container
```

### Manual Migration (jika diperlukan)
```bash
docker exec -it nama-container npx prisma migrate deploy
```

### Masuk ke Container Shell
```bash
docker exec -it nama-container sh
```

## Rekomendasi

### Development
- Gunakan `docker run -p 3000:3000 aplikasi-reservasi:latest`
- Akses via `http://localhost:3000`
- Semua env vars sudah default

### Production
- Setup HTTPS dengan reverse proxy (nginx/caddy)
- Set environment variables:
  ```bash
  DATABASE_URL=postgresql://... (gunakan Postgres untuk production)
  SECURE_COOKIES=true
  NEXT_PUBLIC_API_URL=https://yourdomain.com
  ```
- Atau gunakan `.env.production` file

### Backup Strategy
1. Backup image setiap kali deploy versi baru
2. Tag image dengan version: `aplikasi-reservasi:v1`, `aplikasi-reservasi:v2`, dst
3. Simpan backup offline untuk disaster recovery
4. Upload ke container registry (Docker Hub, GitHub Container Registry, etc)

## Architecture Changes

### Before (v1)
```
├── Dockerfile: hardcoded schema datasource ke "./dev.db"
├── .env.local: tidak ada (manual setup)
└── Issue: Database migrations tidak otomatis, session cookie issue
```

### After (v2 - Current)
```
├── Dockerfile: 
│   ├── DATABASE_URL env var (flexible)
│   ├── SECURE_COOKIES env var (HTTP/HTTPS aware)
│   └── ENTRYPOINT: docker-entrypoint.sh
├── docker-entrypoint.sh: automatic migrations & seeding
├── prisma/schema.prisma: url = env("DATABASE_URL")
├── src/actions/auth.ts: smart cookie security logic
├── .env.local: default dev config
├── .env.example: documentation
└── ✅ Fixed: P2021 (missing table) & session loss issues
```

## Catatan Penting
- File backup tidak tersinkronisasi dengan git (added ke `.gitignore`)
- Backup files cukup besar (~1.2 GB) karena termasuk node_modules
- Untuk production, pertimbangkan push ke Docker registry (smaller size + faster deployment)
- Cookie session: default 24 jam (dapat diubah di `src/actions/auth.ts`)
- Default credentials (dari seed):
  - Admin: `admin` / `admin`
  - Receptionist: `receptionist` / `receptionist`
  - System: `system` / `system_password_secure_random_hash`
