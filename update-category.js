const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const result = await prisma.category.updateMany({
        where: {
            name: '美容'
        },
        data: {
            name: '美容・ヘア'
        }
    });

    console.log(`Updated ${result.count} categories.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
