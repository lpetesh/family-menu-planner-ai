import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version')
  
  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  try {
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('menu_items')
        .select(`
          *,
          dishes (
            id,
            name,
            category,
            cooking_time
          )
        `)
        .order('planned_date', { ascending: true })

      if (error) throw error
      return res.status(200).json(data || [])
    }

    if (req.method === 'POST') {
      const { dish_id, planned_date, meal_type, status } = req.body
      
      const { data, error } = await supabase
        .from('menu_items')
        .insert([{ 
          dish_id, 
          planned_date, 
          meal_type: meal_type || 'dinner',
          status: status || 'planned'
        }])
        .select()

      if (error) throw error
      return res.status(201).json(data[0])
    }

    if (req.method === 'PUT') {
      const { id } = req.query
      const { status } = req.body
      
      const { data, error } = await supabase
        .from('menu_items')
        .update({ status })
        .eq('id', id)
        .select()

      if (error) throw error
      return res.status(200).json(data[0])
    }

    res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    console.error('Database error:', error)
    res.status(500).json({ error: error.message })
  }
}