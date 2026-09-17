# 01 Product Context

## Ringkasan produk

**Nama kerja:** Little Moment

Little Moment adalah jurnal digital privat untuk orang tua yang baru memiliki anak. Dua orang tua dapat menyimpan cerita singkat dan foto milestone harian, lalu membukanya kembali sebagai timeline keluarga. Produk harus terasa cepat dipakai di ponsel, aman untuk data keluarga, dan cukup sederhana untuk diisi dalam waktu kurang dari satu menit.

## Masalah yang diselesaikan

- Momen kecil anak sering hilang di chat, galeri, atau ingatan.
- Orang tua membutuhkan tempat bersama yang tidak terasa seperti aplikasi administrasi.
- Input harus bisa dilakukan dengan satu tangan dan tetap berguna walau hanya berupa satu kalimat.
- Foto keluarga bersifat sensitif sehingga penyimpanan dan akses perlu dikontrol.

## Target pengguna

### Pengguna utama

Orang tua baru dengan anak usia 0 sampai 24 bulan. Mereka memakai ponsel, memiliki waktu terbatas, dan ingin berbagi jurnal dengan pasangan.

### Pengguna sekunder

Pasangan yang diundang ke jurnal keluarga. Pada MVP, semua anggota memiliki hak baca dan tulis yang sama.

## Sasaran dan metrik sukses MVP

1. Pengguna dapat masuk, membuat profil anak, dan melihat timeline dalam maksimal tiga langkah setelah layar masuk.
2. Pengguna dapat membuat entri tulisan tanpa foto dan langsung melihatnya di timeline.
3. Pengguna dapat menambahkan beberapa foto placeholder, menghapus foto sebelum disimpan, dan membuka detail entri.
4. Timeline di viewport 390 x 844 px tidak memiliki horizontal scroll dan kontrol utama dapat dijangkau dengan satu tangan.
5. Saat kuota foto penuh, teks tetap dapat disimpan dan alasan kegagalan terlihat jelas.
6. Prototype dapat dijalankan lokal tanpa layanan berbayar atau akun layanan eksternal.

Metrik di atas memvalidasi pengalaman dan alur data. **Lifetime access** adalah tujuan retensi produk, bukan klaim yang dapat dibuktikan oleh prototype. Implementasi produksi harus menambahkan kebijakan backup, restore, dan retensi data.

## Batasan keras

- Deadline desain dan prototype: satu minggu.
- Semua layanan baru pada MVP harus gratis. Gunakan VPS yang sudah dimiliki sebagai tempat aplikasi, MySQL, dan media; jangan menambahkan trial, API berbayar, atau free tier yang memiliki automatic overage.
- Frontend target: Next.js.
- Data layer target: Drizzle ORM dan Better Auth dengan MySQL.
- Deployment target saat implementasi produksi: VPS milik pengguna. Vercel tidak diperlukan untuk fase data dan prototype; jika dipakai kemudian, hanya untuk frontend yang tidak menyimpan kredensial atau media secara langsung.
- Fase sekarang hanya membuat desain dan prototype HTML. Tidak ada autentikasi nyata, upload nyata, atau koneksi database.

## Ruang lingkup bertahap

### P0, wajib selesai dalam satu minggu

- Sign in placeholder.
- Onboarding satu profil anak.
- Invite pasangan sebagai simulasi.
- Timeline berdasarkan tanggal dengan kartu entri tulisan dan foto.
- Buat, edit, dan hapus entri.
- Preview serta reorder sederhana untuk maksimal enam foto pada satu entri.
- Detail entri.
- Pengaturan keluarga dan indikator kuota foto.
- Empty state, upload error, dan storage full state.
- Data mock tersimpan di localStorage agar alur prototype terasa nyata.

### P1, setelah alur P0 tervalidasi

- Better Auth dengan Google dan email magic link jika provider gratis tersedia tanpa ketergantungan baru.
- Undangan pasangan berbasis token sekali pakai.
- Export jurnal ke JSON dan ZIP foto dari VPS.
- Draft offline dan retry upload yang aman.
- Backup database dan media terjadwal ke disk VPS kedua.

### P2, tidak dikerjakan pada minggu pertama

- Banyak profil anak dalam satu keluarga.
- Pencarian dan filter kategori milestone.
- Pengingat harian.
- Buku tahunan atau layout cetak.
- Komentar, reaction, atau akses anggota keluarga lain.
- AI-generated summary atau klasifikasi foto.

## Prinsip produk

1. **Satu momen, satu aksi utama.** Pengguna tidak boleh menebak tombol untuk menyimpan.
2. **Private by default.** Hanya anggota jurnal yang dapat membaca konten.
3. **Teks tetap bernilai.** Foto adalah tambahan, bukan syarat untuk menyimpan cerita.
4. **Cepat dan tidak menghakimi.** Tidak ada streak, skor, atau notifikasi yang membuat orang tua merasa gagal.
5. **Accessible sejak prototype.** Markup semantik, keyboard support, focus state, alt text, dan reduced motion harus diuji sebelum implementasi Next.js.

## Asumsi yang perlu dikonfirmasi saat implementasi

- Satu keluarga memiliki satu profil anak pada MVP.
- Ukuran kuota media awal dapat dikonfigurasi, default 8 GiB pada volume VPS.
- File foto disimpan pada volume privat VPS, sedangkan database hanya menyimpan metadata dan path internal.
- Entri yang sudah dibuat dapat diedit atau dihapus oleh kedua anggota keluarga.
- Experience dan budget tambahan tidak diberikan. Rencana ini mengasumsikan kemampuan coding dasar sampai menengah dan tidak menambah biaya layanan baru.
