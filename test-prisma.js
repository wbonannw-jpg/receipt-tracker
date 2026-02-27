const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.budget.findMany().then(console.log).catch(console.error);
