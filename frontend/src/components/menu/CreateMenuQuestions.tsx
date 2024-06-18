import { useState, useEffect, useCallback } from 'react';
import { MenuDisplay } from './MenuDisplay';
import ShoppingList from './ShoppingList';
import RecipeList from './RecipeList';
import SaveMenuModal from './SaveMenuModal'; // Импортируем компонент модального окна
import { ActionButton } from '../ActionButtons';
import './CreateMenuQuestions.css';

const BACKEND_URL = "http://localhost:5000";

const categoryMap: Record<string, string> = {
    'Weeknight dinner': 'weeknight',
    'Family dinner': 'family',
    'Guest dinner': 'guest',
    'Festive dinner': 'festive',
    'Romantic dinner': 'romantic'
};

const timeMap: Record<string, string> = {
    'As soon as possible': 'now',
    'This evening': 'today',
    'Today but not right now': 'today',
    'Tomorrow or later': 'tomorrow',
    'Tomorrow': 'tomorrow',
    'In 2 days or later': 'later'
};

const cookingTimeMap: Record<string, number> = {
    'No more than an hour': 1,
    'I\'d like to finish it in 2 hours': 2,
    'About 3-4 hours is fine for me': 3,
    'It doesn\'t matter. The main thing is delicious dinner': 4
};

type RecipeApiResponse = {
    id: number;
    title: string;
    description: string;
    image_url: string;
    author_id: number;
    type: string;
    side_dish: boolean;
    category: string;
    cuisine: string;
    season: string;
    cooking_time: number;
    dinner_time: string;
    created: string;
    edited: string;
    is_moderated: boolean;
};

export type RecipeDetails = {
    id: number;
    title: string;
    steps: { index: number; description: string }[];
    ingredients: { name: string; amount: number; measurement: string }[];
    image_url: string;
};

type CreateMenuQuestionsProps = {
    onClose: () => void;
    setCurrentComponent: (component: JSX.Element | null) => void;
    updateActionButtons: (buttons: ActionButton[]) => void;
};

