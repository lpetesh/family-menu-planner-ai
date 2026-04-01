// Family Menu Planner AI - Main Application
class MenuPlannerApp {
    constructor() {
        this.dishes = [];
        this.menuItems = [];
        this.currentTab = 'planner';
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
            await Promise.all([
                this.loadDishes(),
                this.loadMenuItems()
            ]);
            this.updateStatistics();
        } catch (error) {
            console.error('Error loading data:', error);
            this.showError('Помилка завантаження даних');
        } finally {
            this.showLoading(false);
        }
    }

    async loadDishes() {
        try {
            const response = await fetch('/api/dishes');
            if (!response.ok) throw new Error('Failed to load dishes');
            
            this.dishes = await response.json();
            this.renderDishes();
            this.renderPopularDishes();
        } catch (error) {
            console.error('Error loading dishes:', error);
            // Fallback to demo data
            this.dishes = this.getDemoDishes();
            this.renderDishes();
            this.renderPopularDishes();
        }
    }

    async loadMenuItems() {
        try {
            const response = await fetch('/api/menu');
            if (!response.ok) throw new Error('Failed to load menu');
            
            this.menuItems = await response.json();
        } catch (error) {
            console.error('Error loading menu:', error);
            this.menuItems = [];
        }
    }

    renderDishes() {
        const container = document.getElementById('dishes-list');
        if (!container) return;

        const filteredDishes = this.getFilteredDishes();
        
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
                            </p>
                        ` : ''}
                        <button class="btn btn-sm btn-outline-primary w-100">
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
        container.innerHTML = popular.map(dish => `
            <div class="d-flex justify-content-between align-items-center mb-2 p-2 bg-light rounded">
                <span>${dish.name}</span>
                <span class="badge bg-primary">${Math.floor(Math.random() * 10) + 1}</span>
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
            const dayMenu = this.menuItems.filter(item => 
                new Date(item.planned_date).toDateString() === date.toDateString()
            );
            
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
        
        return meals.map(meal => `
            <div class="d-flex justify-content-between align-items-center mb-1">
                <span class="small">${meal.dishes?.name || 'Невідома страва'}</span>
                <div>
                    <button class="btn btn-sm ${meal.status === 'ready' ? 'btn-success' : 'btn-outline-success'}" 
                            onclick="app.toggleMealStatus('${meal.id}')">
                        <i class="fas fa-check"></i>
                    </button>
                </div>
            </div>
        `).join('');
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
            const response = await fetch('/api/dishes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(dishData)
            });

            if (!response.ok) throw new Error('Failed to add dish');

            const newDish = await response.json();
            this.dishes.unshift(newDish);
            this.renderDishes();
            
            // Close modal and reset form
            const modal = bootstrap.Modal.getInstance(document.getElementById('addDishModal'));
            modal.hide();
            e.target.reset();
            
            this.showSuccess('Страву додано успішно!');
        } catch (error) {
            console.error('Error adding dish:', error);
            
            // Fallback: add to local array
            const newDish = {
                id: Date.now().toString(),
                ...dishData,
                created_at: new Date().toISOString()
            };
            this.dishes.unshift(newDish);
            this.renderDishes();
            
            const modal = bootstrap.Modal.getInstance(document.getElementById('addDishModal'));
            modal.hide();
            e.target.reset();
            
            this.showSuccess('Страву додано локально!');
        } finally {
            this.showLoading(false);
        }
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
                "🤖 Отличний вибір! Час приготування приблизно 30-45 хвилин. Потрібен рецепт покроково?"
            ];
            
            const randomResponse = responses[Math.floor(Math.random() * responses.length)];
            
            chatContainer.innerHTML += `
                <div class="mb-3 p-3 bg-primary bg-opacity-10 rounded">
                    <strong>🤖 AI Кухар:</strong> ${randomResponse}
                </div>
            `;
            
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }, 1000);

        input.value = '';
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    generateShoppingList() {
        const container = document.getElementById('shopping-list');
        const summaryContainer = document.getElementById('shopping-summary');
        
        // Get ingredients from planned meals
        const ingredients = new Map();
        
        // Add some demo ingredients
        const demoIngredients = [
            'М\'ясо яловиче - 500г',
            'Картопля - 1кг', 
            'Морква - 300г',
            'Цибуля - 200г',
            'Рис - 500г',
            'Молоко - 1л',
            'Яйця - 10шт',
            'Хліб - 1 буханка'
        ];
        
        container.innerHTML = `
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
    }

    updateStatistics() {
        const plannedCount = this.menuItems.length;
        const readyCount = this.menuItems.filter(item => item.status === 'ready').length;
        const progress = plannedCount > 0 ? (readyCount / plannedCount) * 100 : 0;

        document.getElementById('planned-count').textContent = plannedCount;
        document.getElementById('ready-count').textContent = readyCount;
        document.getElementById('progress-bar').style.width = progress + '%';
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
                cooking_time: 60,
                ingredients: ['буряк', 'капуста', 'морква', 'м\'ясо', 'цибуля']
            },
            {
                id: '2', 
                name: 'Картопля відварна',
                category: 'side',
                cooking_time: 25,
                ingredients: ['картопля', 'сіль', 'кріп']
            },
            {
                id: '3',
                name: 'Салат з огірків',
                category: 'vegetable', 
                cooking_time: 10,
                ingredients: ['огірки', 'кріп', 'сметана', 'сіль']
            },
            {
                id: '4',
                name: 'Тірамісу',
                category: 'dessert',
                cooking_time: 30,
                ingredients: ['маскарпоне', 'кава', 'печиво', 'какао']
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
        // Simple alert for now - could be replaced with toast
        alert('✅ ' + message);
    }

    showError(message) {
        // Simple alert for now - could be replaced with toast  
        alert('❌ ' + message);
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new MenuPlannerApp();
});