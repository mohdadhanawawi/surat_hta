-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'STAFF',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Surat" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tajuk" TEXT NOT NULL,
    "noRujukan" TEXT,
    "tarikhSurat" DATETIME NOT NULL,
    "sumber" TEXT,
    "kategori" TEXT,
    "link" TEXT,
    "fileName" TEXT,
    "fileStoredName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'BELUM_MULA',
    "catatan" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "createdById" TEXT NOT NULL,
    CONSTRAINT "Surat_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Tindakan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "suratId" TEXT NOT NULL,
    "assignedToId" TEXT NOT NULL,
    "assignedById" TEXT NOT NULL,
    "arahan" TEXT NOT NULL,
    "tarikhAkhir" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'BELUM_MULA',
    "catatanStaff" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "completedAt" DATETIME,
    CONSTRAINT "Tindakan_suratId_fkey" FOREIGN KEY ("suratId") REFERENCES "Surat" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Tindakan_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Tindakan_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
