import { useState, useEffect, useCallback } from 'react';
import RecipeCard from './RecipeCard';
import RecipeDetails from './RecipeDetails';
import { Modal } from 'react-bootstrap';
import './MenuDisplay.css';
import { ActionButton } from '../ActionButtons';

type RecipeApiResponse = {
    id: number;
    title: string;
    description: string;
    image_url: string;
};

type MenuDisplayProps = {
    recipes: RecipeApiResponse[];
    onBackToQuestions: () => void;
    onShowShoppingList: () => void;
    onShowRecipeList: () => void;
    onSaveMenu: () => void; 
    onRecreateMenu: () => void; 
    updateActionButtons: (buttons: ActionButton[]) => void;
};

export function MenuDisplay({ recipes, onBackToQuestions, onShowShoppingList, onShowRecipeList, onSaveMenu, onRecreateMenu, updateActionButtons }: MenuDisplayProps) {
    const [selectedRecipeId, setSelectedRecipeId] = useState<number | null>(null);
    const [showModal, setShowModal] = useState(false);

    const handleBackToQuestions = useCallback(() => {
        updateActionButtons([]); // Очищаем кнопки
        onBackToQuestions(); // Выполняем основное действие
    }, [updateActionButtons, onBackToQuestions]);

    useEffect(() => {
        const token = localStorage.getItem('access_token');
        const actionButtons: ActionButton[] = [
            { text: 'Shopping List', action: onShowShoppingList },
            { text: 'Start Cooking', action: onShowRecipeList },
            ...(token ? [{ text: 'Save Menu', action: onSaveMenu }] : []),
            { text: 'Re-create Menu', action: onRecreateMenu },
            { text: 'Back to Questions', action: handleBackToQuestions }
        ];
        updateActionButtons(actionButtons);
    }, [onShowShoppingList, onShowRecipeList, onSaveMenu, onRecreateMenu, handleBackToQuestions, updateActionButtons]);

    const handleCardClick = (recipeId: number) => {
        setSelectedRecipeId(recipeId);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setSelectedRecipeId(null);
    };

    console.log("Rendering recipes:", recipes);
    const token = localStorage.getItem('access_token');
    if (recipes.length === 0) {
        return <div>No recipes to display</div>; 
    }
    
    return (
        <>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '20px' }}>
                {recipes.map((recipe, index) => (
                    <RecipeCard 
                        key={index} 
                        image={recipe.image_url} 
                        title={recipe.title} 
                        description={recipe.description} 
                        onClick={() => handleCardClick(recipe.id)}
                    />
                ))}
            </div>
            {selectedRecipeId !== null && (
                <Modal show={showModal} onHide={handleCloseModal} dialogClassName="modal-90w">
                    <Modal.Header closeButton>
                        <Modal.Title>Recipe Details</Modal.Title>
                    </Modal.Header>
                    <Modal.Body className="custom-modal-body"> 
                        <RecipeDetails recipeId={selectedRecipeId} />
                    </Modal.Body>
                </Modal>
            )}
        </>
    );
}
