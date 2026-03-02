export const mockRestaurant = {
    id: "rest_1",
    name: "The Coffee House",
    description: "Artisan coffee & fresh pastries.",
    currency: "$",
    coverImage: "https://images.unsplash.com/photo-1453614512568-c4024d13c247?auto=format&fit=crop&w=1000&q=80",
};

export const mockCategories = [
    { id: "cat_1", name: "Coffee", sort_order: 1 },
    { id: "cat_2", name: "Breakfast", sort_order: 2 },
    { id: "cat_3", name: "Pastries", sort_order: 3 },
    { id: "cat_4", name: "Cold Drinks", sort_order: 4 },
];

export const mockItems = [
    {
        id: "item_1",
        category_id: "cat_1",
        name: "Caramel Latte",
        description: "Rich espresso with steamed milk and caramel drizzle.",
        price: 4.50,
        image: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=600&q=80",
        is_available: true,
    },
    {
        id: "item_2",
        category_id: "cat_1",
        name: "Cappuccino",
        description: "Espresso topped with heavy foam and cocoa powder.",
        price: 4.00,
        image: "https://images.unsplash.com/photo-1572442388796-11668a67e53d?auto=format&fit=crop&w=600&q=80",
        is_available: true,
    },
    {
        id: "item_3",
        category_id: "cat_2",
        name: "Avocado Toast",
        description: "Sourdough bread topped with fresh avocado and chili flakes.",
        price: 8.50,
        image: "https://images.unsplash.com/photo-1588137372308-15f75323ca8d?auto=format&fit=crop&w=600&q=80",
        is_available: true,
    },
    {
        id: "item_4",
        category_id: "cat_3",
        name: "Butter Croissant",
        description: "Flaky, buttery, and freshly baked every morning.",
        price: 3.50,
        image: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=600&q=80",
        is_available: true,
    },
    {
        id: "item_5",
        category_id: "cat_4",
        name: "Iced Americano",
        description: "Double shot espresso over ice and cold water.",
        price: 3.75,
        image: "https://images.unsplash.com/photo-1517701604599-bb29b5c73311?auto=format&fit=crop&w=600&q=80",
        is_available: true,
    },
];

export const mockTables = [
    { id: "1", label: "Table 1" },
    { id: "12", label: "Table 12" },
];
