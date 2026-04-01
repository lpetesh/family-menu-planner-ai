const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// API для страв з категоризацією
app.get('/api/dishes', (req, res) => {
    const { type, search } = req.query;
    let query = "SELECT * FROM dishes";
    let params = [];

    if (type) {
        query += " WHERE dish_type = ?";
        params.push(type);
    }

    if (search) {
        query += type ? " AND" : " WHERE";
        query += " name LIKE ?";
        params.push(`%${search}%`);
    }

    query += " ORDER BY frequency_score DESC, name";

    db.all(query, params, (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

app.get('/api/dishes/by-type', (req, res) => {
    db.all(`
        SELECT dish_type, COUNT(*) as count, 
               GROUP_CONCAT(name, '|') as dish_names
        FROM dishes 
        GROUP BY dish_type 
        ORDER BY dish_type
    `, (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        const categorized = rows.reduce((acc, row) => {
            acc[row.dish_type] = {
                count: row.count,
                dishes: row.dish_names ? row.dish_names.split('|') : []
            };
            return acc;
        }, {});
        
        res.json(categorized);
    });
});

app.post('/api/dishes', (req, res) => {
    const { name, description, ingredients, instructions, prep_time, cooking_time, servings, dish_type, difficulty } = req.body;
    
    db.run(
        `INSERT INTO dishes (name, description, ingredients, instructions, prep_time, cooking_time, servings, dish_type, difficulty)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [name, description, ingredients, instructions, prep_time, cooking_time, servings, dish_type, difficulty || 'medium'],
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ id: this.lastID, message: 'Страву додано успішно' });
        }
    );
});

// API для планування готування на 3-4 дні
app.get('/api/cooking-plans', (req, res) => {
    const { from_date } = req.query;
    const fromDate = from_date || new Date().toISOString().split('T')[0];

    db.all(`
        SELECT cp.*, d.name as dish_name, d.dish_type, d.prep_time, d.cooking_time
        FROM cooking_plans cp
        LEFT JOIN dishes d ON cp.dish_id = d.id
        WHERE cp.cooking_date >= ?
        ORDER BY cp.cooking_date, d.dish_type
    `, [fromDate], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

app.post('/api/cooking-plans', (req, res) => {
    const { cooking_date, dish_id, estimated_servings, notes } = req.body;
    const plan_date = new Date().toISOString().split('T')[0];
    
    db.run(
        `INSERT INTO cooking_plans (plan_date, cooking_date, dish_id, estimated_servings, notes)
         VALUES (?, ?, ?, ?, ?)`,
        [plan_date, cooking_date, dish_id, estimated_servings, notes],
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            
            // Оновлюємо частоту приготування цієї страви
            db.run(
                "UPDATE dishes SET frequency_score = frequency_score + 1, last_cooked = ? WHERE id = ?",
                [cooking_date, dish_id]
            );
            
            res.json({ id: this.lastID, message: 'План готування додано' });
        }
    );
});

app.delete('/api/cooking-plans/:id', (req, res) => {
    const planId = req.params.id;
    
    db.run("DELETE FROM cooking_plans WHERE id = ?", [planId], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ message: 'План видалено' });
    });
});

// API для готових страв (що вже є)
app.get('/api/ready-meals', (req, res) => {
    db.all(`
        SELECT rm.*, d.name as dish_name, d.dish_type
        FROM ready_meals rm
        LEFT JOIN dishes d ON rm.dish_id = d.id
        WHERE rm.servings_left > 0 AND (rm.expiry_date IS NULL OR rm.expiry_date >= date('now'))
        ORDER BY rm.cooked_date DESC
    `, (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

app.post('/api/ready-meals', (req, res) => {
    const { dish_id, servings_left, expiry_date, notes } = req.body;
    const cooked_date = new Date().toISOString().split('T')[0];
    
    db.run(
        `INSERT INTO ready_meals (dish_id, cooked_date, servings_left, expiry_date, notes)
         VALUES (?, ?, ?, ?, ?)`,
        [dish_id, cooked_date, servings_left, expiry_date, notes],
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ id: this.lastID, message: 'Готову страву додано' });
        }
    );
});

app.put('/api/ready-meals/:id/consume', (req, res) => {
    const mealId = req.params.id;
    const { servings_consumed } = req.body;
    
    db.run(
        "UPDATE ready_meals SET servings_left = servings_left - ? WHERE id = ?",
        [servings_consumed, mealId],
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ message: 'Порції оновлено' });
        }
    );
});

// API для автоматичної генерації плану готування
app.post('/api/generate-cooking-plan', (req, res) => {
    const { days = 4, include_types = ['protein', 'side', 'vegetable'] } = req.body;
    
    // Отримуємо страви які давно не готували
    db.all(`
        SELECT id, name, dish_type, frequency_score, last_cooked
        FROM dishes 
        WHERE dish_type IN (${include_types.map(() => '?').join(',')})
        ORDER BY 
            CASE WHEN last_cooked IS NULL THEN 1 ELSE 0 END DESC,
            julianday('now') - julianday(last_cooked) DESC,
            frequency_score ASC
        LIMIT ?
    `, [...include_types, days * 2], (err, dishes) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        const suggestions = [];
        const today = new Date();
        
        for (let i = 0; i < days; i++) {
            const cookingDate = new Date(today);
            cookingDate.setDate(today.getDate() + i + 1);
            
            const dailySuggestions = include_types.map(type => {
                const typeDishes = dishes.filter(d => d.dish_type === type);
                return typeDishes[Math.floor(Math.random() * Math.min(3, typeDishes.length))];
            }).filter(Boolean);
            
            suggestions.push({
                date: cookingDate.toISOString().split('T')[0],
                suggested_dishes: dailySuggestions
            });
        }
        
        res.json(suggestions);
    });
});

// API для списку покупок
app.get('/api/shopping-list', (req, res) => {
    const today = new Date().toISOString().split('T')[0];
    
    db.all(
        "SELECT * FROM shopping_list WHERE plan_date >= ? ORDER BY priority DESC, category, item_name",
        [today],
        (err, rows) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json(rows);
        }
    );
});

app.post('/api/generate-shopping-list', (req, res) => {
    const today = new Date().toISOString().split('T')[0];
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    const weekEnd = nextWeek.toISOString().split('T')[0];
    
    // Очищуємо старий список
    db.run("DELETE FROM shopping_list WHERE plan_date = ?", [today], (err) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        // Отримуємо всі заплановані страви на тиждень
        db.all(`
            SELECT d.ingredients, d.name
            FROM cooking_plans cp
            JOIN dishes d ON cp.dish_id = d.id
            WHERE cp.cooking_date BETWEEN ? AND ? AND cp.is_completed = 0
        `, [today, weekEnd], (err, plans) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            
            // Парсимо інгредієнти та створюємо список покупок
            const ingredientsList = new Set();
            
            plans.forEach(plan => {
                if (plan.ingredients) {
                    plan.ingredients.split('\n')
                        .map(ing => ing.trim())
                        .filter(ing => ing.length > 0)
                        .forEach(ing => ingredientsList.add(ing));
                }
            });
            
            // Додаємо до списку покупок
            const insertPromises = Array.from(ingredientsList).map(ingredient => {
                return new Promise((resolve, reject) => {
                    db.run(
                        `INSERT INTO shopping_list (plan_date, item_name, category, priority)
                         VALUES (?, ?, 'Продукти', 2)`,
                        [today, ingredient],
                        (err) => err ? reject(err) : resolve()
                    );
                });
            });
            
            Promise.all(insertPromises)
                .then(() => res.json({ message: `Список покупок створено (${ingredientsList.size} позицій)` }))
                .catch(err => res.status(500).json({ error: err.message }));
        });
    });
});

app.listen(PORT, () => {
    console.log(`🍽️ Сервер запущено на порті ${PORT}`);
});