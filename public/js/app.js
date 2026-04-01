// Family Menu Planner AI - Main Application
class MenuPlannerApp {
    constructor() {
        this.dishes = [];
        this.menuItems = [];
        this.currentTab = 'planner';
        this.supabaseUrl = 'https://pgfqfszlrvexrpehdyyk.supabase.co';
        this.supabaseKey = 'sb_publishable_k7QTpbacFkKyu12pVaPAmQ_54X4yiLq';
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadInitialData();
        this.switchTab('planner');
    }

    bindEvents() {
        // Tab switching
        document.querySelectorAll('[data-tab]').forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchTab(e.target.dataset.tab);
            });
        });

        // Add dish form
        document.getElementById('add-dish-form').addEventListener('submit', (e) => {
            this.addDish(e);
        });

        // AI Chat
        document.getElementById('ai-send').addEventListener('click', () => {
            this.sendAiMessage();
        });
        
        document.getElementById('ai-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendAiMessage();
            }
        });

        // Search and filter
        document.getElementById('dish-search').addEventListener('input', (e) => {
            this.filterDishes();
        });
        
        document.getElementById('category-filter').addEventListener('change', (e) => {
            this.filterDishes();
        });

        // Generate shopping list
        document.getElementById('generate-shopping-list').addEventListener('click', () => {
            this.generateShoppingList();
        });
    }

    switchTab(tabName) {
        // Hide all tabs
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.style.display = 'none';
        });
        
        // Remove active class from all nav links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        
        // Show selected tab
        document.getElementById(tabName + '-tab').style.display = 'block';
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        
        this.currentTab = tabName;
        
        // Load tab-specific data
        if (tabName === 'dishes') {
            this.loadDishes();
        } else if (tabName === 'planner') {
            this.loadMenuCalendar();
        }
    }

    async loadInitialData() {
        this.showLoading(true);
        try {
            // Try to load from Supabase, fallback to demo data
            await this.loadDishes();
            this.loadMenuItems();
            this.updateStatistics();
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            this.showLoading(false);
        }
    }

    async loadDishes() {
        try {
            // Try Supabase API
            const response = await fetch(`${this.supabaseUrl}/rest/v1/dishes`, {
                headers: {
                    'apikey': this.supabaseKey,
                    'Authorization': `Bearer ${this.supabaseKey}`
                }
            });
            
            if (response.ok) {
                this.dishes = await response.json();
                console.log('✅ Loaded dishes from Supabase:', this.dishes.length);
            } else {
                throw new Error('Supabase not ready');
            }
        } catch (error) {
            console.log('⚠️ Using demo data (Supabase not configured yet)');
            // Fallback to demo data
            this.dishes = this.getDemoDishes();
        }
        
        this.renderDishes();
        this.renderPopularDishes();
    }

    async loadMenuItems() {
        try {
            const response = await fetch(`${this.supabaseUrl}/rest/v1/menu_items?select=*,dishes(*)`, {
                headers: {
                    'apikey': this.supabaseKey,
                    'Authorization': `Bearer ${this.supabaseKey}`
                }
            });
            
            if (response.ok) {
                this.menuItems = await response.json();
            } else {
                throw new Error('Menu items not loaded');
            }
        } catch (error) {
            console.log('⚠️ Using demo menu data');
            this.menuItems = this.getDemoMenuItems();
        }
    }

    renderDishes() {
        const container = document.getElementById('dishes-list');
        if (!container) return;

        const filteredDishes = this.getFilteredDishes();
        
        if (filteredDishes.length === 0) {
            container.innerHTML = `
                <div class="col-12 text-center">
                    <div class="card">
                        <div class="card-body py-5">
                            <h5>🍽️ Поки немає страв</h5>
                            <p class="text-muted">Додай свою першу страву, щоб почати планування!</p>
                            <button class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#addDishModal">
                                <i class="fas fa-plus me-2"></i>Додати страву
                            </button>
                        </div>
                    </div>
                </div>
            `;
            return;
        }
        
        container.innerHTML = filteredDishes.map(dish => `
            <div class="col-md-6 col-lg-4 mb-3">
                <div class="card dish-card h-100" onclick="app.addToMenu('${dish.id}')">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <h6 class="card-title">${dish.name}</h6>
                            <span class="badge category-badge ${this.getCategoryColor(dish.category)}">
                                ${this.getCategoryIcon(dish.category)} ${this.getCategoryName(dish.category)}
                            </span>
                        </div>
                        <p class="card-text text-muted small">
                            <i class="fas fa-clock me-1"></i>${dish.cooking_time || 30} хв
                        </p>
                        ${dish.ingredients && dish.ingredients.length > 0 ? `
                            <p class="card-text small">
                                <i class="fas fa-list me-1"></i>
                                ${Array.isArray(dish.ingredients) ? dish.ingredients.slice(0,3).join(', ') : dish.ingredients}
                                ${Array.isArray(dish.ingredients) && dish.ingredients.length > 3 ? '...' : ''}
                            </p>
                        ` : ''}
                        <button class="btn btn-sm btn-outline-primary w-100" onclick="event.stopPropagation(); app.addToMenu('${dish.id}')">
                            <i class="fas fa-plus me-1"></i>Додати в меню
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    renderPopularDishes() {
        const container = document.getElementById('popular-dishes');
        if (!container) return;

        const popular = this.dishes.slice(0, 5);
        
        if (popular.length === 0) {
            container.innerHTML = '<p class="text-muted small">Додай страви для статистики</p>';
            return;
        }
        
        container.innerHTML = popular.map((dish, index) => `
            <div class="d-flex justify-content-between align-items-center mb-2 p-2 bg-light rounded">
                <span class="small">${dish.name}</span>
                <span class="badge bg-primary">${5-index}</span>
            </div>
        `).join('');
    }

    getFilteredDishes() {
        const search = document.getElementById('dish-search')?.value.toLowerCase() || '';
        const category = document.getElementById('category-filter')?.value || '';
        
        return this.dishes.filter(dish => {
            const matchesSearch = dish.name.toLowerCase().includes(search);
            const matchesCategory = !category || dish.category === category;
            return matchesSearch && matchesCategory;
        });
    }

    loadMenuCalendar() {
        const container = document.getElementById('menu-calendar');
        if (!container) return;

        const today = new Date();
        const days = [];
        
        for (let i = 0; i < 7; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            days.push(date);
        }

        container.innerHTML = days.map(date => {
            const dayMenu = this.menuItems.filter(item => {
                const itemDate = new Date(item.planned_date);
                return itemDate.toDateString() === date.toDateString();
            });
            
            return `
                <div class="menu-day mb-4">
                    <h5>${this.formatDate(date)}</h5>
                    <div class="row">
                        ${['breakfast', 'lunch', 'dinner'].map(mealType => `
                            <div class="col-md-4 mb-2">
                                <div class="card">
                                    <div class="card-header py-2">
                                        <small class="fw-bold">${this.getMealTypeName(mealType)}</small>
                                    </div>
                                    <div class="card-body py-2">
                                        ${this.renderMealItems(dayMenu, mealType)}
                                        <button class="btn btn-sm btn-outline-primary w-100 mt-2" 
                                                onclick="app.showAddMealModal('${date.toISOString().split('T')[0]}', '${mealType}')">
                                            <i class="fas fa-plus"></i> Додати
                                        </button>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }).join('');
    }

    renderMealItems(dayMenu, mealType) {
        const meals = dayMenu.filter(item => item.meal_type === mealType);
        if (meals.length === 0) {
            return '<p class="text-muted small mb-0">Не заплановано</p>';
        }
        
        return meals.map(meal => {
            const dishName = meal.dishes?.name || meal.dish_name || 'Невідома страва';
            return `
                <div class="d-flex justify-content-between align-items-center mb-1">
                    <span class="small">${dishName}</span>
                    <div>
                        <button class="btn btn-sm ${meal.status === 'ready' ? 'btn-success' : 'btn-outline-success'}" 
                                onclick="app.toggleMealStatus('${meal.id}')">
                            <i class="fas fa-check"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    async addDish(e) {
        e.preventDefault();
        this.showLoading(true);
        
        const formData = new FormData(e.target);
        const dishData = {
            name: formData.get('name'),
            category: formData.get('category'),
            cooking_time: parseInt(formData.get('cooking_time')) || 30,
            ingredients: formData.get('ingredients')?.split(',').map(s => s.trim()).filter(s => s) || []
        };

        try {
            // Try Supabase API
            const response = await fetch(`${this.supabaseUrl}/rest/v1/dishes`, {
                method: 'POST',
                headers: {
                    'apikey': this.supabaseKey,
                    'Authorization': `Bearer ${this.supabaseKey}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify(dishData)
            });

            if (response.ok) {
                const newDish = await response.json();
                this.dishes.unshift(newDish[0] || newDish);
                this.showSuccess('Страву додано в Supabase!');
            } else {
                throw new Error('Supabase error');
            }
        } catch (error) {
            console.log('⚠️ Adding dish locally');
            
            // Fallback: add to local array
            const newDish = {
                id: Date.now().toString(),
                ...dishData,
                created_at: new Date().toISOString()
            };
            this.dishes.unshift(newDish);
            this.showSuccess('Страву додано локально!');
        }

        this.renderDishes();
        this.renderPopularDishes();
        
        // Close modal and reset form
        const modal = bootstrap.Modal.getInstance(document.getElementById('addDishModal'));
        modal.hide();
        e.target.reset();
        
        this.showLoading(false);
    }

    addToMenu(dishId) {
        const dish = this.dishes.find(d => d.id === dishId);
        if (!dish) return;

        // For demo - just show success message
        this.showSuccess(`"${dish.name}" додано в меню на сьогодні!`);
        
        // Add to local menu items
        const today = new Date().toISOString().split('T')[0];
        const newMenuItem = {
            id: Date.now().toString(),
            dish_id: dishId,
            planned_date: today,
            meal_type: 'dinner',
            status: 'planned',
            dish_name: dish.name
        };
        
        this.menuItems.push(newMenuItem);
        this.updateStatistics();
        
        // Refresh calendar if on planner tab
        if (this.currentTab === 'planner') {
            this.loadMenuCalendar();
        }
    }

    showAddMealModal(date, mealType) {
        if (this.dishes.length === 0) {
            this.showError('Спочатку додай страви в каталог!');
            return;
        }

        const dishOptions = this.dishes.map(dish => 
            `<option value="${dish.id}">${dish.name} (${dish.cooking_time}хв)</option>`
        ).join('');

        const modalHtml = `
            <div class="modal fade" id="addMealModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Додати страву в ${this.getMealTypeName(mealType)}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="mb-3">
                                <label class="form-label">Дата: ${this.formatDate(new Date(date))}</label>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Оберіть страву:</label>
                                <select class="form-select" id="meal-dish-select">
                                    ${dishOptions}
                                </select>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Скасувати</button>
                            <button type="button" class="btn btn-primary" onclick="app.saveMealToMenu('${date}', '${mealType}')">Додати</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Remove existing modal if any
        const existingModal = document.getElementById('addMealModal');
        if (existingModal) {
            existingModal.remove();
        }

        // Add new modal to body
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('addMealModal'));
        modal.show();
    }

    saveMealToMenu(date, mealType) {
        const dishId = document.getElementById('meal-dish-select').value;
        const dish = this.dishes.find(d => d.id === dishId);
        
        if (!dish) return;

        const newMenuItem = {
            id: Date.now().toString(),
            dish_id: dishId,
            planned_date: date,
            meal_type: mealType,
            status: 'planned',
            dish_name: dish.name
        };
        
        this.menuItems.push(newMenuItem);
        this.loadMenuCalendar();
        this.updateStatistics();

        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('addMealModal'));
        modal.hide();
        document.getElementById('addMealModal').remove();

        this.showSuccess(`"${dish.name}" додано в ${this.getMealTypeName(mealType)}!`);
    }

    toggleMealStatus(mealId) {
        const meal = this.menuItems.find(m => m.id === mealId);
        if (!meal) return;

        meal.status = meal.status === 'ready' ? 'planned' : 'ready';
        this.loadMenuCalendar();
        this.updateStatistics();

        const status = meal.status === 'ready' ? 'готова' : 'запланована';
        this.showSuccess(`Страва позначена як ${status}!`);
    }

    sendAiMessage() {
        const input = document.getElementById('ai-input');
        const message = input.value.trim();
        if (!message) return;

        const chatContainer = document.getElementById('ai-chat');
        
        // Add user message
        chatContainer.innerHTML += `
            <div class="mb-3 p-3 bg-light rounded">
                <strong>👤 Ти:</strong> ${message}
            </div>
        `;

        // Add AI response (demo)
        setTimeout(() => {
            const responses = [
                "🤖 Чудова ідея! Ось швидкий рецепт: обсмаж інгредієнти на олії, додай спеції та туши 20 хвилин. Смачного!",
                "🤖 Рекомендую спочатку підготувати всі інгредієнти. Тоді процес піде швидше!",
                "🤖 Це звучить смачно! А що якщо додати трохи часнику та зелені? Це завжди покращує смак.",
                "🤖 Отличний вибір! Час приготування приблизно 30-45 хвилин. Потрібен рецепт покроково?",
                "🤖 Пропоную варіант: 1) Підготуй інгредієнти 2) Розігрій сковорідку 3) Готуй поступово 4) Насолоджуйся результатом!",
                "🤖 Для цієї страви знадобиться близько години. Хочеш, щоб я додав її в твій планувальник меню?"
            ];
            
            const randomResponse = responses[Math.floor(Math.random() * responses.length)];
            
            chatContainer.innerHTML += `
                <div class="mb-3 p-3 bg-primary bg-opacity-10 rounded">
                    <strong>🤖 AI Кухар:</strong> ${randomResponse}
                </div>
            `;
            
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }, 1000 + Math.random() * 2000); // Random delay 1-3 seconds

        input.value = '';
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    generateShoppingList() {
        const container = document.getElementById('shopping-list');
        const summaryContainer = document.getElementById('shopping-summary');
        
        // Get ingredients from planned meals
        const allIngredients = [];
        const ingredientCount = new Map();

        // Collect ingredients from menu items
        this.menuItems.forEach(menuItem => {
            const dish = this.dishes.find(d => d.id === menuItem.dish_id);
            if (dish && dish.ingredients && Array.isArray(dish.ingredients)) {
                dish.ingredients.forEach(ingredient => {
                    const key = ingredient.toLowerCase().trim();
                    ingredientCount.set(key, (ingredientCount.get(key) || 0) + 1);
                });
            }
        });

        // If no planned meals, show demo ingredients
        if (ingredientCount.size === 0) {
            const demoIngredients = [
                'М\'ясо яловиче - 500г',
                'Картопля - 1кг', 
                'Морква - 300г',
                'Цибуля - 200г',
                'Рис - 500г',
                'Молоко - 1л',
                'Яйця - 10шт',
                'Хліб - 1 буханка',
                'Сіль - 1 пачка',
                'Кріп - 1 пучок'
            ];
            
            container.innerHTML = `
                <div class="alert alert-info mb-3">
                    <i class="fas fa-info-circle me-2"></i>
                    Демо список покупок. Додай страви в меню для автоматичного списку!
                </div>
                <div class="row">
                    ${demoIngredients.map((item, index) => `
                        <div class="col-md-6 mb-2">
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" id="ingredient-${index}">
                                <label class="form-check-label" for="ingredient-${index}">
                                    ${item}
                                </label>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
            
            summaryContainer.innerHTML = `
                <div class="mb-2">
                    <strong>Всього пунктів:</strong> ${demoIngredients.length}
                </div>
                <div class="mb-2">
                    <strong>Орієнтовна вартість:</strong> ₴450-650
                </div>
                <button class="btn btn-success btn-sm w-100 mt-3">
                    <i class="fas fa-download me-2"></i>Експорт списку
                </button>
            `;
        } else {
            // Generate list from actual ingredients
            const ingredientList = Array.from(ingredientCount.entries()).map(([ingredient, count]) => {
                const displayName = ingredient.charAt(0).toUpperCase() + ingredient.slice(1);
                return count > 1 ? `${displayName} (×${count})` : displayName;
            });
            
            container.innerHTML = `
                <div class="alert alert-success mb-3">
                    <i class="fas fa-magic me-2"></i>
                    Список згенеровано з твоїх запланованих страв!
                </div>
                <div class="row">
                    ${ingredientList.map((item, index) => `
                        <div class="col-md-6 mb-2">
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" id="ingredient-${index}">
                                <label class="form-check-label" for="ingredient-${index}">
                                    ${item}
                                </label>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
            
            summaryContainer.innerHTML = `
                <div class="mb-2">
                    <strong>Всього інгредієнтів:</strong> ${ingredientList.length}
                </div>
                <div class="mb-2">
                    <strong>З ${this.menuItems.length} страв</strong>
                </div>
                <div class="mb-2">
                    <strong>Орієнтовна вартість:</strong> ₴${Math.round(ingredientList.length * 30)}-${Math.round(ingredientList.length * 50)}
                </div>
                <button class="btn btn-success btn-sm w-100 mt-3">
                    <i class="fas fa-download me-2"></i>Експорт списку
                </button>
            `;
        }
    }

    updateStatistics() {
        const plannedCount = this.menuItems.length;
        const readyCount = this.menuItems.filter(item => item.status === 'ready').length;
        const progress = plannedCount > 0 ? (readyCount / plannedCount) * 100 : 0;

        document.getElementById('planned-count').textContent = plannedCount;
        document.getElementById('ready-count').textContent = readyCount;
        document.getElementById('progress-bar').style.width = Math.round(progress) + '%';
    }

    // Utility methods
    getCategoryColor(category) {
        const colors = {
            protein: 'bg-danger',
            side: 'bg-warning',
            vegetable: 'bg-success', 
            dessert: 'bg-info'
        };
        return colors[category] || 'bg-secondary';
    }

    getCategoryIcon(category) {
        const icons = {
            protein: '🥩',
            side: '🍚',
            vegetable: '🥕',
            dessert: '🍰'
        };
        return icons[category] || '🍽️';
    }

    getCategoryName(category) {
        const names = {
            protein: 'Білки',
            side: 'Гарніри', 
            vegetable: 'Овочі',
            dessert: 'Десерти'
        };
        return names[category] || category;
    }

    getMealTypeName(mealType) {
        const names = {
            breakfast: '🌅 Сніданок',
            lunch: '☀️ Обід', 
            dinner: '🌙 Вечеря'
        };
        return names[mealType] || mealType;
    }

    formatDate(date) {
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        return date.toLocaleDateString('uk-UA', options);
    }

    getDemoDishes() {
        return [
            {
                id: '1',
                name: 'Борщ український',
                category: 'protein',
                cooking_time: 90,
                ingredients: ['буряк', 'капуста', 'морква', "м'ясо", 'цибуля', 'картопля']
            },
            {
                id: '2', 
                name: 'Картопля відварна з кропом',
                category: 'side',
                cooking_time: 25,
                ingredients: ['картопля', 'сіль', 'кріп', 'масло']
            },
            {
                id: '3',
                name: 'Салат з свіжих огірків',
                category: 'vegetable', 
                cooking_time: 10,
                ingredients: ['огірки', 'кріп', 'сметана', 'сіль']
            },
            {
                id: '4',
                name: 'Котлети домашні',
                category: 'protein',
                cooking_time: 45,
                ingredients: ['фарш', 'цибуля', 'яйце', 'хліб', 'молоко']
            },
            {
                id: '5',
                name: 'Гречка розсипчаста',
                category: 'side',
                cooking_time: 20,
                ingredients: ['гречка', 'вода', 'сіль', 'масло']
            },
            {
                id: '6',
                name: 'Оладки на кефірі',
                category: 'dessert',
                cooking_time: 30,
                ingredients: ['борошно', 'кефір', 'яйце', 'цукор', 'сода']
            }
        ];
    }

    getDemoMenuItems() {
        const today = new Date();
        return [
            {
                id: 'm1',
                dish_id: '1',
                planned_date: today.toISOString().split('T')[0],
                meal_type: 'dinner',
                status: 'planned',
                dish_name: 'Борщ український'
            },
            {
                id: 'm2', 
                dish_id: '2',
                planned_date: today.toISOString().split('T')[0],
                meal_type: 'dinner',
                status: 'ready',
                dish_name: 'Картопля відварна з кропом'
            }
        ];
    }

    showLoading(show) {
        const loader = document.getElementById('loading');
        if (loader) {
            loader.style.display = show ? 'block' : 'none';
        }
    }

    showSuccess(message) {
        // Create toast notification
        const toast = document.createElement('div');
        toast.className = 'toast align-items-center text-bg-success border-0 position-fixed top-0 end-0 m-3';
        toast.style.zIndex = '9999';
        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">
                    <i class="fas fa-check-circle me-2"></i>${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        `;
        
        document.body.appendChild(toast);
        const bsToast = new bootstrap.Toast(toast);
        bsToast.show();
        
        // Remove toast after it's hidden
        toast.addEventListener('hidden.bs.toast', () => {
            toast.remove();
        });
    }

    showError(message) {
        // Create error toast notification
        const toast = document.createElement('div');
        toast.className = 'toast align-items-center text-bg-danger border-0 position-fixed top-0 end-0 m-3';
        toast.style.zIndex = '9999';
        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">
                    <i class="fas fa-exclamation-circle me-2"></i>${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        `;
        
        document.body.appendChild(toast);
        const bsToast = new bootstrap.Toast(toast);
        bsToast.show();
        
        // Remove toast after it's hidden
        toast.addEventListener('hidden.bs.toast', () => {
            toast.remove();
        });
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new MenuPlannerApp();
    console.log('🍽️ Family Menu Planner AI запущено!');
});