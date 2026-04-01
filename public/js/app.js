// Глобальні змінні
let dishes = [];
let cookingPlans = [];
let readyMeals = [];
let currentGeneratedRecipe = null;

// Завантаження при старті
document.addEventListener('DOMContentLoaded', function() {
    loadDishes();
    loadCookingPlans();
    loadReadyMeals();
    loadDishCategories();
    
    // Встановлюємо завтрашню дату як мінімум для планування
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateInput = document.querySelector('input[name="cooking_date"]');
    if (dateInput) {
        dateInput.min = tomorrow.toISOString().split('T')[0];
        dateInput.value = tomorrow.toISOString().split('T')[0];
    }
});

// Функції навігації
function showSection(sectionName) {
    // Приховуємо всі розділи
    document.querySelectorAll('.section').forEach(section => {
        section.style.display = 'none';
    });
    
    // Показуємо потрібний розділ
    document.getElementById(sectionName + '-section').style.display = 'block';
    
    // Оновлюємо активний пункт меню
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Оновлюємо дані для розділу
    switch(sectionName) {
        case 'planner':
            loadCookingPlans();
            break;
        case 'dishes':
            loadDishes();
            loadDishCategories();
            break;
        case 'ready':
            loadReadyMeals();
            break;
        case 'shopping':
            loadShoppingList();
            break;
        case 'ai-generator':
            // Можна додати ініціалізацію AI чату
            break;
    }
}

// ===========================================
// AI ГЕНЕРАТОР ФУНКЦІЇ
// ===========================================

// Швидкий промпт
function quickPrompt(prompt) {
    document.getElementById('ai-prompt-input').value = prompt;
    generateRecipe();
}

// Генерація рецепту (поки що демо)
function generateRecipe() {
    const prompt = document.getElementById('ai-prompt-input').value;
    if (!prompt.trim()) {
        showAlert('Введи що хочеш приготувати!', 'warning');
        return;
    }

    // Додаємо повідомлення користувача в чат
    addMessageToChat(prompt, 'user');
    
    // Очищуємо поле вводу
    document.getElementById('ai-prompt-input').value = '';
    
    // Показуємо що AI думає
    addMessageToChat('Генерую рецепт спеціально для тебе... ✨', 'ai');
    
    // Демо генерація рецепту
    setTimeout(() => {
        const demoRecipe = generateDemoRecipe(prompt);
        displayGeneratedRecipe(demoRecipe);
        
        // Додаємо повідомлення в чат
        addMessageToChat(`Готово! Створив рецепт "${demoRecipe.name}". Подивись праворуч 👉`, 'ai');
    }, 2000);
}

