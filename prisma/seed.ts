import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { hashPassword } from "../src/lib/password";

async function main() {
  const existing = await prisma.user.findUnique({
    where: { username: "admin" },
  });

  if (existing) {
    console.log("Akaun admin sudah wujud, seed dilangkau.");
    return;
  }

  const passwordHash = await hashPassword("admin123");

  await prisma.user.create({
    data: {
      name: "Admin Unit Fisioterapi",
      username: "admin",
      passwordHash,
      role: "ADMIN",
    },
  });

  console.log("Akaun admin berjaya dicipta.");
  console.log("Username: admin");
  console.log("Kata laluan: admin123");
  console.log("SILA TUKAR KATA LALUAN INI SELEPAS LOG MASUK KALI PERTAMA.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
