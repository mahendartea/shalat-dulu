# Rencana Implementasi: Aplikasi macOS Pengingat Waktu Shalat (Mac Native-like App)

Untuk membuat aplikasi macOS asli yang memiliki tampilan premium dan modern, kita akan menggunakan **Electron**. Electron memungkinkan kita membangun aplikasi desktop Mac (`.app`) menggunakan HTML, CSS kustom, dan JavaScript, serta terintegrasi langsung dengan fitur native macOS seperti:
- **System Tray / Menu Bar**: Aplikasi dapat berjalan di latar belakang dan diakses langsung dari menu bar atas Mac.
- **Native Notifications**: Mengirimkan notifikasi bawaan macOS saat waktu shalat tiba.
- **Sound Alerts**: Memutar suara adzan atau nada pengingat secara native.

## Fitur Utama
1. **Menu Bar & Window Mode**: Aplikasi dapat berjalan sebagai ikon di Menu Bar macOS atau sebagai jendela aplikasi desktop biasa yang elegan.
2. **Desain Visual Premium**: Tampilan antarmuka berbasis *glassmorphism* (efek blur transparan khas macOS) dengan mode gelap.
3. **Countdown Real-time**: Menampilkan hitung mundur ke waktu shalat berikutnya secara langsung di jendela aplikasi atau menu bar.
4. **Notifikasi macOS**: Memanfaatkan Notification Center bawaan macOS untuk mengingatkan pengguna.
5. **Auto-Location & Manual**: Mendeteksi lokasi otomatis atau memasukkan nama kota secara manual untuk menyesuaikan jadwal shalat dari API Aladhan.

---

## Struktur Proyek

Aplikasi akan dibuat di direktori:
`/Users/mac/code/shalat-dulu`

File yang akan dibuat/dimodifikasi:
1. `package.json` - Mengatur dependensi Electron.
2. `main.js` - Logika utama macOS (membuat tray icon, mengelola window, menerima event native).
3. `preload.js` - Menghubungkan proses native Electron dengan halaman web (keamanan & API).
4. `index.html` - Antarmuka pengguna (UI) aplikasi.
5. `style.css` - Desain UI premium khas macOS.
6. `renderer.js` - Logika frontend (fetch jadwal shalat, countdown, dan interaksi UI).

---

## Rincian Perubahan Proyek

### [NEW] [package.json](file:///Users/mac/code/shalat-dulu/package.json)
Mendefinisikan proyek dan dependensi `electron`.

### [NEW] [main.js](file:///Users/mac/code/shalat-dulu/main.js)
Mengatur daur hidup aplikasi macOS:
- Membuat ikon menu bar (Tray) dengan ikon kustom.
- Mengatur agar aplikasi berjalan di latar belakang (background process).
- Membuat jendela utama (BrowserWindow) dengan opsi transparan (`vibrancy: 'under-window'` atau `'hud'` khas macOS).

### [NEW] [preload.js](file:///Users/mac/code/shalat-dulu/preload.js)
Membuka jembatan aman untuk mengirimkan notifikasi native dan memicu suara dari proses renderer.

### [NEW] [index.html](file:///Users/mac/code/shalat-dulu/index.html) & [style.css](file:///Users/mac/code/shalat-dulu/style.css)
Membuat UI desktop dengan estetika premium:
- Transparansi kaca (*vibrancy*).
- Jam digital besar, nama kota aktif, dan sisa waktu ke shalat berikutnya.
- Kartu jadwal shalat 5 waktu yang rapi.

### [NEW] [renderer.js](file:///Users/mac/code/shalat-dulu/renderer.js)
Menghubungkan API jadwal shalat Aladhan, menghitung waktu shalat berikutnya, dan memicu notifikasi macOS.

---

## Rencana Verifikasi

### Verifikasi Manual
1. Menginstal dependensi menggunakan `npm install`.
2. Menjalankan aplikasi secara lokal dengan `npm start` (atau `npx electron .`).
3. Memastikan ikon muncul di Menu Bar macOS atas.
4. Memastikan jendela aplikasi memiliki efek transparansi khas macOS yang cantik.
5. Menguji notifikasi macOS dengan menekan tombol "Test Notification".
