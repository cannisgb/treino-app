// Uso: npm run make-trainer -- email@exemplo.com
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2]?.toLowerCase().trim();
  if (!email) {
    console.error("Indica o email: npm run make-trainer -- email@exemplo.com");
    process.exit(1);
  }
  const user = await prisma.user.update({ where: { email }, data: { role: "TRAINER", trainerId: null } });
  console.log(`${user.email} é agora TREINADOR.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
