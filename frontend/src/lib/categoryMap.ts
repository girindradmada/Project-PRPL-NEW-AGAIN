export const categoryMap: Record<string, number> = {
  "Food & Dining": 1,
  "Transportation": 2,
  "Shopping": 3,
  "Bills & Utilities": 4,
  "Income": 5,
  "Other": 6,
};

export function getCategoryId(category: string) {
  return categoryMap[category] ?? 6;
}

// Add this for reverse mapping
export function getCategoryName(id: number): string {
  return Object.keys(categoryMap).find(key => categoryMap[key] === id) ?? "Other";
}