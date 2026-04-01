const db = require('./database');

console.log('Перевіряємо базу даних...');

// Перевіряємо рецепти
db.all("SELECT * FROM recipes", (err, rows) => {
    if (err) {
        console.error('Помилка:', err);
        return;
    }
    
    console.log(`Знайдено рецептів: ${rows.length}`);
    rows.forEach((recipe, index) => {
        console.log(`${index + 1}. ${recipe.name} (ID: ${recipe.id})`);
    });
    
    if (rows.length === 0) {
        console.log('База порожня. Додамо тестовий рецепт...');
        
        db.run(
            `INSERT INTO recipes (name, description, ingredients, instructions, category, harvard_plate)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
                'Тестовий борщ',
                'Смачний український борщ',
                'Капуста\nБуряк\nМорква\nМ\'ясо\nЦибуля',
                'Відварити м\'ясо\nДодати овочі\nВарити до готовності',
                'Перші страви',
                1
            ],
            function(err) {
                if (err) {
                    console.error('Помилка додавання:', err);
                } else {
                    console.log('✅ Тестовий рецепт додано з ID:', this.lastID);
                }
                process.exit(0);
            }
        );
    } else {
        process.exit(0);
    }
});