import { useState, useEffect } from "react";

export type SubCategoryData = { id: string; name: string; categoryId: string };
export type CategoryData = { id: string; name: string; subCategories: SubCategoryData[] };

export function useCategories() {
    const [categoriesData, setCategoriesData] = useState<CategoryData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/categories")
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setCategoriesData(data);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to fetch categories", err);
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