// Додавання повідомлення в чат
function addMessageToChat(message, sender) {
    const chatContainer = document.getElementById('ai-chat-messages');
    const messageClass = sender === 'user' ? 'user-message' : 'ai-message';
    const senderName = sender === 'ai' ? '<strong>🤖 AI Кухар:</strong><br>' : '';
    
    const messageElement = document.createElement('div');
    messageElement.className = messageClass;
    messageElement.innerHTML = `${senderName}${message}`;
    
    chatContainer.appendChild(messageElement);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Демо генерація рецепту
function generateDemoRecipe(prompt) {
    const demoRecipes = {
        'курк': {
            name: 'Курка в медово-соєвому соусі',
            type: 'protein',
            difficulty: 'easy',
            prep_time: 15,
            cooking_time: 25,
            servings: 4,
            ingredients: [
                '800г філе курки',
                '3 ст.л. соєвого соусу',
                '2 ст.л. меду',
                '2 зубчики часнику',
                '1 ст.л. олії',
                '1 ч.л. імбиру тертого',
                'кунжут для подачі'
            ],
            instructions: [
                'Нарізати курку середніми шматками',
                'Змішати соєвий соус, мед, часник і імбир',
                'Замаринувати курку на 10 хв',
                'Розігріти сковороду з олією',
                'Обсмажити курку 15-20 хв до готовності',
                'Подавати з кунжутом і зеленню'
            ]
        },
        'салат': {
            name: 'Свіжий салат з авокадо',
            type: 'salad',
            difficulty: 'easy',
            prep_time: 10,
            cooking_time: 0,
            servings: 2,
            ingredients: [
                '1 авокадо',
                '200г міксу салатів',
                '100г черрі',
                '50г фети',
                '2 ст.л. оливкової олії',
                '1 ст.л. лимонного соку',
                'сіль, перець'
            ],
            instructions: [
                'Помити і порізати салат',
                'Нарізати авокадо і помідори',
                'Покришити сир фета',
                'Змішати олію з лимонним соком',
                'Заправити салат і перемішати',
                'Подавати одразу'
            ]
        },
        'суп': {
            name: 'Овочевий крем-суп',
            type: 'soup',
            difficulty: 'medium',
            prep_time: 15,
            cooking_time: 30,
            servings: 4,
            ingredients: [
                '2 картоплі',
                '1 морква',
                '1 цибуля',
                '2 зубчики часнику',
                '1л овочевого бульйону',
                '100мл вершків',
                'сіль, перець, зелень'
            ],
            instructions: [
                'Почистити та нарізати овочі',
                'Обсмажити цибулю та часник',
                'Додати моркву та картоплю',
                'Залити бульйоном та варити 25 хв',
                'Пюрувати блендером',
                'Додати вершки та специі'
            ]
        }
    };
    
    // Визначаємо тип рецепту за ключовими словами
    let recipe = demoRecipes['салат']; // за замовчуванням
    
    const promptLower = prompt.toLowerCase();
    if (promptLower.includes('курк') || promptLower.includes("м'яс")) {
        recipe = demoRecipes['курк'];
    } else if (promptLower.includes('суп')) {
        recipe = demoRecipes['суп'];
    } else if (promptLower.includes('салат')) {
        recipe = demoRecipes['салат'];
    }
    
    return recipe;
}

// Відображення згенерованого рецепту
function displayGeneratedRecipe(recipe) {
    currentGeneratedRecipe = recipe;
    
    // Приховуємо заглушку, показуємо рецепт
    document.getElementById('recipe-placeholder').style.display = 'none';
    document.getElementById('generated-recipe-container').style.display = 'block';
    
    // Заповнюємо дані
    document.getElementById('recipe-title').textContent = `${getTypeIcon(recipe.type)} ${recipe.name}`;
    
    // Бейджі
    const difficultyText = {
        'easy': '😌 Легко',
        'medium': '🤔 Середньо', 
        'hard': '😰 Складно'
    };
    
    document.getElementById('recipe-badges').innerHTML = `
        <span class="badge badge-${recipe.type}">${getTypeIcon(recipe.type)} ${getTypeName(recipe.type)}</span>
        <span class="badge bg-warning">${difficultyText[recipe.difficulty]}</span>
        <span class="badge badge-ai">🤖 AI Generated</span>
    `;
    
    // Мета інформація
    document.getElementById('recipe-meta').innerHTML = `
        ⏱️ ${recipe.prep_time} хв підготовка<br>
        🔥 ${recipe.cooking_time} хв готування<br>
        👥 ${recipe.servings} порції
    `;
    
    // Інгредієнти
    document.getElementById('recipe-ingredients').innerHTML = `
        <ul class="list-unstyled">
            ${recipe.ingredients.map(ing => `<li>• ${ing}</li>`).join('')}
        </ul>
    `;
    
    // Інструкції
    document.getElementById('recipe-instructions').innerHTML = `
        <ol>
            ${recipe.instructions.map(inst => `<li>${inst}</li>`).join('')}
        </ol>
    `;
    
    // Встановлюємо правильну категорію
    document.getElementById('recipe-category').value = recipe.type;
}

// Збереження згенерованого рецепту
async function saveGeneratedRecipe() {
    if (!currentGeneratedRecipe) {
        showAlert('Немає рецепту для збереження', 'warning');
        return;
    }
    
    const category = document.getElementById('recipe-category').value;
    
    const dishData = {
        name: currentGeneratedRecipe.name,
        description: 'Згенеровано AI кухарем',
        ingredients: currentGeneratedRecipe.ingredients.join('\n'),
        instructions: currentGeneratedRecipe.instructions.join('\n'),
        prep_time: currentGeneratedRecipe.prep_time,
        cooking_time: currentGeneratedRecipe.cooking_time,
        servings: currentGeneratedRecipe.servings,
        dish_type: category,
        difficulty: currentGeneratedRecipe.difficulty
    };
    
    try {
        const response = await fetch('/api/dishes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dishData)
        });
        
        const result = await response.json();
        showAlert('✅ Рецепт збережено в каталог!', 'success');
        
        // Оновлюємо список страв
        loadDishes();
        loadDishCategories();
        
        // Змінюємо кнопку на короткий час
        const btn = document.querySelector('[onclick="saveGeneratedRecipe()"]');
        const originalText = btn.innerHTML;
        btn.innerHTML = '✅ Збережено!';
        btn.classList.add('btn-outline-success');
        btn.classList.remove('btn-success');
        
        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.classList.remove('btn-outline-success');
            btn.classList.add('btn-success');
        }, 2000);
        
    } catch (error) {
        console.error('Помилка збереження рецепту:', error);
        showAlert('Помилка збереження рецепту', 'danger');
    }
}

