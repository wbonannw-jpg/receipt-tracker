const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const initialCategories = [
    { name: "食費", order: 1 },
    { name: "光熱費", order: 2 },
    { name: "日用品", order: 3 },
    { name: "趣味・娯楽", order: 4 },
    { name: "交通費", order: 5 },
    { name: "交際費", order: 6 },
    { name: "衣類", order: 7 },
    { name: "美容・ヘア", order: 8 },
    { name: "通信費", order: 9 },
    { name: "医療費", order: 10 },
    { name: "その他", order: 99 }
];

async function main() {
    console.log("Seeding categories...");
    for (const cat of initialCategories) {
        await prisma.category.upsert({
            where: { name: cat.name },
            update: {},
            create: { name: cat.name }
        });
        console.log(`Created/Verified category: ${cat.name}`);
    }
    console.log("Seeding finished.");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
