
import { ApiError } from "../controller/api-error";

import { prisma } from "../lib/prisma";

export async function getCategoryList() {

    try {
        const categories = await prisma.category.findMany({
            select: {
                id: true,
                name: true,
            },
            orderBy: {
                name: 'asc',
            },
        });

        return categories;
    } catch (error) {
        throw new ApiError("Failed to fetch categories", 500);
    }
}