export default function CreateMenuQuestions({ onClose, setCurrentComponent, updateActionButtons }: CreateMenuQuestionsProps) {
    const [dinnerCategory, setDinnerCategory] = useState<string>('');
    const [dinnerTime, setDinnerTime] = useState<string>('');
    const [cookingTime, setCookingTime] = useState<string>('');
    const [dinnerTimeOptions, setDinnerTimeOptions] = useState<string[]>([]);
    const [cookingTimeOptions, setCookingTimeOptions] = useState<string[]>([]);
    const [recipes, setRecipes] = useState<RecipeApiResponse[]>([]);
    const [recipeIds, setRecipeIds] = useState<number[]>([]);
    const [showQuestions, setShowQuestions] = useState(true);
    const [showShoppingList, setShowShoppingList] = useState(false);
    const [showRecipeList, setShowRecipeList] = useState(false);
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [currentStep, setCurrentStep] = useState<number>(0);

    const resetQuestions = () => {
        setDinnerCategory('');
        setDinnerTime('');
        setCookingTime('');
        setDinnerTimeOptions([]);
        setCookingTimeOptions([]);
        setRecipes([]);
        setRecipeIds([]);
        setShowQuestions(true);
        setShowShoppingList(false);
        setShowRecipeList(false);
        setCurrentStep(0);
        console.log("Questions reset");
    };

    useEffect(() => {
        switch (dinnerCategory) {
            case 'Weeknight dinner':
                setDinnerTimeOptions(['As soon as possible', 'Today but not right now', 'Tomorrow or later']);
                break;
            case 'Family dinner':
                setDinnerTimeOptions(['As soon as possible', 'Today but not right now', 'Tomorrow or later']);
                break;
            case 'Guest dinner':
            case 'Romantic dinner':
                setDinnerTimeOptions(['This evening', 'Tomorrow', 'In 2 days or later']);
                break;
            case 'Festive dinner':
                setDinnerTimeOptions(['Tomorrow', 'In 2 days or later']);
                break;
            default:
                setDinnerTimeOptions([]);
        }
    }, [dinnerCategory]);

    useEffect(() => {
        if (dinnerCategory === 'Weeknight dinner' && dinnerTime === 'As soon as possible') {
            setCookingTimeOptions([]);
            setCookingTime('No more than an hour');
        } else if (dinnerCategory === 'Weeknight dinner' && (dinnerTime === 'Today but not right now' || dinnerTime === 'Tomorrow or later')) {
            setCookingTimeOptions(['No more than an hour', 'I\'d like to finish it in 2 hours']);
        } else if (dinnerCategory === 'Family dinner' && dinnerTime === 'Today but not right now') {
            setCookingTimeOptions(['I\'d like to finish it in 2 hours', 'About 3-4 hours is fine for me']);
        } else if (dinnerCategory === 'Family dinner' && dinnerTime === 'As soon as possible') {
            setCookingTimeOptions([]);
            setCookingTime('I\'d like to finish it in 2 hours');
        } else if (dinnerCategory === 'Family dinner' && (dinnerTime === 'Tomorrow or later')) {
            setCookingTimeOptions(['I\'d like to finish it in 2 hours', 'About 3-4 hours is fine for me', 'It doesn\'t matter. The main thing is delicious dinner']);
        } else if ((dinnerCategory === 'Guest dinner' || dinnerCategory === 'Romantic dinner') && dinnerTime === 'This evening') {
            setCookingTimeOptions(['I\'d like to finish it in 2 hours', 'About 3-4 hours is fine for me']);
        } else if ((dinnerCategory === 'Guest dinner' || dinnerCategory === 'Romantic dinner') && (dinnerTime === 'Tomorrow' || dinnerTime === 'In 2 days or later')) {
            setCookingTimeOptions(['I\'d like to finish it in 2 hours', 'About 3-4 hours is fine for me', 'It doesn\'t matter. The main thing is delicious dinner']);
        } else if (dinnerCategory === 'Festive dinner' && (dinnerTime === 'Tomorrow' || dinnerTime === 'In 2 days or later')) {
            setCookingTimeOptions(['About 3-4 hours is fine for me', 'It doesn\'t matter. The main thing is delicious dinner']);
        } else {
            setCookingTimeOptions([]);
        }
    }, [dinnerCategory, dinnerTime]);

    useEffect(() => {
        if (dinnerCategory !== '' && dinnerTime !== '' && cookingTime !== '') {
            createMenu();
        }
    }, [dinnerCategory, dinnerTime, cookingTime]);

    const createMenu = () => {
        const token = localStorage.getItem('access_token');
        const mappedCategory: string = categoryMap[dinnerCategory];
        const mappedTime: string = timeMap[dinnerTime];
        const mappedCookingTime: number = cookingTimeMap[cookingTime];

        fetch(`${BACKEND_URL}/createMenu`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
            body: JSON.stringify({
                dinnerCategory: mappedCategory,
                dinnerTime: mappedTime,
                cookingTime: mappedCookingTime
            })
        })
            .then(response => {
                if (response.ok) {
                    return response.json().then(data => {
                        const formattedRecipes: RecipeApiResponse[] = data.map((recipe: RecipeApiResponse) => ({
                            ...recipe,
                            image_url: `/images/${recipe.image_url}`
                        }));
                        setRecipes(formattedRecipes);
                        setRecipeIds(data.map((recipe: RecipeApiResponse) => recipe.id));
                        setShowQuestions(false);
                        console.log("Menu created successfully, recipes set:", formattedRecipes);

                        const actionButtons: ActionButton[] = [
                            { text: 'Shopping List', action: handleShowShoppingList },
                            { text: 'Start Cooking', action: handleShowRecipeList },
                            ...(token ? [{ text: 'Save Menu', action: handleSaveMenu }] : []),
                            { text: 'Re-create Menu', action: handleRecreateMenu },
                            { text: 'Back to Questions', action: resetQuestions }
                        ];
                        updateActionButtons(actionButtons);
                    });
                } else {
                    return response.json().then(data => {
                        console.error('Failed to create menu:', data);
                    });
                }
            })
            .catch(error => {
                console.error('Error submitting menu:', error);
            });
    };

    const handleShowShoppingList = useCallback(() => {
        setShowShoppingList(true);
        setShowQuestions(false);
        setShowRecipeList(false);
        setShowSaveModal(false);
    }, []);

    const handleShowRecipeList = useCallback(() => {
        setShowRecipeList(true);
        setShowQuestions(false);
        setShowShoppingList(false);
        setShowSaveModal(false);
    }, []);

    const handleSaveMenu = useCallback(() => {
        setShowSaveModal(true); // Показываем модальное окно
        console.log("Save menu modal opened");
    }, []);

    const handleRecreateMenu = () => {
        createMenu();
    };

    const handleNextStep = () => {
        setCurrentStep(prevStep => prevStep + 1);
    };

    return (
        <div className="create-menu-container">
            {showQuestions && (
                <>
                    {currentStep === 0 && (
                        <div className="question-card common-card">
                            <div>
                                <h4>Choose type of dinner:</h4>
                                {['Weeknight dinner', 'Family dinner', 'Guest dinner', 'Festive dinner', 'Romantic dinner'].map((category, index) => (
                                    <div key={index}>
                                        <label>
                                            <input
                                                type="radio"
                                                name="dinnerCategory"
                                                value={category}
                                                onChange={(e) => {
                                                    setDinnerCategory(e.target.value);
                                                    handleNextStep(); // Переход к следующему шагу
                                                }}
                                                checked={dinnerCategory === category}
                                            /> {category}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    {currentStep === 1 && dinnerTimeOptions.length > 0 && (
                        <div className="question-card common-card">
                            <div>
                                <h4>When are you planning dinner?</h4>
                                {dinnerTimeOptions.map((time, index) => (
                                    <div key={index}>
                                        <label>
                                            <input
                                                type="radio"
                                                name="dinnerTime"
                                                value={time}
                                                onChange={(e) => {
                                                    setDinnerTime(e.target.value);
                                                    handleNextStep(); // Переход к следующему шагу
                                                }}
                                                checked={dinnerTime === time}
                                            /> {time}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    {currentStep === 2 && cookingTimeOptions.length > 0 && (
                        <div className="question-card common-card">
                            <div>
                                <h4>How much time do you expect to spend on cooking?</h4>
                                {cookingTimeOptions.map((time, index) => (
                                    <div key={index}>
                                        <label>
                                            <input
                                                type="radio"
                                                name="cookingTime"
                                                value={time}
                                                onChange={(e) => setCookingTime(e.target.value)}
                                                checked={cookingTime === time}
                                            /> {time}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}
            {!showQuestions && !showShoppingList && !showRecipeList &&
                <MenuDisplay
                    recipes={recipes}
                    onBackToQuestions={resetQuestions}
                    onShowShoppingList={handleShowShoppingList}
                    onShowRecipeList={handleShowRecipeList}
                    onSaveMenu={handleSaveMenu}
                    onRecreateMenu={handleRecreateMenu}
                    updateActionButtons={updateActionButtons}
                />
            }
            {showShoppingList &&
                <ShoppingList
                    recipeIds={recipeIds}
                    onBackToMenu={() => setShowShoppingList(false)}
                    updateActionButtons={updateActionButtons}
                />
            }
            {showRecipeList &&
                <RecipeList
                    recipeIds={recipeIds}
                    onBackToMenu={() => setShowRecipeList(false)}
                    updateActionButtons={updateActionButtons}
                />
            }
            {showSaveModal &&
                <SaveMenuModal
                    show={showSaveModal}
                    onClose={() => setShowSaveModal(false)}
                    recipeIds={recipeIds}
                    dinnerCategory={dinnerCategory}
                    dinnerTime={dinnerTime}
                    cookingTime={cookingTime}
                    categoryMap={categoryMap}
                    timeMap={timeMap}
                    cookingTimeMap={cookingTimeMap}
                />
            }
        </div>
    );
}