// Додавання рецепту до планування
function addRecipeToPlanning() {
    if (!currentGeneratedRecipe) {
        showAlert('Спочатку згенеруй рецепт', 'warning');
        return;
    }
    
    showAlert('💡 Спочатку збережи рецепт, потім зможеш додати до плану', 'info');
}

// Генерація варіації
function generateVariation() {
    if (!currentGeneratedRecipe) return;
    
    showAlert('🔄 Генерую варіацію рецепту...', 'info');
    // Тут можна додати логіку генерації варіації
}

// Редагування рецепту
function editRecipe() {
    if (!currentGeneratedRecipe) return;
    
    showAlert('✏️ Функція редагування буде додана незабаром', 'info');
}

function getTypeName(type) {
    const typeNames = {
        'protein': 'Білки',
        'side': 'Гарніри',
        'vegetable': 'Овочі',
        'dessert': 'Десерти',
        'soup': 'Супи',
        'salad': 'Салати',
        'breakfast': 'Сніданки'
    };
    return typeNames[type] || type;
}

// ===========================================
// ОСНОВНІ ФУНКЦІЇ (залишаються ті самі)
// ===========================================

// Завантаження страв
async function loadDishes(dishType = null, search = null) {
    try {
        let url = '/api/dishes';
        const params = new URLSearchParams();
        if (dishType) params.append('type', dishType);
        if (search) params.append('search', search);
        if (params.toString()) url += '?' + params.toString();
        
        const response = await fetch(url);
        dishes = await response.json();
        renderDishesList();
        updatePlanDishSelect();
    } catch (error) {
        console.error('Помилка завантаження страв:', error);
        showAlert('Помилка завантаження страв', 'danger');
    }
}

// Завантаження категорій страв
async function loadDishCategories() {
    try {
        const response = await fetch('/api/dishes/by-type');
        const categories = await response.json();
        renderDishCategories(categories);
        renderQuickDishSelection(categories);
    } catch (error) {
        console.error('Помилка завантаження категорій:', error);
    }
}

// Рендер категорій страв
function renderDishCategories(categories) {
    const container = document.getElementById('dish-categories');
    if (!container) return;
    
    const typeNames = {
        'protein': { name: '🥩 Білки', desc: 'М\'ясо, риба, курка' },
        'side': { name: '🍚 Гарніри', desc: 'Крупи, картопля, макарони' },
        'vegetable': { name: '🥕 Овочі', desc: 'Овочеві страви' },
        'dessert': { name: '🍰 Десерти', desc: 'Солодощі' },
        'soup': { name: '🍲 Супи', desc: 'Перші страви' },
        'salad': { name: '🥗 Салати', desc: 'Свіжі салати' },
        'breakfast': { name: '🍳 Сніданки', desc: 'Ранкові страви' }
    };
    
    container.innerHTML = Object.entries(categories).map(([type, data]) => `
        <div class="col-md-3 mb-3">
            <div class="card dish-type-card h-100" onclick="filterDishesByType('${type}')">
                <div class="card-body text-center">
                    <h5 class="card-title">${typeNames[type]?.name || type}</h5>
                    <p class="card-text text-muted small">${typeNames[type]?.desc || ''}</p>
                    <span class="badge bg-primary">${data.count} страв</span>
                </div>
            </div>
        </div>
    `).join('');
}

