# R&B Grill Palembang — Aplikasi Reservasi Restoran

Aplikasi reservasi meja restoran berbasis web dengan role **Admin** dan
**Receptionist**, dilengkapi floor map interaktif, manajemen customer, laporan,
dan upload attachment (bukti transfer DP, dll). Berbentuk **PWA** sehingga bisa
di-install di perangkat mobile.

## ✨ Fitur

### Reservasi

- Buat / edit reservasi dengan format nomor otomatis `RB-YYYYMMDD-001`
- Pemilihan multi-meja dengan deteksi konflik jadwal (window 3 jam, hanya status
  `CONFIRMED` yang memblokir meja)
- Alur status: `PENDING → CONFIRMED → COMPLETED` / `CANCELLED` (status final
  tidak bisa diubah lagi)
- Filter berdasarkan status & tanggal
- **Attachment** — upload bukti transfer DP & dokumen lain (JPG, PNG, WEBP,
  HEIC, PDF; maks 5 MB/file, maks 10 file/reservasi) dengan preview gambar,
  download, dan audit log
- Validasi tanggal (tidak boleh tanggal lampau) dengan dialog konfirmasi

### Customer

- Autocomplete nama/telepon saat input reservasi
- Counter jumlah kunjungan (`visitCount`) & penanda VIP otomatis

### Admin

- Dashboard & chart reservasi mingguan
- Manajemen user (role ADMIN / RECEPTIONIST)
- Manajemen meja & lantai (import Excel via `TableImport`)
- Floor map editor (posisi meja drag & drop)
- Laporan & export Excel (`ExportButton`)
- Log aktivitas sistem (`SystemLog`) — semua aksi penting tercatat (login,
  buat/batal reservasi, upload/hapus attachment, dll)

### Lainnya

- PWA (installable, offline-ready via service worker)
- Mobile-first UI untuk receptionist (frame 430px)

## 🛠 Tech Stack

| Layer     | Teknologi                                                       |
| --------- | --------------------------------------------------------------- |
| Framework | Next.js 16 (App Router, Server Actions, standalone output)      |
| UI        | React 19, Tailwind CSS 3, Radix UI (shadcn-style), lucide-react |
| Database  | SQLite + Prisma ORM 6                                           |
| PWA       | @ducanh2912/next-pwa                                            |
| Lainnya   | react-hook-form + zod, exceljs, recharts, sonner                |

## 🚀 Menjalankan di Lokal (Development)

