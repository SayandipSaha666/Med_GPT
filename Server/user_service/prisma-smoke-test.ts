import { prisma } from "./src/lib/prisma"; // Adjust this path if needed

async function main() {
  console.log("Testing Prisma query...");

  const result = await prisma.agentTask.findMany({
    take: 1,
    select: {
      id: true,
      status: true,
    },
  });

  console.log("Prisma query succeeded:", result);
}

main()
  .catch((error) => {
    console.error("Prisma smoke test failed:", error);
    console.error("Cause:", error?.cause);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });