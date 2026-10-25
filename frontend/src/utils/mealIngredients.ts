interface InventoryIngredient {
  food_name: string;
}

interface IngredientSource {
  primary_ingredients?: string | null;
  supporting_ingredients?: string | null;
  spices_seasonings?: string | null;
  optional_ingredients?: string | null;
  ingredients?: Array<{
    ingredient_id: string;
    ingredient_name: string;
    essential?: boolean;
    sinhala_name?: string | null;
    tamil_name?: string | null;
    aliases?: string | null;
    ingredient_role?: string | null;
  }> | null;
}

export interface MealIngredient {
  id?: string;
  name: string;
  optional: boolean;
  sinhalaName?: string;
  tamilName?: string;
  aliases?: string[];
}

const normalizeIngredient = (name: string): string => {
  const normalized = name
    .trim()
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .replace(/\s+/g, ' ');

  if (normalized.endsWith('ies')) {
    return `${normalized.slice(0, -3)}y`;
  }
  if (normalized.endsWith('ves')) {
    return `${normalized.slice(0, -3)}f`;
  }
  if (normalized.endsWith('oes')) {
    return normalized.slice(0, -2);
  }
  if (normalized.endsWith('s') && !normalized.endsWith('ss')) {
    return normalized.slice(0, -1);
  }
  return normalized;
};

export const getMealIngredients = (meal: IngredientSource): MealIngredient[] => {
  const optionalNames = new Set(
    (meal.optional_ingredients ?? '')
      .split(/[,;]/)
      .map(normalizeIngredient)
      .filter(Boolean),
  );

  if (meal.ingredients?.length) {
    const uniqueIngredients = new Map<string, MealIngredient>();
    meal.ingredients.forEach((ingredient) => {
      const normalizedName = normalizeIngredient(ingredient.ingredient_name);
      if (!normalizedName || uniqueIngredients.has(normalizedName)) return;
      uniqueIngredients.set(normalizedName, {
        id: ingredient.ingredient_id,
        name: ingredient.ingredient_name,
        optional: optionalNames.has(normalizedName),
        sinhalaName: ingredient.sinhala_name || undefined,
        tamilName: ingredient.tamil_name || undefined,
        aliases: ingredient.aliases?.split(';').map((alias) => alias.trim()).filter(Boolean),
      });
    });
    return [...uniqueIngredients.values()];
  }

  const ingredients = new Map<string, MealIngredient>();
  const addIngredients = (value: string | null | undefined, optional: boolean) => {
    value?.split(/[,;]/).forEach((part) => {
      const name = part.trim();
      const normalized = normalizeIngredient(name);
      if (normalized && !ingredients.has(normalized)) {
        ingredients.set(normalized, { name, optional });
      }
    });
  };

  addIngredients(meal.primary_ingredients, false);
  addIngredients(meal.supporting_ingredients, false);
  addIngredients(meal.spices_seasonings, false);
  addIngredients(meal.optional_ingredients, true);

  return [...ingredients.values()];
};

export const isIngredientInInventory = (
  ingredient: string | MealIngredient,
  inventory: InventoryIngredient[],
): boolean => {
  const candidates = typeof ingredient === 'string'
    ? [ingredient]
    : [
        ingredient.name,
        ingredient.sinhalaName ?? '',
        ingredient.tamilName ?? '',
        ...(ingredient.aliases ?? []),
      ];
  const normalizedCandidates = candidates.map(normalizeIngredient).filter(Boolean);
  return inventory.some((item) => {
    const normalizedInventoryItem = normalizeIngredient(item.food_name);
    return normalizedCandidates.some((normalizedIngredient) =>
      normalizedInventoryItem === normalizedIngredient
      || normalizedInventoryItem.startsWith(`${normalizedIngredient} `)
      || normalizedInventoryItem.endsWith(` ${normalizedIngredient}`)
      || normalizedInventoryItem.includes(` ${normalizedIngredient} `)
      || normalizedIngredient.startsWith(`${normalizedInventoryItem} `)
      || normalizedIngredient.endsWith(` ${normalizedInventoryItem}`)
      || normalizedIngredient.includes(` ${normalizedInventoryItem} `),
    );
  });
};

export const getLocalizedIngredientName = (
  ingredient: MealIngredient,
  language: 'en' | 'si' | 'ta',
): string => {
  if (language === 'si' && ingredient.sinhalaName) return ingredient.sinhalaName;
  if (language === 'ta' && ingredient.tamilName) return ingredient.tamilName;
  return ingredient.name;
};

export const getMealInventoryStatus = (
  ingredients: MealIngredient[],
  inventory: InventoryIngredient[],
): 'all' | 'partial' | 'missing' | null => {
  const requiredIngredients = ingredients.filter((ingredient) => !ingredient.optional);
  if (requiredIngredients.length === 0) {
    return ingredients.length > 0 ? 'all' : null;
  }

  const availableCount = requiredIngredients.filter((ingredient) =>
    isIngredientInInventory(ingredient, inventory),
  ).length;

  if (availableCount === requiredIngredients.length) return 'all';
  return availableCount > 0 ? 'partial' : 'missing';
};