// Рендер швидкого підбору
function renderQuickDishSelection(categories) {
    const container = document.getElementById('quick-dish-selection');
    if (!container) return;
    
    const mainTypes = ['protein', 'side', 'vegetable'];
    container.innerHTML = mainTypes.map(type => {
        const typeData = categories[type];
        if (!typeData || !typeData.dishes.length) return '';
        
        const randomDish = typeData.dishes[Math.floor(Math.random() * typeData.dishes.length)];
        const badgeClass = `badge-${type}`;
        
        return `
            <div class="col-12 mb-2">
                <button class="btn btn-outline-secondary btn-sm w-100" onclick="quickAddToPlan('${type}')">
                    <span class="badge ${badgeClass} me-2">${getTypeIcon(type)}</span>
                    ${randomDish}
                </button>
            </div>
        `;
    }).join('');
}

function getTypeIcon(type) {
    const icons = {
        'protein': '🥩',
        'side': '🍚',
        'vegetable': '🥕',
        'dessert': '🍰',
        'soup': '🍲',
        'salad': '🥗',
        'breakfast': '🍳'
    };
    return icons[type] || '🍴';
}

// Фільтрація страв за типом
function filterDishesByType(dishType) {
    loadDishes(dishType);
    document.getElementById('dish-search').value = '';
}

// Пошук страв
function searchDishes() {
    const search = document.getElementById('dish-search').value;
    loadDishes(null, search);
}

