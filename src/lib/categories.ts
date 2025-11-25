import { query } from "./db";

export const defaultCategories = [
  { name: "Alimentación", icon: "🍔", type: "expense" },
  { name: "Transporte", icon: "🚗", type: "expense" },
  { name: "Entretenimiento", icon: "🎮", type: "expense" },
  { name: "Hogar", icon: "🏠", type: "expense" },
  { name: "Salud", icon: "💊", type: "expense" },
  { name: "Educación", icon: "📚", type: "expense" },
  { name: "Salario", icon: "💰", type: "income" },
  { name: "Otros", icon: "📝", type: "expense" },
];

export async function ensureCategories(userId: string) {
  const existingResult = await query(
    `SELECT name FROM financial_categories WHERE user_id = $1`,
    [userId]
  );
  const existingNames = new Set(
    existingResult.rows.map((row: any) => row.name)
  );

  for (const cat of defaultCategories) {
    if (!existingNames.has(cat.name)) {
      await query(
        `INSERT INTO financial_categories (user_id, name, icon, type, budget) VALUES ($1, $2, $3, $4, 0)`,
        [userId, cat.name, cat.icon, cat.type]
      );
    }
  }
}
