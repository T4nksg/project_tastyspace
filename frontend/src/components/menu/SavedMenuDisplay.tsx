import { useState, useEffect } from 'react';
import RecipeCard from './RecipeCard';
import RecipeDetails from './RecipeDetails';
import { Modal, Button } from 'react-bootstrap';
import './MenuDisplay.css';
import ShoppingList from './ShoppingList';
import RecipeList from './RecipeList';
import { ActionButton } from '../ActionButtons';

type RecipeApiResponse = {
    id: number;
    title: string;
    description: string;
    image_url: string;
    type: string;
};

type SavedMenuDisplayProps = {
    menu: {
        id: number;
        title: string;
        dinner_category: string;
        dinner_time: string;
        cooking_time: string;
        dishes: string;
        saved: string;
        recipes: RecipeApiResponse[];
    };
    onBackToSaved: () => void;
    setCurrentComponent: (component: JSX.Element | null) => void;
    updateActionButtons: (buttons: ActionButton[]) => void;
};

export function SavedMenuDisplay({ menu, onBackToSaved, setCurrentComponent, updateActionButtons }: SavedMenuDisplayProps) {
    const [selectedRecipeId, setSelectedRecipeId] = useState<number | null>(null);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        // Обновляем кнопки действий при монтировании компонента
        updateActionButtons([
            { text: 'Shopping List', action: handleShowShoppingList },
            { text: 'Start Cooking', action: handleShowRecipeList },
            { text: 'Back to Saved Menus', action: onBackToSaved },
        ]);

        return () => {
            // Сбрасываем кнопки действий при размонтировании компонента
            updateActionButtons([]);
        };
    }, []);

    const handleCardClick = (recipeId: number) => {
        setSelectedRecipeId(recipeId);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setSelectedRecipeId(null);
    };

    const handleShowShoppingList = () => {
        setCurrentComponent(
            <ShoppingList
                recipeIds={menu.recipes.map((recipe) => recipe.id)}
                onBackToMenu={() =>
                    setCurrentComponent(
                        <SavedMenuDisplay
                            menu={menu}
                            onBackToSaved={onBackToSaved}
                            setCurrentComponent={setCurrentComponent}
                            updateActionButtons={updateActionButtons}
                        />
                    )
                }
                updateActionButtons={updateActionButtons} // Передаем updateActionButtons
            />
        );
    };

    const handleShowRecipeList = () => {
        setCurrentComponent(
            <RecipeList
                recipeIds={menu.recipes.map((recipe) => recipe.id)}
                onBackToMenu={() =>
                    setCurrentComponent(
                        <SavedMenuDisplay
                            menu={menu}
                            onBackToSaved={onBackToSaved}
                            setCurrentComponent={setCurrentComponent}
                            updateActionButtons={updateActionButtons}
                        />
                    )
                }
                updateActionButtons={updateActionButtons} // Передаем updateActionButtons
            />
        );
    };

    console.log("Rendering saved menu:", menu);
    
    if (menu.recipes.length === 0) {
        return <div>No recipes to display</div>;
    }

    return (
        <>
            <h2>{menu.title}</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '20px' }}>
                {menu.recipes.map((recipe: RecipeApiResponse, index: number) => (
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
                    <Modal.Footer>
                        <Button variant="secondary" onClick={handleCloseModal}>
                            Close
                        </Button>
                    </Modal.Footer>
                </Modal>
            )}
        </>
    );
}
