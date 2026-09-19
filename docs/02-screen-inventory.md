# 02 Screen Inventory

## Konvensi route prototype

Semua route berikut adalah file HTML statis pada fase awal. Nama route sengaja dibuat dekat dengan route Next.js yang akan datang agar migrasi markup lebih mudah.

| ID | File / route | Tujuan | CTA utama | Data yang dibaca/ditulis | Prioritas |
|---|---|---|---|---|---|
| S01 | `signin.html` | Menjelaskan jurnal privat dan masuk | Masuk dengan Google | `session` mock | P0 |
| S02 | `onboarding.html` | Membuat profil anak pertama | Lanjutkan | `child` | P0 |
| S03 | `invite-partner.html` | Menghubungkan pasangan | Kirim undangan | `invite` mock | P0 |
| S04 | `timeline.html` | Melihat seluruh cerita berdasarkan tanggal | Tulis cerita | `entries`, `child`, `storage` | P0 |
| S05 | `create-entry.html` | Membuat atau mengedit cerita | Simpan cerita | `entry`, `photos` mock | P0 |
| S06 | `entry-detail.html` | Membaca cerita lengkap dan galeri | Edit cerita | `entry`, `photos` | P0 |
| S07 | `family-settings.html` | Mengelola anggota dan kapasitas media | Kelola anggota / Export foto | `family`, `members`, `storage` | P0 |
| S08 | state: empty | Menjelaskan timeline yang belum memiliki cerita | Tulis cerita pertama | `entries=[]` | P0 |
| S09 | state: upload-error | Menjelaskan foto yang gagal diproses | Coba lagi / Hapus foto | `photo.status=error` | P0 |
| S10 | state: storage-full | Memungkinkan teks tetap tersimpan saat media penuh | Simpan tanpa foto / Export foto | `storage.used >= storage.quota` | P0 |

## Detail screen dan komponen

### S01 Sign in

- Logo teks Little Moment.
- Judul: `Simpan cerita tumbuh kembangnya`.
- Deskripsi singkat tentang jurnal privat untuk dua orang tua.
- Tombol utama `Masuk dengan Google`.
- Link sekunder untuk kebijakan privasi.
- State loading pada tombol dan state error inline.

### S02 Child onboarding

- Input nama panggilan anak.
- Date input tanggal lahir.
- Preview avatar berbasis inisial, bukan upload foto wajib.
- CTA `Lanjutkan` disabled sampai nama dan tanggal valid.
- Validasi: nama 1 sampai 40 karakter, tanggal tidak boleh di masa depan.

### S03 Invite partner

- Ringkasan profil anak.
- Input email pasangan.
- Tombol `Kirim undangan`.
- Link `Lewati dulu` yang mengarah ke timeline.
- Success state menampilkan status undangan tanpa menghalangi akses timeline.

### S04 Timeline

- Top bar: nama keluarga, status privacy, menu settings.
- Ringkasan anak dengan umur relatif, contoh `Si Kecil, 14 bulan`.
- Composer prompt `Ada momen kecil hari ini?`.
- Filter ringan: `Semua`, `Cerita`, `Milestone`.
- Entry card: tanggal, judul opsional, excerpt, thumbnail gallery, author.
- Floating atau bottom CTA `Tulis cerita` hanya jika tidak menutupi konten.
- Pull-to-refresh tidak diperlukan pada prototype.

### S05 Create entry

- Date picker default hari ini.
- Segmented type: `Cerita harian` dan `Milestone`.
- Judul opsional maksimal 80 karakter.
- Textarea wajib maksimal 2.000 karakter.
- Photo picker mock maksimal enam slot, preview, remove, dan reorder.
- CTA sticky `Simpan cerita`.
- Unsaved changes warning hanya bila pengguna menutup halaman setelah mengubah isi.

### S06 Entry detail

- Header dengan back button, tanggal, dan menu edit.
- Gallery hero dengan caption alt yang tersedia.
- Judul, isi cerita, label type, dan author.
- Metadata waktu dibuat dan terakhir diubah.
- Destructive action `Hapus cerita` harus memakai dialog konfirmasi.

### S07 Family and storage settings

- Kartu keluarga: nama keluarga, avatar anggota, role.
- Action `Undang pasangan` bila undangan belum diterima.
- Indikator `1,38 GB dari 8 GB` dan progress bar berlabel.
- Action `Export foto` dengan status queued mock.
- Link `Keluar` dan link privacy.

### S08 Empty timeline

- Ilustrasi atau placeholder lokal sederhana, tidak memakai stok foto eksternal.
- Headline `Belum ada cerita`.
- Body satu kalimat yang mengarahkan ke input pertama.
- CTA `Tulis cerita pertama`.

### S09 Upload error

- Error ditampilkan dekat thumbnail terkait.
- Copy utama `1 foto gagal diunggah`.
- Action per foto `Coba lagi` dan `Hapus foto`.
- Tombol simpan tetap mengizinkan penyimpanan teks.

### S10 Storage full

- Banner persisten dengan status `Penyimpanan foto penuh`.
- Penjelasan `Jurnal teks tetap tersedia`.
- CTA sekunder `Export foto`.
- Jika pengguna memilih foto baru, tawarkan `Simpan tanpa foto` sebelum menutup form.

## Shared states

Semua screen harus memiliki loading, disabled, success, error, dan focus-visible state yang sama. Jangan memakai spinner tanpa konteks. Untuk proses yang belum memiliki denominator, gunakan label langkah seperti `Menyiapkan foto`.
