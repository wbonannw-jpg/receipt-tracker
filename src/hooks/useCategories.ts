import { useState, useEffect } from "react";
import { CATEGORIES as DEFAULT_CATEGORIES, CATEGORY_MAP } from "@/lib/categories";

export type SubCategoryData = { id: string; name: string; categoryId: string };
export type CategoryData = { id: string; name: string; subCategories: SubCategoryData[] };

export function useCategories() {
    const [categoriesData, setCategoriesData] = useState<CategoryData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/categories")
            .then(res => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return res.json();
            })
            .then(data => {
                if (Array.isArray(data) && data.length > 0) {
                    setCategoriesData(data);
                } else {
                    // Fallback to default categories if API returns empty
                    setCategoriesData(buildDefaultCategoryData());
                }
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to fetch categories, using defaults", err);
                // Fallback to default categories on error (e.g. not logged in yet)
                setCategoriesData(buildDefaultCategoryData());
                setLoading(false);
            });
    }, []);

    const CATEGORIES = categoriesData.map(c => c.name);

    const getSubCategories = (categoryName: string): string[] => {
        const cat = categoriesData.find(c => c.name === categoryName);
        return cat ? cat.subCategories.map(sub => sub.name) : [];
    };

    return { CATEGORIES, getSubCategories, loading };
}

/** Build CategoryData[] from the static default list */
function buildDefaultCategoryData(): CategoryData[] {
    return DEFAULT_CATEGORIES.map((name, i) => ({
        id: `default-${i}`,
        name,
        subCategories: (CATEGORY_MAP[name] || []).map((subName, j) => ({
            id: `default-${i}-${j}`,
            name: subName,
            categoryId: `default-${i}`,
        })),
    }));
}
