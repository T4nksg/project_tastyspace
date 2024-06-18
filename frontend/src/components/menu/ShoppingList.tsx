import { useEffect, useState } from 'react';
import './ShoppingList.css';
import { ActionButton } from '../ActionButtons';

type Ingredient = {
    name: string;
    amount: number;
    measurement: string;
};

type ShoppingListProps = {
    recipeIds: number[];
    onBackToMenu: () => void;
    updateActionButtons: (buttons: ActionButton[]) => void;
};

const BACKEND_URL = "http://localhost:5000";

const categoryOrder = [
    "Meat & Chicken",
    "Fish & Seafood",
    "Deli Meats",
    "Eggs & Dairy",
    "Pasta, Beans & Cereal",
    "Canned Goods",
    "Dry Food",
    "Sweets",
    "Vegetables & Mushrooms",
    "Fruits",
    "Greenery",
    "Sauces",
    "Seasoning",
    "Baking Supplies",
    "Other"
];

export default function ShoppingList({ recipeIds, onBackToMenu, updateActionButtons }: ShoppingListProps) {
    const [aggregatedIngredients, setAggregatedIngredients] = useState<Record<string, Ingredient[]>>({});
    const [checkedIngredients, setCheckedIngredients] = useState<Set<string>>(new Set());

    useEffect(() => {
        const fetchAggregatedIngredients = async () => {
            try {
                const response = await fetch(`${BACKEND_URL}/aggregateIngredients`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                    },
                    body: JSON.stringify({ recipes: recipeIds })
                });

                if (response.ok) {
                    const data: Record<string, Ingredient[]> = await response.json();
                    setAggregatedIngredients(data);
                } else {
                    console.error('Failed to fetch aggregated ingredients');
                }
            } catch (error) {
                console.error('Error fetching aggregated ingredients:', error);
            }
        };

        fetchAggregatedIngredients();
    }, [recipeIds]);

    useEffect(() => {
        updateActionButtons([
            { text: 'Back to Menu', action: onBackToMenu }
        ]);
    }, [updateActionButtons, onBackToMenu]);
    
    const handleCheck = (ingredientName: string) => {
        setCheckedIngredients(prev => {
            const newSet = new Set(prev);
            if (newSet.has(ingredientName)) {
                newSet.delete(ingredientName);
            } else {
                newSet.add(ingredientName);
            }
            return newSet;
        });
    };

    return (
        <div>
            <div className="ingredient-grid">
                {categoryOrder.map((category) => (
                    aggregatedIngredients[category] && (
                        <div key={category} className="ingredient-card common-card">
                            <h3 className="category-title">{category}</h3>
                            <ul className="ingredient-list">
                                {aggregatedIngredients[category].map((ingredient, index) => (
                                    <li key={index} className={`ingredient-item ${checkedIngredients.has(ingredient.name) ? 'checked' : ''}`}>
                                        <input
                                            type="checkbox"
                                            checked={checkedIngredients.has(ingredient.name)}
                                            onChange={() => handleCheck(ingredient.name)}
                                        />
                                        {ingredient.amount} {ingredient.measurement && `${ingredient.measurement} of`} {ingredient.name.toLowerCase()}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )
                ))}
            </div>
        </div> 
    );
}