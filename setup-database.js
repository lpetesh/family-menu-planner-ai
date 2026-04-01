// Database setup script for Supabase
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://pgfqfszlrvexrpehdyyk.supabase.co'
const supabaseKey = 'sb_publishable_k7QTpbacFkKyu12pVaPAmQ_54X4yiLq'
const supabase = createClient(supabaseUrl, supabaseKey)

async function setupDatabase() {
  console.log('🔧 Setting up database...')
  
  try {
    // Create dishes table
    const { data: dishesTable, error: dishesError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS dishes (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          category VARCHAR(50) NOT NULL CHECK (category IN ('protein', 'side', 'vegetable', 'dessert')),
          ingredients JSONB DEFAULT '[]',
          cooking_time INTEGER DEFAULT 30,
          difficulty VARCHAR(20) DEFAULT 'medium',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    })

    if (dishesError) {
      console.log('❌ Error creating dishes table:', dishesError)
    } else {
      console.log('✅ Dishes table created')
    }

    // Insert sample dishes
    const sampleDishes = [
      {
        name: 'Борщ український',
        category: 'protein',
        ingredients: ['буряк', 'капуста', 'морква', "м'ясо", 'цибуля'],
        cooking_time: 90
      },
      {
        name: 'Картопля відварна',
        category: 'side', 
        ingredients: ['картопля', 'сіль', 'кріп'],
        cooking_time: 25
      },
      {
        name: 'Салат з огірків',
        category: 'vegetable',
        ingredients: ['огірки', 'кріп', 'сметана'],
        cooking_time: 10
      }
    ]

    for (const dish of sampleDishes) {
      const { data, error } = await supabase
        .from('dishes')
        .insert([dish])
        .select()
      
      if (error) {
        console.log('❌ Error inserting dish:', error)
      } else {
        console.log('✅ Dish added:', dish.name)
      }
    }

  } catch (error) {
    console.error('❌ Setup error:', error)
  }
}

// Run setup
setupDatabase()