const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, 'family_menu.db'));

// Створення таблиць
db.serialize(() => {
    // Таблиця страв з новою категоризацією
    db.run(`CREATE TABLE IF NOT EXISTS dishes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        ingredients TEXT,
        instructions TEXT,
        prep_time INTEGER,
        cooking_time INTEGER,
        servings INTEGER,
        dish_type TEXT NOT NULL, -- 'protein', 'side', 'vegetable', 'dessert', 'soup', 'salad', 'breakfast'
        difficulty TEXT DEFAULT 'medium', -- 'easy', 'medium', 'hard'
        favorite BOOLEAN DEFAULT 0,
        frequency_score INTEGER DEFAULT 0, -- для розуміння як часто готуємо
        last_cooked DATE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Таблиця планування на 3-4 дні
    db.run(`CREATE TABLE IF NOT EXISTS cooking_plans (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        plan_date DATE NOT NULL, -- дата коли планували
        cooking_date DATE NOT NULL, -- для якого дня готуємо
        dish_id INTEGER,
        estimated_servings INTEGER,
        notes TEXT,
        is_completed BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (dish_id) REFERENCES dishes(id)
    )`);

    // Таблиця готового на сьогодні (що вже є в холодильнику)
    db.run(`CREATE TABLE IF NOT EXISTS ready_meals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        dish_id INTEGER,
        cooked_date DATE NOT NULL,
        servings_left INTEGER,
        expiry_date DATE,
        notes TEXT,
        FOREIGN KEY (dish_id) REFERENCES dishes(id)
    )`);

    // Таблиця списку покупок (оновлена)
    db.run(`CREATE TABLE IF NOT EXISTS shopping_list (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        plan_date DATE NOT NULL,
        item_name TEXT NOT NULL,
        quantity TEXT,
        category TEXT,
        is_bought BOOLEAN DEFAULT 0,
        priority INTEGER DEFAULT 1, -- 1-низька, 2-середня, 3-висока
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Міграція даних з старої таблиці recipes в нову dishes
    db.run(`INSERT OR IGNORE INTO dishes (name, description, ingredients, instructions, prep_time, cooking_time, servings, dish_type, created_at)
             SELECT name, description, ingredients, instructions, prep_time, cooking_time, servings, 
                    CASE 
                        WHEN category = 'Десерти' THEN 'dessert'
                        WHEN category = 'Салати' THEN 'salad'
                        WHEN category = 'Сніданки' THEN 'breakfast'
                        WHEN category = 'Перші страви' THEN 'soup'
                        ELSE 'protein'
                    END as dish_type,
                    created_at
             FROM recipes WHERE EXISTS (SELECT 1 FROM recipes)`);
});

module.exports = db;