# 04 Design System

## Design read

Little Moment dibaca sebagai product UI privat untuk orang tua baru, bukan dashboard dan bukan landing page. Arah visualnya adalah **Fern Journal**: tenang, hangat, mudah dipindai, dengan satu aksen hijau yang terasa hidup tanpa menjadi dekorasi berlebihan.

**Dials:** `DESIGN_VARIANCE: 4`, `MOTION_INTENSITY: 2`, `VISUAL_DENSITY: 4`.

Konsekuensinya: komponen cukup berkarakter untuk terasa personal, tetapi layout tetap stabil untuk input cepat. Tidak ada gradient dekoratif, glassmorphism, neon, atau kartu berlapis-lapis.

## Color tokens

```css
:root {
  --color-bg: #f7faf7;
  --color-surface: #fefffe;
  --color-surface-soft: #eef5ef;
  --color-text-primary: #1e3322;
  --color-text-secondary: #647267;
  --color-text-muted: #879389;
  --color-border: #d9e5da;
  --color-accent: #2d6b3f;
  --color-accent-hover: #245a34;
  --color-accent-soft: #ddece1;
  --color-danger: #b42318;
  --color-danger-soft: #fde9e7;
  --color-warning: #8a5a00;
  --color-warning-soft: #fff4d6;
  --color-focus: #8bc49a;
  --shadow-card: 0 8px 24px rgb(30 51 34 / 0.07);
}
```

Gunakan semantic token, bukan warna mentah di komponen. Background dan surface harus tetap off-white agar kontras tidak terlalu keras. Teks utama minimal WCAG AA pada surface.

## Typography

- Display dan body: Funnel Sans, fallback `ui-sans-serif, system-ui, sans-serif`.
- Caption teknis atau metadata: Geist, fallback system sans.
- H1: 32 px, line-height 1.15, weight 700.
- H2: 24 px, line-height 1.2, weight 700.
- H3: 18 px, line-height 1.3, weight 650.
- Body: 16 px, line-height 1.5, weight 400.
- Label: 14 px, line-height 1.35, weight 600.
- Caption: 12 px, line-height 1.4, weight 500.

Pada HTML statis, jangan bergantung pada remote font. Gunakan fallback lokal. Saat migrasi Next.js, gunakan `next/font` dan self-host font yang lisensinya jelas.

## Spacing and shape

- Base spacing: kelipatan 4 px.
- Page gutter mobile: 20 px.
- Page gutter desktop: 32 px, max content width 720 px untuk timeline.
- Gap antar field: 16 px.
- Gap antar section: 32 px.
- Radius card: 16 px.
- Radius control: 12 px.
- Radius pill: 999 px.
- Touch target minimum: 44 x 44 px.
- Border default: 1 px solid `--color-border`.

## Component rules

### Button

- Primary: background accent, teks putih, radius 12 px, tinggi minimum 48 px.
- Secondary: surface atau accent-soft dengan border, teks accent.
- Destructive: danger hanya untuk hapus, tidak untuk error biasa.
- Setiap button memiliki hover, pressed, disabled, loading, dan focus-visible.
- Label harus menjelaskan aksi, misalnya `Simpan cerita`, bukan `Submit`.

### Form field

- Label selalu terlihat di atas input.
- Placeholder hanya contoh, bukan label.
- Error ditempatkan setelah field dan dihubungkan dengan `aria-describedby`.
- Date input memakai native control pada prototype; format tampilan diatur oleh browser.

### Timeline entry card

- Gunakan satu surface dan satu border; shadow hanya untuk elevasi utama.
- Hierarki: tanggal, type label, judul, excerpt, gallery, author.
- Thumbnail menggunakan rasio tetap dan `object-fit: cover`.
- Jangan memotong cerita tanpa menyediakan detail penuh.

### Storage meter

- Progress bar harus memiliki label tekstual dan `aria-valuenow`.
- Tampilkan byte terformat dan persentase yang konsisten.
- Di atas 90 persen, tampilkan warning; pada 100 persen, tampilkan storage full state.

### Toast and banner

- Banner dipakai untuk status yang perlu dibaca sebelum action berikutnya.
- Toast hanya untuk konfirmasi ringan seperti `Cerita tersimpan`.
- Jangan menyampaikan error penting hanya lewat toast.

## Icon policy

Gunakan satu keluarga icon outline saja, direkomendasikan Phosphor Icons. Pada HTML prototype, gunakan `data-icon` placeholder yang dipetakan ke library saat bundling. Jangan menggambar path SVG sendiri dan jangan mencampur keluarga ikon.

Ikon tidak boleh menjadi satu-satunya penyampai makna. Tombol tetap memiliki accessible name yang terlihat atau melalui `aria-label`.

## Responsive and motion

- Mobile-first pada 390 px dan 430 px.
- Desktop memakai kolom konten sempit, bukan dashboard tiga kolom.
- Tidak ada horizontal scroll.
- Motion hanya untuk hover, focus, expand, dan progress feedback dengan durasi 120 sampai 200 ms.
- Hormati `prefers-reduced-motion: reduce` dengan menghapus transform dan transition yang tidak penting.

## Dark mode decision

Prototype minggu pertama memakai light-first agar review visual di Pen.dev cepat. Struktur token wajib semantic sehingga dark mode dapat ditambahkan di P1 tanpa mengganti markup. Jangan membuat dark mode palsu dengan invert filter.

## Visual quality guardrails

- Hindari AI-purple, neon cyan, gradient besar, blob abstrak, dan ilustrasi stok yang tidak terkait keluarga.
- Gunakan whitespace sebagai struktur, bukan menambah kartu untuk setiap teks.
- Maksimal satu aksen hijau utama pada satu viewport.
- Jangan memakai em dash atau en dash pada copy UI.
