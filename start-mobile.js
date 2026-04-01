const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const db = require('./database');
const localtunnel = require('localtunnel');

const app = express();
const PORT = 3001; // Змінили порт

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// API для рецептів
app.get('/api/recipes', (req, res) => {
    db.all("SELECT * FROM recipes ORDER BY created_at DESC", (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

app.post('/api/recipes', (req, res) => {
    const { name, description, ingredients, instructions, prep_time, cooking_time, servings, category, harvard_plate } = req.body;
    
    db.run(
        `INSERT INTO recipes (name, description, ingredients, instructions, prep_time, cooking_time, servings, category, harvard_plate)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [name, description, ingredients, instructions, prep_time, cooking_time, servings, category, harvard_plate ? 1 : 0],
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ id: this.lastID, message: 'Рецепт додано успішно' });
        }
    );
});

// API для тижневого меню
app.get('/api/weekly-menu/:week', (req, res) => {
    const weekStart = req.params.week;
    
    db.all(`
        SELECT wm.*, r.name as recipe_name, r.category
        FROM weekly_menu wm
        LEFT JOIN recipes r ON wm.recipe_id = r.id
        WHERE wm.week_start = ?
        ORDER BY wm.day_of_week, wm.meal_type
    `, [weekStart], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

app.post('/api/weekly-menu', (req, res) => {
    const { week_start, day_of_week, meal_type, recipe_id, notes } = req.body;
    
    db.run(
        `INSERT OR REPLACE INTO weekly_menu (week_start, day_of_week, meal_type, recipe_id, notes)
         VALUES (?, ?, ?, ?, ?)`,
        [week_start, day_of_week, meal_type, recipe_id, notes],
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ id: this.lastID, message: 'Меню оновлено' });
        }
    );
});

// API для улюблених страв
app.get('/api/family-favorites', (req, res) => {
    db.all("SELECT * FROM family_favorites ORDER BY dish_name", (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

app.post('/api/family-favorites', (req, res) => {
    const { dish_name, family_member, frequency, notes } = req.body;
    
    db.run(
        `INSERT INTO family_favorites (dish_name, family_member, frequency, notes)
         VALUES (?, ?, ?, ?)`,
        [dish_name, family_member, frequency, notes],
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ id: this.lastID, message: 'Улюблену страву додано' });
        }
    );
});

// API для списку покупок
app.get('/api/shopping-list/:week', (req, res) => {
    const weekStart = req.params.week;
    
    db.all(
        "SELECT * FROM shopping_list WHERE week_start = ? ORDER BY category, item_name",
        [weekStart],
        (err, rows) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json(rows);
        }
    );
});

app.post('/api/generate-shopping-list/:week', (req, res) => {
    const weekStart = req.params.week;
    
    db.run("DELETE FROM shopping_list WHERE week_start = ?", [weekStart], (err) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        db.all(`
            SELECT r.ingredients, r.name
            FROM weekly_menu wm
            JOIN recipes r ON wm.recipe_id = r.id
            WHERE wm.week_start = ?
        `, [weekStart], (err, recipes) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            
            const allIngredients = recipes.flatMap(recipe => 
                recipe.ingredients.split('\n').filter(ing => ing.trim())
            );
            
            const promises = allIngredients.map(ingredient => {
                return new Promise((resolve, reject) => {
                    db.run(
                        `INSERT INTO shopping_list (week_start, item_name, category)
                         VALUES (?, ?, ?)`,
                        [weekStart, ingredient.trim(), 'Продукти'],
                        (err) => {
                            if (err) reject(err);
                            else resolve();
                        }
                    );
                });
            });
            
            Promise.all(promises)
                .then(() => res.json({ message: 'Список покупок згенеровано' }))
                .catch(err => res.status(500).json({ error: err.message }));
        });
    });
});

// Запускаємо сервер
const server = app.listen(PORT, () => {
    console.log(`🍽️ Сервер запущено на http://localhost:${PORT}`);
    console.log('');
    console.log('📱 Підключення тунелю...');
    
    // Створюємо тунель
    (async () => {
        try {
            const tunnel = await localtunnel({ 
                port: PORT
            });
            
            console.log('');
            console.log('🎉 ГОТОВО! Тунель створено!');
            console.log('');
            console.log('🔗 ВІДКРИЙТЕ ЦЮ АДРЕСУ НА ТЕЛЕФОНІ:');
            console.log(`📱 ${tunnel.url}`);
            console.log('');
            console.log('📋 Просто скопіюйте посилання і вставте в браузер телефону');
            console.log('💡 Посилання працюватиме поки сервер запущений');
            
            tunnel.on('close', () => {
                console.log('🔌 Тунель закрито');
            });
            
        } catch (error) {
            console.error('❌ Помилка створення тунелю:', error.message);
            console.log('');
            console.log('💡 Альтернативно спробуйте локальні адреси з телефону:');
            console.log('   http://192.168.76.132:3001');
            console.log('   http://172.18.0.1:3001');
            console.log('   (переконайтеся що телефон і комп\'ютер в одному Wi-Fi)');
        }
    })();
});

// Обробка закриття
process.on('SIGINT', () => {
    console.log('\n🛑 Зупинка сервера...');
    server.close(() => {
        console.log('✅ Сервер зупинено');
        process.exit(0);
    });
});