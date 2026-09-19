# 06 HTML Prototype Spec

## Tujuan fase

Membuat prototype HTML statis yang dapat direview di browser dan Pen.dev sebelum backend dibangun. Prototype harus membuktikan hirarki visual, navigasi, input, state, dan perilaku dasar tanpa mengirim data ke layanan eksternal.

## Struktur folder yang disarankan

```text
prototype/
  signin.html
  onboarding.html
  invite-partner.html
  timeline.html
  create-entry.html
  entry-detail.html
  family-settings.html
  assets/
    icons/
    placeholders/
  css/
    tokens.css
    base.css
    components.css
    screens.css
  js/
    app-state.js
    navigation.js
    mock-actions.js
  fixtures/
    sample-data.js
```

Jika prototype diletakkan langsung di root project, pertahankan nama file screen dan folder asset yang sama. Jangan menambahkan dependency runtime hanya untuk preview lokal.

## Runtime prototype

- HTML semantik, CSS native, dan vanilla JavaScript.
- Preview lokal dapat memakai `python3 -m http.server 8080` dari folder prototype.
- Semua data contoh dibuat anonim dan tidak berisi foto keluarga nyata.
- Gunakan `localStorage` dengan key `momen-kecil-prototype-v1` untuk mempertahankan state antar halaman.
- Sediakan action `Reset demo` di settings untuk mengembalikan fixture awal.

## Model state mock

```js
{
  session: { userId: "demo-user", status: "authenticated" },
  family: { id: "family-1", name: "Keluarga Kecil", ownerLabel: "Baba", memberLabel: "Bubu" },
  child: { id: "child-1", nickname: "Si Kecil", birthDate: "2025-01-12" },
  members: [
    { id: "demo-user", name: "Baba", role: "owner", inviteStatus: "accepted" },
    { id: "partner-1", name: "Bubu", role: "member", inviteStatus: "pending" }
  ],
  entries: [],
  storage: { usedBytes: 1480000000, quotaBytes: 8589934592 },
  ui: { forcedState: null }
}
```

`forcedState` menerima `empty`, `upload-error`, atau `storage-full` agar reviewer dapat menguji edge state tanpa memanipulasi data manual.

## Kontrak data entry

```js
{
  id: "entry-1",
  childId: "child-1",
  authorId: "demo-user",
  type: "story",
  title: "Langkah pertamanya",
  body: "Hari ini Si Kecil berdiri sendiri untuk pertama kali.",
  happenedAt: "2026-09-17",
  createdAt: "2026-09-17T09:00:00+07:00",
  updatedAt: "2026-09-17T09:00:00+07:00",
  photos: [
    { id: "photo-1", status: "uploaded", src: "assets/placeholders/photo-1.jpg", alt: "Foto dari cerita tanggal 17 September 2026" }
  ]
}
```

## Perilaku mock wajib

- Submit form menambahkan atau memperbarui entry lalu navigasi ke detail.
- Filter timeline bekerja pada `type` tanpa reload penuh.
- Photo picker menolak lebih dari enam file dan menampilkan pesan inline.
- Upload mock menampilkan `uploading` lalu `uploaded` atau `error`.
- Error photo tidak memblokir penyimpanan body.
- Storage full menonaktifkan upload baru, tetapi `Simpan tanpa foto` tetap menyimpan teks.
- Delete menghapus entry dan foto dari state mock setelah konfirmasi.
- Invite mengubah `inviteStatus` menjadi `pending` dan menampilkan success state.

## Markup and accessibility contract

- Satu `h1` per halaman dan heading order tidak melompat.
- Gunakan `main`, `header`, `nav`, `section`, `form`, dan `button` sesuai fungsi.
- Semua input memiliki `label` yang terhubung dengan `for` dan `id`.
- Modal menggunakan `role=dialog`, focus trap sederhana, dan escape untuk menutup.
- Focus-visible harus terlihat jelas dengan token `--color-focus`.
- Tidak ada action penting yang hanya tersedia lewat drag. Reorder foto harus punya tombol naik/turun.
- Gambar memiliki alt text. Placeholder lokal diberi alt yang bermakna atau `alt=""` bila dekoratif.
- Touch target minimal 44 px. Kontras teks dan control diuji pada light theme.
- Tambahkan skip link `Lewati ke konten utama`.
- Hormati `prefers-reduced-motion`.

## Handoff ke Next.js dan VPS

- Pindahkan token dari `tokens.css` ke CSS Modules atau global CSS semantic token.
- Pindahkan fixture ke server seed atau route mock, bukan hard-code di komponen produksi.
- Drizzle ORM memakai MySQL pada VPS untuk `families`, `family_members`, `children`, `entries`, dan `photos`.
- Better Auth menangani session dan membership check; setiap query harus dibatasi `familyId` dari session.
- File media berada di volume privat VPS, bukan di repository. Simpan metadata `storageKey`, MIME, byte size, checksum, dan status upload di database.
- Upload produksi harus reserve quota, tulis file atomik, update metadata, lalu reconcile penggunaan storage secara berkala.
- Reverse proxy VPS wajib memakai HTTPS, secret environment, rate limit upload, dan backup database plus media.

## Definition of done prototype

- Tujuh halaman P0 dapat dibuka langsung dari file atau local server.
- Semua link dan CTA utama berpindah ke layar yang benar.
- Create, edit, delete, filter, invite mock, dan reset demo dapat diuji tanpa backend.
- Tiga edge state dapat diaktifkan dari settings.
- Tidak ada horizontal scroll pada 390 px, 430 px, dan desktop 1280 px.
- Keyboard-only pass selesai untuk form, dialog, filter, dan menu.
- Tidak ada foto nyata, secret, atau endpoint VPS di dalam repository.
