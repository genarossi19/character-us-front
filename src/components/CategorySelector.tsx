import { useState, useEffect } from "react";
import { fetchCategories, type Category } from "../services/api/category";

interface CategorySelectorProps {
  value: string;
  onChange: (categoryId: string) => void;
  disabled?: boolean;
  showDescription?: boolean;
}

export function CategorySelector({
  value,
  onChange,
  disabled = false,
  showDescription = false,
}: CategorySelectorProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCategories = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchCategories();
        setCategories(data);
        if (data.length > 0 && !value) {
          onChange(data[0].id);
        }
      } catch (err) {
        setError("Error al cargar categorías");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadCategories();
  }, [value, onChange]);

  if (loading) {
    return <span>⏳ Cargando categorías...</span>;
  }

  if (error) {
    return <span style={{ color: "#d32f2f" }}>❌ {error}</span>;
  }

  if (categories.length === 0) {
    return (
      <span style={{ color: "#d32f2f" }}>❌ No hay categorías disponibles</span>
    );
  }

  return (
    <div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        style={{ padding: "8px", borderRadius: "4px" }}
      >
        {categories.map((cat) => (
          <option key={cat.id} value={cat.id}>
            {cat.name}
          </option>
        ))}
      </select>

      {showDescription && value && (
        <div style={{ marginTop: "10px", fontSize: "14px", color: "#666" }}>
          {categories.find((c) => c.id === value)?.description}
        </div>
      )}
    </div>
  );
}
