import type { FoodLanguage } from '../store';

interface LocalizedFood {
  food_name: string;
  food_name_sinhala?: string | null;
  food_name_tamil?: string | null;
}

export const getLocalizedFoodName = (
  food: LocalizedFood,
  language: FoodLanguage,
): string => {
  if (language === 'si' && food.food_name_sinhala?.trim()) {
    return food.food_name_sinhala;
  }
  if (language === 'ta' && food.food_name_tamil?.trim()) {
    return food.food_name_tamil;
  }
  return food.food_name;
};
