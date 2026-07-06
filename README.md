# Sistem Pengurusan Surat - Unit Fisioterapi HTA

Aplikasi web untuk menguruskan surat masuk di Unit Fisioterapi, Hospital Tunku
Azizah: muat naik surat (fail atau pautan), rekod maklumat surat, dan
tugaskan tindakan kepada staf.

## Ciri-ciri

- Log masuk dengan peranan **Admin** dan **Staf**
- Admin muat naik surat (fail PDF/imej/Word atau pautan luar)
- Rekod tajuk, no. rujukan, tarikh, sumber, kategori dan catatan surat
- Admin tugaskan tindakan kepada staf dengan arahan dan tarikh akhir
- Staf kemaskini status tindakan mereka (Belum Mula / Dalam Tindakan / Selesai)
- Status surat dikemaskini secara automatik berdasarkan status tindakan
- Halaman "Tugasan Saya" untuk staf lihat semua tindakan yang ditugaskan
- Admin urus akaun pengguna (cipta, nyahaktifkan, tetapkan semula kata laluan)
- Setiap pengguna boleh tukar kata laluan sendiri
- Fail surat disimpan di luar folder awam dan hanya boleh diakses oleh
  pengguna yang log masuk
- Ringkasan surat automatik guna Gemini API (pilihan, perlukan API key)

## Teknologi

- Next.js 16 (App Router) + TypeScript + Tailwind CSS
- SQLite (melalui Prisma ORM dengan driver adapter `better-sqlite3`)
- Sesi log masuk berasaskan cookie (`iron-session`) + kata laluan di-hash
  dengan bcrypt

## Setup Pembangunan (Development)

1. Pasang dependencies:

   ```bash
   npm install
   ```

2. Tetapkan `SESSION_SECRET` dalam fail `.env` (rentetan rawak sekurang-
   kurangnya 32 aksara):

   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

   Masukkan nilai ini sebagai `SESSION_SECRET` dalam fail `.env`.

3. Jalankan migration pangkalan data dan cipta akaun admin lalai:

   ```bash
   npx prisma migrate deploy
   npm run seed
   ```

   Ini mencipta akaun dengan:
   - Username: `admin`
   - Kata laluan: `admin123`

   **Tukar kata laluan ini selepas log masuk kali pertama** melalui halaman
   Pengurusan Pengguna.

4. Jalankan server pembangunan:

   ```bash
   npm run dev
   ```

   Buka http://localhost:3000

## Deployment (Pengeluaran)

Aplikasi ini boleh dijalankan sebagai satu proses Node.js tunggal (tiada
keperluan pangkalan data berasingan kerana menggunakan SQLite).

1. Tetapkan pembolehubah persekitaran di server:
   - `DATABASE_URL` - contoh `file:./dev.db`
   - `SESSION_SECRET` - rentetan rawak sekurang-kurangnya 32 aksara
   - `UPLOAD_DIR` - lokasi simpanan fail surat (contoh `./data/uploads`)
   - `NODE_ENV=production`
   - `GEMINI_API_KEY` - (pilihan) untuk fungsi Ringkasan AI, dapatkan
     percuma di https://aistudio.google.com/apikey

2. Build aplikasi:

   ```bash
   npm install
   npm run build
   ```

3. Jalankan aplikasi:

   ```bash
   npm run start
   ```

   Skrip `start` menjalankan migration (`prisma migrate deploy`) dan
   mencipta akaun admin lalai (`admin` / `admin123`, jika belum wujud)
   secara automatik sebelum server bermula — tiada langkah manual
   diperlukan pada deployment pertama. Log masuk dan **tukar kata laluan
   admin dengan segera**.

   Disyorkan menggunakan process manager seperti `pm2` atau `systemd` untuk
   memastikan aplikasi sentiasa berjalan, dan reverse proxy (nginx) dengan
   HTTPS di hadapannya.

### Deploy ke Railway.app

Railway sesuai kerana ia menyediakan **Volume** (storan cakera kekal) yang
diperlukan untuk fail pangkalan data SQLite dan fail surat yang dimuat naik.
Tanpa Volume, data akan hilang setiap kali aplikasi di-redeploy.

1. Log masuk ke [railway.app](https://railway.app) menggunakan akaun GitHub.
2. **New Project** → **Deploy from GitHub repo** → pilih repo `surat_hta`
   (pilih branch `main` selepas PR digabungkan).
3. Railway akan mengesan Next.js secara automatik dan menjalankan
   `npm install` (yang turut menjalankan `prisma generate` melalui
   `postinstall`) diikuti `npm run build`.
4. Tambah **Volume**: pada servis tersebut, pergi ke tab **Settings** →
   **Volumes** → **Add Volume**, tetapkan mount path kepada `/data`.
5. Tetapkan **Variables** (Settings → Variables):
   - `DATABASE_URL` = `file:/data/dev.db`
   - `UPLOAD_DIR` = `/data/uploads`
   - `SESSION_SECRET` = rentetan rawak 32+ aksara (jana dengan arahan di atas)
   - `NODE_ENV` = `production`
   - `GEMINI_API_KEY` = (pilihan) API key percuma dari
     https://aistudio.google.com/apikey, untuk fungsi Ringkasan AI

   Path mesti berada di dalam `/data` (mount path Volume) supaya kekal
   selepas redeploy — bahagian lain sistem fail Railway bersifat sementara.
6. Deploy. Skrip `start` (`prisma migrate deploy && tsx prisma/seed.ts &&
   next start`) akan menjalankan migration dan mencipta akaun admin lalai
   secara automatik setiap kali aplikasi bermula — tiada keperluan untuk
   akses Shell/Console Railway secara manual.
7. Dapatkan URL awam: **Settings** → **Networking** → **Generate Domain**
   (atau tambah domain sendiri jika ada).
8. Log masuk dengan `admin` / `admin123` dan **tukar kata laluan** segera
   melalui halaman Pengurusan Pengguna.

### Sandaran Data (Backup)

Kerana menggunakan SQLite, semua data disimpan dalam fail tunggal. Untuk
sandaran, salin secara berkala:

- Fail pangkalan data (contoh `dev.db`, mengikut `DATABASE_URL`)
- Folder `data/uploads/` (fail surat yang dimuat naik)

## Struktur Peranan

| Peranan | Kebenaran |
|---|---|
| Admin | Muat naik/kemaskini/padam surat, tugaskan tindakan, urus akaun pengguna, lihat semua surat |
| Staf | Lihat semua surat, kemaskini status & catatan tindakan yang ditugaskan kepada mereka |

## Skrip Berguna

```bash
npm run dev            # Server pembangunan
npm run build           # Build untuk pengeluaran
npm run start           # Migration + seed admin (jika belum wujud) + jalankan build pengeluaran
npm run lint             # Semak kod dengan ESLint
npm run seed             # Cipta akaun admin lalai (jika belum wujud)
npx prisma studio        # GUI untuk lihat/edit data pangkalan data secara terus
npx prisma migrate dev   # Cipta migration baru semasa pembangunan
```
