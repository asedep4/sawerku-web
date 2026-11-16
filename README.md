# Sawerku

Pengunjung mengetik **username Roblox + kata-kata**, lalu pesannya tampil di papan donasi
(`Workspace.Donationscreen` → `MessBoard`) di dalam game. Tanpa pembayaran.

- **Admin**: tambah, edit (nama, username, password, role, bio), nonaktifkan, dan hapus user. Admin juga melihat semua pesan.
- **Kreator (user)**: punya halaman `/<username>`, melihat atau menyembunyikan pesan, dan mengelola API key Roblox.
- **Biaya: Rp0** dengan GitHub, Vercel (Hobby) dan Supabase (Free).

## Arsitektur

```
Pengunjung ──POST /api/donate──▶ Next.js (Vercel) ──▶ Postgres (Supabase)
                                        ▲
Server game Roblox ──GET /api/roblox/pull (x-api-key, tiap ±6 dtk)
   └─ SawerWebBridge → filter TextService → DonationManager.updateDonationBoard
```

Setiap server game menyimpan kursornya sendiri, jadi semua server menampilkan pesan yang sama.
Pesan lama tidak diputar ulang saat server baru dibuka.

## 1. Database gratis (Supabase)

1. Daftar di supabase.com, lalu klik **New project** (region: Singapore).
2. Buka **Project Settings → Database → Connection string → URI**, pilih mode **Transaction pooler** (port 6543).
3. Salin URI tersebut dan ganti `[YOUR-PASSWORD]` dengan password database. Hasilnya menjadi `DATABASE_URL`.

Tabel dibuat otomatis saat web pertama kali dibuka. Kamu tidak perlu menjalankan SQL.

## 2. Upload ke GitHub

```bash
git init
git add .
git commit -m "Sawerku"
git branch -M main
git remote add origin https://github.com/<akun-kamu>/sawerku-web.git
git push -u origin main
```

## 3. Deploy ke Vercel

1. Masuk ke vercel.com dengan akun GitHub, lalu pilih **Add New → Project** dan impor repo `sawerku-web`.
2. Isi **Environment Variables**:
   - `DATABASE_URL` = URI dari Supabase
   - `AUTH_SECRET` = string acak 64 karakter (`node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)
3. Klik **Deploy**, lalu buka `https://<proyek>.vercel.app`. Kamu akan diarahkan ke **/setup** untuk membuat admin pertama.

Setiap `git push` ke `main` otomatis memicu deploy ulang.

## 4. Hubungkan ke game Roblox

Script `ServerScriptService.SawerWebBridge` sudah ada di place.

1. Di Studio, buka **Game Settings → Security → Allow HTTP Requests** dan nyalakan.
2. Login ke web sebagai kreator dan salin **API key** dari Dashboard.
3. Buka Creator Hub → game → **Configure → Secrets → Create Secret**, lalu isi:
   - Name: `sawerku_key`
   - Secret: API key tadi
   - Domain: `<proyek>.vercel.app`
4. Di `SawerWebBridge`, ganti `CONFIG.BaseUrl` dengan `https://<proyek>.vercel.app`.
5. Publish game.

Untuk tes di Studio tanpa Secret, buat `ServerStorage > Folder "SawerWebConfig" > StringValue "ApiKey"` berisi
API key. Ini cadangan khusus tes; hapus sebelum publish.

## Jalankan lokal

```bash
npm install
npm run dev
```

Tanpa `DATABASE_URL`, data disimpan di memori dan hilang saat server dimatikan. Mode ini hanya untuk mencoba tampilan.

## Keamanan dan aturan

- Semua pesan disaring `TextService` (filter Roblox) di server game sebelum tampil.
- Anti-spam: 1 pesan per 20 detik dan maksimal 15 pesan per jam per perangkat. Panjang pesan maksimal 150 huruf.
- Password disimpan sebagai hash bcrypt. Sesi memakai cookie httpOnly yang ditandatangani.
- API key hanya ada di Secret Roblox, tidak ditulis di script.
- **Jangan menaruh link web ini di dalam game.** Roblox melarang link eksternal di dalam experience.
  Bagikan link lewat stream, Discord, atau media sosial.
- Vercel Hobby hanya untuk pemakaian non-komersial. Jika nanti ditambah pembayaran, pindah ke paket Pro
  atau hosting lain.
