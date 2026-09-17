# Deployment Little Moment ke VPS

Target awal memakai Docker Compose dengan MySQL 8.4 dan Next.js standalone. Semua komponen aplikasi tidak membutuhkan layanan SaaS berbayar; object storage foto masih berupa interface metadata dan perlu dihubungkan ke storage VPS sebelum upload binary diaktifkan.

## 1. Siapkan environment di server

```bash
cp .env.example .env
openssl rand -hex 32
```

Isi minimal:

```dotenv
MYSQL_PASSWORD=...
MYSQL_ROOT_PASSWORD=...
BETTER_AUTH_SECRET=...
BETTER_AUTH_URL=http://HOST-ATAU-DOMAIN
NEXT_PUBLIC_APP_URL=http://HOST-ATAU-DOMAIN
```

## 2. Jalankan stack

```bash
sudo docker compose up -d --build mysql migrate app
sudo docker compose ps
curl http://127.0.0.1:3000/api/health
```

`/api/health` harus mengembalikan `{"ok":true,"database":"connected","mode":"api"}`. Container `migrate` menjalankan `drizzle-kit push --force` saat deployment awal agar schema fresh dapat dibuat non-interaktif; migration SQL tetap disimpan di `drizzle/` untuk alur migrasi berikutnya.

## 3. Catatan autentikasi

Better Auth sudah terpasang dengan adapter Drizzle/MySQL dan route `/api/auth/*`. Google OAuth sengaja nonaktif sampai `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, serta callback URL domain produksi dikonfigurasi. Email/password adapter aktif untuk fase berikutnya.