```bash
# 1. Install dependencies
npm install

# 2. Setup environment
copy .env.example .env   # Windows
# .env berisi: DATABASE_URL="file:./dev.db"

# 3. Jalankan migrasi & seed
npx prisma migrate dev
npm run db:seed

# 4. Start dev server
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).

### Login Default

| Role         | Username       | Password       |
| ------------ | -------------- | -------------- |
| Admin        | `admin`        | `admin`        |
| Receptionist | `receptionist` | `receptionist` |

### Skrip yang Tersedia

| Perintah              | Fungsi                                 |
| --------------------- | -------------------------------------- |
| `npm run dev`         | Dev server (Turbopack)                 |
| `npm run build`       | Build production (webpack, standalone) |
| `npm run start`       | Jalankan hasil build                   |
| `npm run lint`        | ESLint                                 |
| `npm run db:migrate`  | `prisma migrate dev`                   |
| `npm run db:push`     | `prisma db push` (tanpa migrasi)       |
| `npm run db:generate` | `prisma generate`                      |
| `npm run db:seed`     | Seed data awal (user, floor, meja)     |

## 📎 Fitur Attachment (Bukti Transfer DP)

Metadata disimpan di tabel `ReservationAttachment`, file fisik di folder
`UPLOAD_DIR` (default `<project>/data/uploads`; di Docker `/app/data/uploads` —
satu volume dengan database sehingga ikut persisten).

| Endpoint                        | Fungsi                                             |
| ------------------------------- | -------------------------------------------------- |
| `POST /api/attachments`         | Upload file (FormData: `reservationId`, `files[]`) |
| `DELETE /api/attachments/:id`   | Hapus lampiran + file fisiknya                     |
| `GET /api/attachments/:id/file` | Stream file; `?download=1` untuk force download    |

Aturan validasi (client & server):

- Tipe: `image/jpeg`, `image/png`, `image/webp`, `image/heic`, `application/pdf`
- Ukuran maksimal **5 MB** per file
- Maksimal **10 file** per reservasi
- Nama file di-storage di-random (UUID) untuk mencegah path traversal
- Wajib login (cek cookie `userId`); setiap upload/hapus tercatat di `SystemLog`

UI-nya (`src/components/features/AttachmentManager.tsx`) punya 2 mode:

- **Mode pending** (form reservasi baru): file ditahan di browser, otomatis
  di-upload setelah reservasi berhasil dibuat
- **Mode langsung** (form edit): upload/hapus langsung ke server, lampiran
  existing tampil dengan thumbnail

### Melihat Attachment (View)

Badge 📎 di daftar reservasi (receptionist & admin) bisa diklik untuk membuka
dialog `ViewAttachmentsDialog` yang menampilkan semua lampiran reservasi:

- Thumbnail gambar, nama file, ukuran, dan tanggal upload
- Tombol **View image** — preview gambar fullscreen dengan navigasi prev/next
  (jika ada beberapa gambar) dan counter posisi
- Tombol **Download** — unduh file asli dengan nama aslinya

## 🐳 Deployment dengan Docker

Lihat [DOCKER_QUICKSTART.md](DOCKER_QUICKSTART.md) untuk panduan lengkap.
Ringkasannya:

```powershell
# Build & jalankan (port host 3001)
docker compose up -d --build
```

- Database SQLite & attachment tersimpan di named volume `sqlite_data`
  (`/app/data`) — aman antar restart/rebuild
- Entrypoint otomatis menjalankan `prisma migrate deploy` + seed saat container
  start
- Backup/restore image via `backup-docker-image.ps1` /
  `restore-docker-image.ps1`

## 🗂 Struktur Project

```
prisma/
  schema.prisma          # Model: User, Customer, Table, Floor, Reservation,
                         #        ReservationTable, ReservationAttachment, SystemLog
  migrations/            # Migrasi SQL
  seed.ts                # Data awal
src/
  middleware.ts          # Proteksi route berdasarkan cookie role
  actions/               # Server Actions (auth, reservations, customers, tables,
                         #        floors, users, reports, dashboard, table-import)
  app/
    login/               # Halaman login
    admin/               # Dashboard, reservations, users, tables, map,
                         #        customers, reports, logs
    receptionist/        # Dashboard, reservations (+ new & [id]/edit),
                         #        map, customers
    api/
      attachments/       # Upload/delete/stream attachment
      tables/            # Cek ketersediaan meja + konflik jadwal
      customers/search/  # Autocomplete customer
  components/
    features/            # AttachmentManager, ViewAttachmentsDialog, AttachmentBadge,
                         #        StatusChanger, ReservationFilter,
                         #        FloorManager, TableImport, OccupancyMap, dll
    ui/                  # Komponen dasar (button, card, dialog, dll)
  lib/
    prisma.ts            # Prisma client singleton
    attachments.ts       # Helper storage file (validasi, save, read, delete)
data/
  uploads/               # File attachment (di-gitignore)
```

## 🔐 Environment Variables

Lihat [.env.example](.env.example):

| Variable              | Default                 | Keterangan                                         |
| --------------------- | ----------------------- | -------------------------------------------------- |
| `DATABASE_URL`        | `file:./dev.db`         | Koneksi SQLite; di Docker `file:/app/data/prod.db` |
| `UPLOAD_DIR`          | `./data/uploads`        | Lokasi penyimpanan file attachment                 |
| `SECURE_COOKIES`      | `false`                 | `true` hanya jika di-balik HTTPS                   |
| `NEXT_PUBLIC_API_URL` | `http://localhost:3000` | Base URL API                                       |

## ⚠️ Catatan Produksi

- Ganti kredensial default & hashing password (`auth.ts` saat ini membandingkan
  plaintext)
- Gunakan HTTPS (`SECURE_COOKIES=true`) di-balik reverse proxy (nginx/caddy)
- Pertimbangkan PostgreSQL untuk dataset besar
- Backup rutin volume `/app/data` (database + attachment)

---

**Last Updated**: 30 Oktober 2026
