-- Family Menu Planner Database Setup for Supabase

-- Enable Row Level Security
ALTER DEFAULT PRIVILEGES REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

-- Create dishes table
CREATE TABLE IF NOT EXISTS dishes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('protein', 'side', 'vegetable', 'dessert')),
    ingredients JSONB DEFAULT '[]',
    cooking_time INTEGER DEFAULT 30,
    difficulty VARCHAR(20) DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
    servings INTEGER DEFAULT 4,
    calories INTEGER DEFAULT NULL,
    image_url TEXT DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create menu_items table
CREATE TABLE IF NOT EXISTS menu_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    dish_id UUID REFERENCES dishes(id) ON DELETE CASCADE,
    planned_date DATE NOT NULL,
    meal_type VARCHAR(20) NOT NULL DEFAULT 'dinner' CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
    status VARCHAR(20) NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'shopping', 'cooking', 'ready')),
    servings INTEGER DEFAULT 4,
    notes TEXT DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create shopping_lists table
CREATE TABLE IF NOT EXISTS shopping_lists (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    items JSONB DEFAULT '[]',
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create recipes table (for AI generated recipes)
CREATE TABLE IF NOT EXISTS recipes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    dish_id UUID REFERENCES dishes(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    ingredients JSONB DEFAULT '[]',
    instructions JSONB DEFAULT '[]',
    prep_time INTEGER DEFAULT 15,
    cook_time INTEGER DEFAULT 30,
    total_time INTEGER DEFAULT 45,
    difficulty VARCHAR(20) DEFAULT 'medium',
    servings INTEGER DEFAULT 4,
    nutrition JSONB DEFAULT '{}',
    tags JSONB DEFAULT '[]',
    source VARCHAR(50) DEFAULT 'ai_generated',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert sample dishes
INSERT INTO dishes (name, category, ingredients, cooking_time, difficulty) VALUES 
('Борщ український', 'protein', '["буряк", "капуста", "морква", "м''ясо яловиче", "цибуля", "картопля", "томатна паста", "часник", "лавровий лист"]', 90, 'medium'),
('Картопля відварна з кропом', 'side', '["картопля", "сіль", "кріп свіжий", "вершкове масло"]', 25, 'easy'),
('Гречка розсипчаста', 'side', '["гречка", "вода", "сіль", "вершкове масло"]', 20, 'easy'),
('Салат з свіжих огірків', 'vegetable', '["огірки свіжі", "кріп", "сметана", "сіль", "чорний перець"]', 10, 'easy'),
('Котлети домашні', 'protein', '["фарш змішаний", "цибуля", "яйце", "хліб білий", "молоко", "сіль", "перець"]', 45, 'medium'),
('Рис відварний', 'side', '["рис довгозернистий", "вода", "сіль", "вершкове масло"]', 18, 'easy'),
('Капуста тушкована', 'vegetable', '["капуста білокачанна", "морква", "цибуля", "томатна паста", "олія рослинна"]', 40, 'easy'),
('Оладки на кефірі', 'dessert', '["борошно", "кефір", "яйце", "цукор", "сіль", "сода"]', 30, 'medium'),
('Курка запечена', 'protein', '["курка ціла", "часник", "розмарин", "тимян", "лимон", "олива", "сіль", "перець"]', 75, 'medium'),
('Макарони', 'side', '["макарони", "вода", "сіль", "вершкове масло"]', 12, 'easy'),
('Салат з помідорів', 'vegetable', '["помідори", "цибуля зелена", "олія рослинна", "сіль", "базилік"]', 8, 'easy'),
('Сирники', 'dessert', '["сир кисломолочний", "яйце", "борошно", "цукор", "ваніль", "сіль"]', 25, 'medium');

-- Insert sample menu items for current week
INSERT INTO menu_items (dish_id, planned_date, meal_type, status) 
SELECT 
    d.id,
    CURRENT_DATE + (RANDOM() * 7)::INTEGER,
    (ARRAY['breakfast', 'lunch', 'dinner'])[FLOOR(RANDOM() * 3) + 1],
    (ARRAY['planned', 'shopping', 'ready'])[FLOOR(RANDOM() * 3) + 1]
FROM dishes d
ORDER BY RANDOM()
LIMIT 15;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_dishes_category ON dishes(category);
CREATE INDEX IF NOT EXISTS idx_dishes_created_at ON dishes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_menu_items_date ON menu_items(planned_date);
CREATE INDEX IF NOT EXISTS idx_menu_items_status ON menu_items(status);
CREATE INDEX IF NOT EXISTS idx_menu_items_dish_id ON menu_items(dish_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_dishes_updated_at BEFORE UPDATE ON dishes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_menu_items_updated_at BEFORE UPDATE ON menu_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shopping_lists_updated_at BEFORE UPDATE ON shopping_lists
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS) - for future user authentication
ALTER TABLE dishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;

-- Create policies (allow all for now, can be restricted later)
CREATE POLICY "Allow all operations on dishes" ON dishes FOR ALL USING (true);
CREATE POLICY "Allow all operations on menu_items" ON menu_items FOR ALL USING (true);
CREATE POLICY "Allow all operations on shopping_lists" ON shopping_lists FOR ALL USING (true);
CREATE POLICY "Allow all operations on recipes" ON recipes FOR ALL USING (true);

-- Create a view for menu with dish details
CREATE OR REPLACE VIEW menu_with_dishes AS
SELECT 
    mi.id,
    mi.planned_date,
    mi.meal_type,
    mi.status,
    mi.servings,
    mi.notes,
    mi.created_at,
    d.name as dish_name,
    d.category as dish_category,
    d.cooking_time as dish_cooking_time,
    d.ingredients as dish_ingredients,
    d.difficulty as dish_difficulty
FROM menu_items mi
JOIN dishes d ON mi.dish_id = d.id
ORDER BY mi.planned_date, 
    CASE mi.meal_type 
        WHEN 'breakfast' THEN 1 
        WHEN 'lunch' THEN 2 
        WHEN 'dinner' THEN 3 
        ELSE 4 
    END;