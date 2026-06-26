import { prisma } from "../lib/prisma";


async function main() {

    console.log(" Starting up database seeding...");

    await prisma.category.createMany({
        data: [
            { name: "Technology" },
            { name: "Programming" },
            { name: "Education" },
            { name: "Lifestyle" },
            { name: "Business" },

        ],
        skipDuplicates: true,
    });

    console.log("Categories seeded successfully!");
}

main()
    .catch((error) => {
        console.error("Seeding error: ", error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });