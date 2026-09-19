# Deployment Little Moment dengan TiDB Cloud Starter

Production memakai Next.js di Vercel dan TiDB Cloud Starter sebagai database MySQL-compatible. TiDB Cloud Starter mewajibkan TLS pada public endpoint; kode aplikasi otomatis mengaktifkan TLS ketika host `DATABASE_URL` berakhiran `.tidbcloud.com`, atau ketika `TIDB_ENABLE_SSL=true`.

Untuk MVP tanpa service tambahan, foto dikompres di browser (maksimal 1.600 px pada sisi terpanjang) lalu disimpan sebagai data URL JPEG di kolom `photos.data_url` TiDB. Ini membuat foto bertahan setelah reload dan tetap privat di balik session. Object storage privat (misalnya R2) dapat menggantikan strategi inline ini ketika volume foto mulai besar.

## 1. Buat instance TiDB Cloud Starter

1. Buka TiDB Cloud Console dan buat instance **Starter**.
2. Buka instance tersebut lalu klik **Connect**.
3. Pilih koneksi **Public**, branch `main`, dan metode koneksi General.
4. Generate password lalu simpan di password manager.
5. Tambahkan IP laptop pada firewall TiDB untuk menjalankan migration dari lokal.
6. Salin MySQL connection string yang disediakan TiDB. User TiDB Cloud Starter biasanya memiliki prefix instance, jadi jangan menggantinya dengan `root` polos.

Formatnya:

```dotenv
DATABASE_URL=mysql://<prefix>.root:<password>@<gateway>.tidbcloud.com:4000/test
TIDB_ENABLE_SSL=true
```

## 2. Jalankan migration dari lokal

`drizzle-kit` membaca `.env.local` melalui konfigurasi repository ini. Environment variable di Vercel tidak otomatis tersedia di terminal lokal. Jika variable production sudah tersimpan di Vercel, Anda dapat menariknya ke file lokal (file ini di-ignore oleh Git):

```bash
npx vercel env pull .env.local --environment=production
```

Catatan: untuk variable yang ditandai **Sensitive**, Vercel CLI dapat menulis placeholder `[SENSITIVE]` alih-alih nilainya. Jika itu terjadi pada `DATABASE_URL`, salin URI asli dari menu **Connect** TiDB ke `.env.local` secara manual.

Atau buat file secara manual:

```bash
cp .env.example .env.local
```

Isi `.env.local` dengan connection string TiDB dan secret lokal:

```dotenv
DATABASE_URL=mysql://<prefix>.root:<password>@<gateway>.tidbcloud.com:4000/little_moment
TIDB_ENABLE_SSL=true
BETTER_AUTH_SECRET=secret-lokal-acak
NEXT_PUBLIC_BACKEND_MODE=api
```

Jika database default dari TiDB adalah `test`, gunakan database itu atau buat database aplikasi melalui SQL Editor:

```sql
CREATE DATABASE little_moment;
```

Apply the committed migration chain. This is the recommended path for a fresh database and keeps future schema changes trackable:

```bash
npm install
npm run db:migrate
```

For a database that already has Little Moment tables, apply the committed Drizzle migration (including configurable parent labels) with:

```bash
npm run db:migrate
```

Use `db:push` only for an explicitly reviewed development database. Do not mix an untracked `db:push`-initialized database with the migration chain unless its Drizzle migration metadata has also been reconciled.

Jika `db:push` berhenti pada konflik index foreign key lama, jalankan perubahan kolom secara langsung dari SQL Editor TiDB lalu ulangi deploy:

```sql
ALTER TABLE photos ADD COLUMN data_url LONGTEXT NULL;
```

Verifikasi koneksi:

```bash
npm run db:studio
```

## 3. Set environment production di Vercel

```bash
vercel env add DATABASE_URL production --sensitive
vercel env add TIDB_ENABLE_SSL production --value "true" --yes
vercel env add NEXT_PUBLIC_BACKEND_MODE production --value "api" --force --yes
```

`BETTER_AUTH_URL` dan `NEXT_PUBLIC_APP_URL` harus memakai URL deployment kamu sendiri, misalnya `https://little-moment-keluarga.vercel.app`.

## 4. Deploy dan cek health

```bash
vercel --prod --yes
curl https://<project>.vercel.app/api/health
```

Hasil yang diharapkan:

```json
{"ok":true,"database":"connected"}
```

## 5. Aktifkan Google OAuth

1. Buka **Google Cloud Console → APIs & Services → Credentials**.
2. Buat **OAuth client ID** dengan tipe **Web application**.
3. Tambahkan Authorized JavaScript origins:

```text
https://<project>.vercel.app
http://localhost:3010
```

4. Tambahkan Authorized redirect URIs:

```text
https://<project>.vercel.app/api/auth/callback/google
http://localhost:3010/api/auth/callback/google
```

5. Simpan Client ID dan Client Secret. Di Vercel, tambahkan:

```text
GOOGLE_CLIENT_ID=<client-id>
GOOGLE_CLIENT_SECRET=<client-secret>
NEXT_PUBLIC_GOOGLE_AUTH_ENABLED=true
```

`GOOGLE_CLIENT_SECRET` disimpan sebagai Secret. `GOOGLE_CLIENT_ID` dan `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED` disimpan sebagai Config. Setelah menambah variable, lakukan redeploy agar flag publik terbaca saat build.

Better Auth menggunakan callback default `/api/auth/callback/google`; `BETTER_AUTH_URL` harus menunjuk ke domain yang sama dengan callback production.

## 6. Aktifkan email undangan pasangan melalui Gmail

Email invitation dikirim melalui Gmail SMTP menggunakan Google App Password. Aktifkan 2-Step Verification pada akun Gmail pengirim, buat App Password khusus Little Moment, lalu tambahkan environment variables berikut di Vercel untuk **Production**:

```text
GMAIL_USER=email-pengirim@gmail.com
GMAIL_APP_PASSWORD=16-karakter-app-password
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=email-pengirim@gmail.com
SMTP_PASSWORD=16-karakter-app-password
SMTP_FROM_EMAIL=Little Moment <email-pengirim@gmail.com>
```

`GMAIL_APP_PASSWORD` dan `SMTP_PASSWORD` disimpan sebagai Secret. Variable lainnya boleh Config. Setelah itu redeploy. Jika variable belum diisi atau Gmail menolak autentikasi, aplikasi mengembalikan error dan tidak menampilkan undangan sebagai berhasil terkirim.

## Legacy: deployment Docker di VPS

Jika suatu saat VPS dipakai lagi, Docker Compose lama tetap tersedia di `docker-compose.yml` dan dapat memakai MySQL lokal. Jangan menjalankan dua database production sekaligus tanpa rencana migrasi.
