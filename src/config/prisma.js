const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Manejo de desconexión graceful
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

module.exports = prisma;

