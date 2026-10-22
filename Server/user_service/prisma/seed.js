require("dotenv").config();
const { PrismaClient } = require("../src/generated/prisma-client");
const { PrismaPg } = require("@prisma/adapter-pg");

const connectionString = new URL(process.env.DATABASE_URL).toString();
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  const freePlan = await prisma.plans.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      name: "Free",
      price: 0.0,
      credits: 200,
      features: ["200 text generations",
  "Free of cost",
  "access to basic model"],
    },
  });

  const basicPlan = await prisma.plans.upsert({
    where: { id: 2 },
    update: {},
    create: {
      id: 2,
      name: "Basic",
      price: 10.0,
      credits: 500,
      features: ["500 text generations",
  "Standard support",
  "Access to basic models"],
    },
  });

  const proPlan = await prisma.plans.upsert({
    where: { id: 3 },
    update: {},
    create: {
      id: 3,
      name: "Pro",
      price: 20.0,
      credits: 1000,
      features: ["1000 text generations",
  "Priority support",
  "Access to pro models",
  "Faster response time"],
    },
  });

  const premiumPlan = await prisma.plans.upsert({
    where: { id: 4 },
    update: {},
    create: {
      id: 4,
      name: "Premium",
      price: 30.0,
      credits: 2000,
      features: ["2000 text generations",
  "24/7 VIP support",
  "Access to premium models",
  "Dedicated account manager"],
    },
  });

  console.log({ freePlan, basicPlan, proPlan, premiumPlan });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