// Рендер списку страв
function renderDishesList() {
    const container = document.getElementById('dishes-list');
    if (!container) return;
    
    if (dishes.length === 0) {
        container.innerHTML = '<div class="alert alert-info">Страви не знайдено</div>';
        return;
    }
    
    container.innerHTML = dishes.map(dish => `
        <div class="card mb-3">
            <div class="card-body">
                <div class="row">
                    <div class="col-md-8">
                        <h5 class="card-title">
                            ${getTypeIcon(dish.dish_type)} ${dish.name}
                            <span class="badge badge-${dish.dish_type} ms-2">${dish.dish_type}</span>
                        </h5>
                        ${dish.description ? `<p class="card-text text-muted">${dish.description}</p>` : ''}
                        <div class="row text-muted small">
                            ${dish.prep_time ? `<div class="col-auto">⏱️ Підготовка: ${dish.prep_time} хв</div>` : ''}
                            ${dish.cooking_time ? `<div class="col-auto">🔥 Готування: ${dish.cooking_time} хв</div>` : ''}
                            ${dish.frequency_score > 0 ? `<div class="col-auto">📊 Готували: ${dish.frequency_score} разів</div>` : ''}
                        </div>
                    </div>
                    <div class="col-md-4 text-end">
                        <button class="btn btn-success btn-sm me-2" onclick="quickAddDishToPlan(${dish.id})">➕ До плану</button>
                        <button class="btn btn-outline-primary btn-sm" onclick="viewDishDetails(${dish.id})">👁️</button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

// Завантаження планів готування
async function loadCookingPlans() {
    try {
        const response = await fetch('/api/cooking-plans');
        cookingPlans = await response.json();
        renderCookingPlans();
    } catch (error) {
        console.error('Помилка завантаження планів:', error);
    }
}

// Рендер планів готування
function renderCookingPlans() {
    const container = document.getElementById('cooking-plans-list');
    if (!container) return;
    
    if (cookingPlans.length === 0) {
        container.innerHTML = `
            <div class="alert alert-info">
                <h6>📋 План порожній</h6>
                <p class="mb-0">Додай страви які плануєш готувати на наступні 3-4 дні</p>
            </div>
        `;
        return;
    }
    
    // Групуємо плани за датами
    const plansByDate = cookingPlans.reduce((acc, plan) => {
        const date = plan.cooking_date;
        if (!acc[date]) acc[date] = [];
        acc[date].push(plan);
        return acc;
    }, {});
    
    container.innerHTML = Object.entries(plansByDate).map(([date, plans]) => `
        <div class="card mb-3">
            <div class="card-header">
                <h6 class="mb-0">📅 ${formatDate(date)} (${getDayName(date)})</h6>
            </div>
            <div class="card-body">
                <div class="row">
                    ${plans.map(plan => `
                        <div class="col-md-4 mb-2">
                            <div class="cooking-plan-item p-3 rounded">
                                <div class="d-flex justify-content-between align-items-start">
                                    <div>
                                        <strong>${getTypeIcon(plan.dish_type)} ${plan.dish_name}</strong>
                                        <br>
                                        <small class="text-muted">
                                            ${plan.estimated_servings ? `${plan.estimated_servings} порцій` : ''}
                                            ${plan.prep_time ? ` • ${plan.prep_time + (plan.cooking_time || 0)} хв` : ''}
                                        </small>
                                        ${plan.notes ? `<br><small class="text-info">${plan.notes}</small>` : ''}
                                    </div>
                                    <button class="btn btn-sm btn-outline-danger" onclick="removePlan(${plan.id})">×</button>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `).join('');
}

// Додавання страви до плану швидко
function quickAddDishToPlan(dishId) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const planData = {
        cooking_date: tomorrow.toISOString().split('T')[0],
        dish_id: dishId,
        estimated_servings: 4,
        notes: ''
    };
    
    submitPlanData(planData);
}

// Швидке додавання з підбору
function quickAddToPlan(dishType) {
    const typeDishes = dishes.filter(d => d.dish_type === dishType);
    if (typeDishes.length === 0) {
        showAlert('Немає страв цього типу', 'warning');
        return;
    }
    
    // Вибираємо страву яку давно не готували
    const dish = typeDishes.sort((a, b) => {
        if (!a.last_cooked && !b.last_cooked) return a.frequency_score - b.frequency_score;
        if (!a.last_cooked) return -1;
        if (!b.last_cooked) return 1;
        return new Date(a.last_cooked) - new Date(b.last_cooked);
    })[0];
    
    quickAddDishToPlan(dish.id);
}

// Показ модального вікна додавання плану
function showAddPlanModal() {
    updatePlanDishSelect();
    const modal = new bootstrap.Modal(document.getElementById('addPlanModal'));
    modal.show();
}

// Оновлення списку страв у формі плану
function updatePlanDishSelect() {
    const select = document.querySelector('#addPlanModal select[name="dish_id"]');
    if (!select || dishes.length === 0) return;
    
    select.innerHTML = '<option value="">Оберіть страву...</option>' +
        dishes.map(dish => `
            <option value="${dish.id}">
                ${getTypeIcon(dish.dish_type)} ${dish.name}
                ${dish.prep_time ? ` (${dish.prep_time + (dish.cooking_time || 0)} хв)` : ''}
            </option>
        `).join('');
}

// Відправка форми плану
async function submitPlan() {
    const form = document.getElementById('plan-form');
    const formData = new FormData(form);
    
    const planData = {
        cooking_date: formData.get('cooking_date'),
        dish_id: formData.get('dish_id'),
        estimated_servings: formData.get('estimated_servings'),
        notes: formData.get('notes')
    };
    
    await submitPlanData(planData);
    
    // Закриваємо модаль
    const modal = bootstrap.Modal.getInstance(document.getElementById('addPlanModal'));
    modal.hide();
    form.reset();
}

// Відправка даних плану
async function submitPlanData(planData) {
    try {
        const response = await fetch('/api/cooking-plans', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(planData)
        });
        
        const result = await response.json();
        showAlert(result.message, 'success');
        loadCookingPlans();
    } catch (error) {
        console.error('Помилка додавання плану:', error);
        showAlert('Помилка додавання плану', 'danger');
    }
}

