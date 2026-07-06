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
- Fail surat disimpan di luar folder awam dan hanya boleh diakses oleh
  pengguna yang log masuk

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

3. Jalankan migration pangkalan data:

   ```bash
   npx prisma migrate deploy
   ```

4. Cipta akaun admin lalai:

   ```bash
   npm run seed
   ```

   Ini mencipta akaun dengan:
   - Username: `admin`
   - Kata laluan: `admin123`

   **Tukar kata laluan ini selepas log masuk kali pertama** melalui halaman
   Pengurusan Pengguna.

5. Jalankan server pembangunan:

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

2. Build aplikasi:

   ```bash
   npm install
   npx prisma migrate deploy
   npm run build
   ```

3. Cipta akaun admin (sekali sahaja, pada deployment pertama):

   ```bash
   npm run seed
   ```

4. Jalankan aplikasi:

   ```bash
   npm run start
   ```

   Disyorkan menggunakan process manager seperti `pm2` atau `systemd` untuk
   memastikan aplikasi sentiasa berjalan, dan reverse proxy (nginx) dengan
   HTTPS di hadapannya.

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
npm run start           # Jalankan build pengeluaran
npm run lint             # Semak kod dengan ESLint
npm run seed             # Cipta akaun admin lalai (jika belum wujud)
npx prisma studio        # GUI untuk lihat/edit data pangkalan data secara terus
npx prisma migrate dev   # Cipta migration baru semasa pembangunan
```
