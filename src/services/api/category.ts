const API_BASE = "http://localhost:3000/api";

export interface Category {
  id: string;
  name: string;
  description?: string;
  status?: string;
}

export interface Character {
  id: string;
  name: string;
  description?: string;
  image?: string;
  category_id: string;
}

export async function fetchCategories(): Promise<Category[]> {
  try {
    const response = await fetch(`${API_BASE}/category`);
    if (!response.ok) {
      throw new Error(`Failed to fetch categories: ${response.statusText}`);
    }
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
}

export async function fetchCategoryById(id: string): Promise<Category | null> {
  try {
    const response = await fetch(`${API_BASE}/category/${id}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch category: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching category ${id}:`, error);
    return null;
  }
}

export async function fetchCharactersByCategory(
  categoryId: string
): Promise<Character[]> {
  try {
    const response = await fetch(
      `${API_BASE}/character/category/${categoryId}`
    );
    if (!response.ok) {
      throw new Error(`Failed to fetch characters: ${response.statusText}`);
    }
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error(
      `Error fetching characters for category ${categoryId}:`,
      error
    );
    return [];
  }
}

export async function fetchRandomCharacterByCategory(
  categoryId: string
): Promise<Character | null> {
  try {
    const response = await fetch(`${API_BASE}/character/random/${categoryId}`);
    if (!response.ok) {
      throw new Error(
        `Failed to fetch random character: ${response.statusText}`
      );
    }
    return await response.json();
  } catch (error) {
    console.error(
      `Error fetching random character for category ${categoryId}:`,
      error
    );
    return null;
  }
}