// Видалення плану
async function removePlan(planId) {
    if (!confirm('Видалити цю страву з плану?')) return;
    
    try {
        const response = await fetch(`/api/cooking-plans/${planId}`, {
            method: 'DELETE'
        });
        
        showAlert('План видалено', 'success');
        loadCookingPlans();
    } catch (error) {
        console.error('Помилка видалення плану:', error);
        showAlert('Помилка видалення плану', 'danger');
    }
}

// Автоматична генерація плану
async function generateCookingPlan() {
    try {
        const response = await fetch('/api/generate-cooking-plan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                days: 4,
                include_types: ['protein', 'side', 'vegetable']
            })
        });
        
        const suggestions = await response.json();
        showCookingPlanSuggestions(suggestions);
    } catch (error) {
        console.error('Помилка генерації плану:', error);
        showAlert('Помилка генерації плану', 'danger');
    }
}

// Показ запропонованого плану
function showCookingPlanSuggestions(suggestions) {
    const content = suggestions.map(day => `
        <div class="mb-3">
            <h6>📅 ${formatDate(day.date)}</h6>
            <div class="row">
                ${day.suggested_dishes.map(dish => `
                    <div class="col-md-4">
                        <button class="btn btn-outline-success btn-sm w-100 mb-2" onclick="quickAddDishToPlan(${dish.id})">
                            ${getTypeIcon(dish.dish_type)} ${dish.name}
                        </button>
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');
    
    const modalHtml = `
        <div class="modal fade" id="suggestionsModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">🎲 Пропозиції для плану готування</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        ${content}
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Закрити</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Видаляємо старий модаль якщо є
    const oldModal = document.getElementById('suggestionsModal');
    if (oldModal) oldModal.remove();
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const modal = new bootstrap.Modal(document.getElementById('suggestionsModal'));
    modal.show();
}

// Показ модального вікна додавання страви
function showAddDishModal() {
    const modal = new bootstrap.Modal(document.getElementById('addDishModal'));
    modal.show();
}

// Відправка форми страви
async function submitDish() {
    const form = document.getElementById('dish-form');
    const formData = new FormData(form);
    
    const dishData = {
        name: formData.get('name'),
        description: formData.get('description'),
        ingredients: formData.get('ingredients'),
        instructions: formData.get('instructions'),
        prep_time: formData.get('prep_time'),
        cooking_time: formData.get('cooking_time'),
        servings: formData.get('servings'),
        dish_type: formData.get('dish_type'),
        difficulty: formData.get('difficulty')
    };
    
    try {
        const response = await fetch('/api/dishes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dishData)
        });
        
        const result = await response.json();
        showAlert(result.message, 'success');
        
        // Закриваємо модаль і очищуємо форму
        const modal = bootstrap.Modal.getInstance(document.getElementById('addDishModal'));
        modal.hide();
        form.reset();
        
        // Оновлюємо список страв
        loadDishes();
        loadDishCategories();
    } catch (error) {
        console.error('Помилка додавання страви:', error);
        showAlert('Помилка додавання страви', 'danger');
    }
}

// Завантаження готових страв
async function loadReadyMeals() {
    try {
        const response = await fetch('/api/ready-meals');
        readyMeals = await response.json();
        renderReadyMeals();
    } catch (error) {
        console.error('Помилка завантаження готових страв:', error);
    }
}

// Рендер готових страв
function renderReadyMeals() {
    const container = document.getElementById('ready-meals-list');
    if (!container) return;
    
    if (readyMeals.length === 0) {
        container.innerHTML = '<div class="alert alert-info">Немає готових страв</div>';
        return;
    }
    
    container.innerHTML = readyMeals.map(meal => `
        <div class="ready-meal-item p-3 rounded mb-3">
            <div class="row align-items-center">
                <div class="col-md-8">
                    <h6 class="mb-1">${getTypeIcon(meal.dish_type)} ${meal.dish_name}</h6>
                    <small class="text-muted">
                        Приготовано: ${formatDate(meal.cooked_date)} • 
                        Залишилось: ${meal.servings_left} порцій
                        ${meal.expiry_date ? ` • До: ${formatDate(meal.expiry_date)}` : ''}
                    </small>
                    ${meal.notes ? `<br><small class="text-info">${meal.notes}</small>` : ''}
                </div>
                <div class="col-md-4 text-end">
                    <div class="btn-group">
                        <button class="btn btn-sm btn-success" onclick="consumeServings(${meal.id}, 1)">-1</button>
                        <button class="btn btn-sm btn-warning" onclick="consumeServings(${meal.id}, ${Math.ceil(meal.servings_left/2)})">½</button>
                        <button class="btn btn-sm btn-danger" onclick="consumeServings(${meal.id}, ${meal.servings_left})">Все</button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

// Споживання порцій
async function consumeServings(mealId, servings) {
    try {
        const response = await fetch(`/api/ready-meals/${mealId}/consume`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ servings_consumed: servings })
        });
        
        showAlert(`Порцій спожито: ${servings}`, 'success');
        loadReadyMeals();
    } catch (error) {
        console.error('Помилка оновлення порцій:', error);
    }
}

