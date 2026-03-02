const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const mockRestaurant = {
    name: "The Coffee House",
    description: "Artisan coffee & fresh pastries.",
    currency: "$",
};

const mockCategories = [
    { name: "Coffee", sort_order: 1 },
    { name: "Breakfast", sort_order: 2 },
    { name: "Pastries", sort_order: 3 },
    { name: "Cold Drinks", sort_order: 4 },
];

const mockItems = [
    {
        category_name: "Coffee",
        name: "Caramel Latte",
        description: "Rich espresso with steamed milk and caramel drizzle.",
        price: 4.50,
        image: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=600&q=80",
        is_available: true,
    },
    {
        category_name: "Coffee",
        name: "Cappuccino",
        description: "Espresso topped with heavy foam and cocoa powder.",
        price: 4.00,
        image: "https://images.unsplash.com/photo-1572442388796-11668a67e53d?auto=format&fit=crop&w=600&q=80",
        is_available: true,
    },
    {
        category_name: "Breakfast",
        name: "Avocado Toast",
        description: "Sourdough bread topped with fresh avocado and chili flakes.",
        price: 8.50,
        image: "https://images.unsplash.com/photo-1588137372308-15f75323ca8d?auto=format&fit=crop&w=600&q=80",
        is_available: true,
    },
    {
        category_name: "Pastries",
        name: "Butter Croissant",
        description: "Flaky, buttery, and freshly baked every morning.",
        price: 3.50,
        image: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=600&q=80",
        is_available: true,
    },
    {
        category_name: "Cold Drinks",
        name: "Iced Americano",
        description: "Double shot espresso over ice and cold water.",
        price: 3.75,
        image: "https://images.unsplash.com/photo-1517701604599-bb29b5c73311?auto=format&fit=crop&w=600&q=80",
        is_available: true,
    },
];

const mockTables = [
    { label: "1" },
    { label: "12" },
];

async function main() {
    console.log('Start seeding ...');

    // 1. Create Restaurant
    const restaurant = await prisma.restaurant.create({
        data: mockRestaurant,
    });
    console.log(`Created restaurant: ${restaurant.name} (${restaurant.id})`);

    // 2. Create Tables
    for (const t of mockTables) {
        await prisma.table.create({
            data: {
                ...t,
                restaurant_id: restaurant.id,
            },
        });
    }
    console.log(`Created ${mockTables.length} tables`);

    // 3. Create Categories and Items
    for (const c of mockCategories) {
        const category = await prisma.menuCategory.create({
            data: {
                name: c.name,
                sort_order: c.sort_order,
                restaurant_id: restaurant.id,
            },
        });

        // Find items for this category
        const items = mockItems.filter(i => i.category_name === c.name);

        for (const item of items) {
            await prisma.menuItem.create({
                data: {
                    name: item.name,
                    description: item.description,
                    price: item.price,
                    image: item.image,
                    is_available: item.is_available,
                    category_id: category.id,
                },
            });
        }
    }
    console.log('Seeding finished.');
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
