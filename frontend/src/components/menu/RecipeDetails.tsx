import { useEffect, useState } from 'react';
import './RecipeDetails.css';

type Ingredient = {
    name: string;
    amount: number;
    measurement: string;
};

type Step = {
    index: number;
    description: string;
};

export type RecipeDetailsProps = {
    recipeId: number;
};

type Recipe = {
    title: string;
    description: string;
    steps: Step[];
    ingredients: Ingredient[];
    image_url: string;
};

const BACKEND_URL = "http://localhost:5000";

export default function RecipeDetails({ recipeId }: RecipeDetailsProps) {
    const [recipe, setRecipe] = useState<Recipe | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRecipeDetails = async () => {
            try {
                const response = await fetch(`${BACKEND_URL}/recipeDetails`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ recipeId })
                });

                if (response.ok) {
                    const data: Recipe = await response.json();
                    data.image_url = `${BACKEND_URL}${data.image_url}`;
                    setRecipe(data);
                } else {
                    const errorData = await response.json();
                    console.error('Failed to fetch recipe details:', errorData);
                }
            } catch (error) {
                console.error('Error fetching recipe details:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchRecipeDetails();
    }, [recipeId]);

    if (loading) {
        return <div>Loading...</div>;
    }

    if (!recipe) {
        return <div>Recipe not found</div>;
    }

    return (
        <div className="recipe-details common-card">
            <div className="recipe-content">
                <div className="recipe-steps">
                    <h3 className="recipe-title">{recipe.title}</h3>
                    <p className="recipe-description">{recipe.description}</p> {/* Добавлено описание */}
                    <ul>
                        {recipe.steps.map(step => (
                            <li key={step.index}>
                                <span>{step.index}. {step.description}</span>
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="divider"></div>
                <div className="recipe-ingredients">
                    <div className="recipe-image">
                        <img src={recipe.image_url} alt={recipe.title} />
                    </div>
                    <ul>
                        {recipe.ingredients.map((ingredient, index) => (
                            <li key={index}>
                                <span>{ingredient.amount} {ingredient.measurement && `${ingredient.measurement} of`} {ingredient.name.toLowerCase()}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
}