// Завантаження списку покупок
async function loadShoppingList() {
    try {
        const response = await fetch('/api/shopping-list');
        const shoppingList = await response.json();
        renderShoppingList(shoppingList);
    } catch (error) {
        console.error('Помилка завантаження списку покупок:', error);
    }
}

// Рендер списку покупок
function renderShoppingList(items) {
    const container = document.getElementById('shopping-list');
    if (!container) return;
    
    if (items.length === 0) {
        container.innerHTML = '<div class="alert alert-info">Список покупок порожній</div>';
        return;
    }
    
    // Групуємо за категоріями
    const itemsByCategory = items.reduce((acc, item) => {
        const category = item.category || 'Інше';
        if (!acc[category]) acc[category] = [];
        acc[category].push(item);
        return acc;
    }, {});
    
    container.innerHTML = Object.entries(itemsByCategory).map(([category, items]) => `
        <div class="card mb-3">
            <div class="card-header">
                <h6 class="mb-0">${category}</h6>
            </div>
            <div class="card-body">
                ${items.map(item => `
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" ${item.is_bought ? 'checked' : ''}>
                        <label class="form-check-label ${item.is_bought ? 'text-decoration-line-through text-muted' : ''}">
                            ${item.item_name} ${item.quantity ? `(${item.quantity})` : ''}
                        </label>
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');
}

// Генерація списку покупок
async function generateShoppingList() {
    try {
        const response = await fetch('/api/generate-shopping-list', {
            method: 'POST'
        });
        
        const result = await response.json();
        showAlert(result.message, 'success');
        loadShoppingList();
    } catch (error) {
        console.error('Помилка генерації списку:', error);
        showAlert('Помилка генерації списку покупок', 'danger');
    }
}

// Утиліти
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('uk-UA', { 
        day: 'numeric', 
        month: 'long'
    });
}

function getDayName(dateString) {
    const date = new Date(dateString);
    const days = ['Неділя', 'Понеділок', 'Вівторок', 'Середа', 'Четвер', "П'ятниця", 'Субота'];
    return days[date.getDay()];
}

function showAlert(message, type = 'info') {
    const alertHtml = `
        <div class="alert alert-${type} alert-dismissible fade show position-fixed" 
             style="top: 20px; right: 20px; z-index: 1050; max-width: 300px;">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', alertHtml);
    
    // Автоматично приховуємо через 3 секунди
    setTimeout(() => {
        const alert = document.querySelector('.alert:last-of-type');
        if (alert) {
            const bsAlert = new bootstrap.Alert(alert);
            bsAlert.close();
        }
    }, 3000);
}