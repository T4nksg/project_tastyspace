import { useEffect } from 'react';
import RecipeDetails from './RecipeDetails';
import './RecipeList.css';
import { ActionButton } from '../ActionButtons';

type RecipeListProps = {
    recipeIds: number[];
    onBackToMenu: () => void;
    updateActionButtons: (buttons: ActionButton[]) => void;
};

export default function RecipeList({ recipeIds, onBackToMenu, updateActionButtons }: RecipeListProps) {
    useEffect(() => {
        updateActionButtons([
            { text: 'Back to Menu', action: onBackToMenu }
        ]);
    }, [updateActionButtons, onBackToMenu]);

    return (
        <div className="recipe-list">
            {recipeIds.map((recipeId) => (
                <RecipeDetails key={recipeId} recipeId={recipeId} />
            ))}
        </div>
    );
}