# Shalat Dulu - macOS Native-like Prayer Times Reminder App

[![Electron](https://img.shields.io/badge/Electron-v31.0.0-blue.svg)](https://www.electronjs.org/)
[![Platform](https://img.shields.io/badge/Platform-macOS-lightgrey.svg)]()
[![License](https://img.shields.io/badge/License-ISC-green.svg)]()

**Shalat Dulu** adalah aplikasi desktop macOS *native-like* yang berjalan di Menu Bar (System Tray) untuk membantu Anda melacak dan mengingatkan waktu ibadah shalat 5 waktu. Didesain dengan estetika premium khas macOS (efek transparansi/blur *glassmorphism*), aplikasi ini ringan, elegan, dan fungsional.

---

## ✨ Fitur Utama

1. **Menu Bar Mode (System Tray)**: Aplikasi berjalan di latar belakang secara efisien dan dapat diakses langsung dengan sekali klik pada ikon bulan sabit di Menu Bar atas macOS.
2. **Glassmorphism Design & Dark Mode**: Tampilan antarmuka memanfaatkan efek *vibrancy macOS* (transparansi kaca yang menyatu dengan wallpaper Anda) dengan tipografi modern yang memanjakan mata.
3. **Real-time Countdown**: Menampilkan sisa waktu hitung mundur menuju waktu shalat berikutnya secara langsung di Menu Bar dan jendela aplikasi.
4. **Desktop Widget**: Widget kecil minimalis yang melayang di desktop Anda, dapat diposisikan bebas, dan tersemat secara permanen di wallpaper desktop bahkan saat berpindah *Mission Control Spaces*.
5. **Sumber API Ganda**:
   - **Kemenag RI (via EQuran.id API)**: Sangat akurat untuk wilayah Indonesia dengan pencarian otomatis berdasarkan Provinsi & Kabupaten/Kota.
   - **Aladhan API**: Untuk pencarian global di luar Indonesia menggunakan input Kota dan Negara.
6. **Notifikasi Native & Alarm Adzan**:
   - Notifikasi macOS bawaan ketika waktu shalat tiba.
   - Pilihan alarm suara: **Adzan Lengkap** (dilengkapi pilihan suara Syekh Misyari Rasyid Al-Afasy atau Salman Al-Utaybi), **Nada Ringkas (Chime)**, atau mode **Hening (Notifikasi Saja)**.
7. **Deteksi Lokasi Otomatis**: Secara default menggunakan GeoIP untuk mendeteksi lokasi terkini Anda secara instan.
8. **Autostart (Jalankan saat macOS Dinyalakan)**: Opsi untuk menjalankan aplikasi secara otomatis saat Mac Anda dihidupkan (launch at login). Dijalankan secara tersembunyi (hidden) di Menu Bar untuk kenyamanan maksimal.

---

## 📸 Tampilan Antarmuka

Aplikasi menggunakan komponen UI premium:
- **Jendela Utama**: Jam digital real-time, status hitung mundur shalat terdekat, daftar jadwal shalat 5 waktu + Imsak, serta tombol cepat untuk kontrol suara dan widget.
- **Desktop Widget**: Tampilan super ringkas berisi waktu shalat berikutnya dan hitung mundur.
- **Halaman Pengaturan**: Pengaturan lokasi (Otomatis/Manual), pilihan API, pemilihan jenis alarm, serta tombol uji coba (*Test Sound* & *Test Notification*).

---

## 🛠️ Persyaratan Sistem

- macOS Catalina (10.15) atau versi yang lebih baru (mendukung *vibrancy* native).
- Node.js (v18 ke atas disarankan) dan npm.

---

## 🚀 Cara Instalasi & Menjalankan

Ikuti langkah-langkah di bawah ini untuk menjalankan aplikasi secara lokal di perangkat Anda:

### 1. Kloning Repositori
```bash
git clone https://github.com/USERNAME/shalat-dulu.git
cd shalat-dulu
```

### 2. Instal Dependensi
Gunakan npm untuk menginstal dependensi Electron:
```bash
npm install
```

### 3. Jalankan Aplikasi (Mode Pengembangan)
Jalankan aplikasi dengan perintah berikut:
```bash
npm start
```
Ikon bulan sabit akan muncul di Menu Bar atas macOS Anda. Klik ikon tersebut untuk membuka jendela utama.

---

## 📦 Membangun Aplikasi (.dmg & .app)

Proyek ini telah dikonfigurasi dengan `electron-builder` untuk membuat berkas instaler macOS.

Untuk mem-build paket distribusi aplikasi (menghasilkan berkas `.dmg` dan `.zip` di direktori `dist/`):

```bash
npm run build
```

Hasil kompilasi berupa aplikasi standalone (`ShalatDulu.app`) dan installer (`ShalatDulu-1.0.0.dmg`) dapat ditemukan di folder `./dist`.

---

## 📂 Struktur Proyek

```text
shalat-dulu/
├── assets/             # Berkas audio adzan (MP3)
├── dist/               # Output build distribusi (diabaikan oleh git)
├── main.js             # Proses utama Electron (Tray, Windows, IPC)
├── preload.js          # Jembatan IPC aman (Context Bridge)
├── renderer.js         # Logika frontend (API Fetch, Countdown, UI Event)
├── index.html          # Halaman UI utama aplikasi
├── style.css           # Desain style Glassmorphism macOS
├── widget.html         # Halaman UI desktop widget
├── widget.js           # Logika penggerak desktop widget
├── package.json        # Pengaturan dependensi & skrip build
└── .gitignore          # Daftar pengecualian berkas Git
```

---

## 📜 Lisensi

Aplikasi ini didistribusikan di bawah lisensi **ISC**. Anda bebas memodifikasi dan membagikannya.

---

*Dibuat dengan ❤️ untuk menemani ibadah Anda di macOS.*
