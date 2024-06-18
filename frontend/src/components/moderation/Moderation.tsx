import { useState, useEffect } from 'react';
import { ActionButton } from '../ActionButtons';
import { Modal } from 'react-bootstrap'; 
import './Moderation.css';

export type Ingredient = {
    index: number;
    name: string;
    amount: string;
    measurement: string;
    category?: string; 
    isMain?: boolean;
};

export type Step = {
    index: number;
    description: string;
};

export type Recipe = {
    id: number;
    title: string;
    description?: string;
    image_url?: string;
    ingredients: Ingredient[];
    steps: Step[];
};

type ModerationProps = {
    recipe: Recipe;
    onUpdate: (recipe: Recipe) => void;
    onRejectRecipe: () => void;
    onBackToList: () => void;
    onPublish: (moderationData: ModerationData) => void;
    updateActionButtons: (buttons: ActionButton[]) => void;
    showSuccessModal: () => void;
};

export type ModerationData = {
    dishType: string;
    needSideDish: boolean;
    cuisine: string;
    cookingTime: number;
    seasons: string;
    dinnerTimes: string;
    dinnerCategories: string;
};

const cookingTimes = [
    { label: "Hour or less", value: 1 },
    { label: "2 hours", value: 2 },
    { label: "3-4 hours", value: 3 },
    { label: "More than 4 hours", value: 4 }
];

const measurementOptions = ["", "cup", "tbsp", "tsp", "ml", "l", "g", "kg"];

export default function Moderation({ 
    recipe,
    onUpdate,
    onRejectRecipe,
    onBackToList,
    onPublish,
    updateActionButtons,
    showSuccessModal
}: ModerationProps) {
    const [editedRecipe, setEditedRecipe] = useState<Recipe>(recipe);
    const [imageUrl, setImageUrl] = useState<string>(recipe.image_url || 'default_img.jpg'); 
    const [dishType, setDishType] = useState<string>('');
    const [cuisine, setCuisine] = useState<string[]>([]);
    const [cookingTime, setCookingTime] = useState<number | null>(null);
    const [seasons, setSeasons] = useState<string[]>([]);
    const [dinnerTimes, setDinnerTimes] = useState<string[]>([]);
    const [dinnerCategories, setDinnerCategories] = useState<string[]>([]);
    const [needSideDish, setNeedSideDish] = useState<string>(''); 
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        setEditedRecipe(recipe);
    }, [recipe]);

    useEffect(() => {
        const actionButtons: ActionButton[] = [
            { text: 'Publish Recipe', action: handlePublish },
            { text: 'Reject Recipe', action: handleRejectRecipe },
            { text: 'Back to the List', action: onBackToList }
        ];
        updateActionButtons(actionButtons);
    }, [editedRecipe, dishType, cuisine, cookingTime, seasons, dinnerTimes, dinnerCategories, needSideDish, onUpdate, onBackToList, updateActionButtons]);

    const handleRejectRecipe = () => {
        onRejectRecipe();
        updateActionButtons([]); // Очистить кнопки после отклонения рецепта
    };

    const handleChangeBasicInfo = (field: keyof Recipe, value: string) => {
        setEditedRecipe(prev => ({ ...prev, [field]: value }));
        console.log(`Updated ${field}:`, value);
    };

    const handleChangeIngredient = (index: number, field: keyof Ingredient, value: string) => {
        setEditedRecipe(prev => {
            const newIngredients = [...prev.ingredients];
            newIngredients[index] = { ...newIngredients[index], [field]: value };
            return { ...prev, ingredients: newIngredients };
        });
        console.log(`Updated ingredient ${index} ${field}:`, value);
    };

    const handleChangeStep = (index: number, description: string) => {
        setEditedRecipe(prev => {
            const newSteps = [...prev.steps];
            newSteps[index] = { ...newSteps[index], description: description };
            return { ...prev, steps: newSteps };
        });
        console.log(`Updated step ${index}:`, description);
    };

    const handleCategoryChange = (index: number, value: string) => {
        setEditedRecipe(prev => {
            const newIngredients = [...prev.ingredients];
            newIngredients[index] = { ...newIngredients[index], category: value.toLowerCase() };
            return { ...prev, ingredients: newIngredients };
        });
        console.log(`Modifying category for ingredient ${index}:`, value);
    };

    const handleIsMainChange = (index: number, checked: boolean) => {
        setEditedRecipe(prev => {
            const newIngredients = [...prev.ingredients];
            newIngredients[index] = { ...newIngredients[index], isMain: checked };
            return { ...prev, ingredients: newIngredients };
        });
        console.log(`Modifying isMain for ingredient ${index}:`, checked);
    };

    const handleRadioChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = event.target; 
        switch (name) {
            case 'dishType':
                setDishType(value);
                break;
            case 'cuisine':
                setCuisine([value]);
                break;
            case 'cookingTime':
                setCookingTime(Number(value));
                break;
            case 'needSideDish':
                setNeedSideDish(value);
                break;
            default:
                break;
        }

        const labels = document.querySelectorAll(`.moderation-card label`);
        labels.forEach(label => {
            if (label.querySelector(`input[name="${name}"]`)) {
                label.classList.remove('selected');
            }
        });

        event.target.parentElement?.classList.add('selected');
    };

    const handleCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<string[]>>) => {
        if (event.target.checked) {
            setter(prev => [...prev, event.target.value]);
        } else {
            setter(prev => prev.filter(val => val !== event.target.value));
        }

        event.target.parentElement?.classList.toggle('selected', event.target.checked);
    };

    const toggleSelect = (e: React.MouseEvent<HTMLLabelElement>) => {
        e.currentTarget.classList.toggle('selected');
    }

    const handlePublish = () => {
        const hasCategory = editedRecipe.ingredients.every(ingredient => ingredient.category);
        const hasMainIngredient = editedRecipe.ingredients.some(ingredient => ingredient.isMain);
    
        if (!dishType || !cuisine.length || !seasons.length || !dinnerTimes.length || !dinnerCategories.length || !hasCategory || !hasMainIngredient) {
            // Сохраняем изменения и дату редактирования
            onUpdate(editedRecipe);
            console.log('Publishing recipe with data:', editedRecipe);
            setShowModal(true);
            return;
        }
    
        const moderationData: ModerationData = {
            dishType: dishType,
            needSideDish: needSideDish === 'yes',
            cuisine: cuisine.join(', '),
            cookingTime: cookingTime!,
            seasons: seasons.join(', '),
            dinnerTimes: dinnerTimes.join(', '),
            dinnerCategories: dinnerCategories.join(', ')
        };
    
        onPublish(moderationData);
        showSuccessModal();
        onBackToList();
    };

    const handleCloseModal = () => setShowModal(false);

    return (
        <div>
            <h3 className="text-center common-header">Recipe Editing</h3>
            <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                <div style={{ flex: '1' }}>
                    <input
                        type="text"
                        value={editedRecipe.title}
                        onChange={(e) => handleChangeBasicInfo('title', e.target.value)}
                        className="moderation-form-control"
                        style={{ width: '100%', marginBottom: '10px' }}
                    />
                    <textarea
                        value={editedRecipe.description || ''}
                        onChange={(e) => handleChangeBasicInfo('description', e.target.value)}
                        className="moderation-form-control moderation-description"
                        style={{ width: '100%', marginBottom: '10px' }}
                    />
                </div>
                <img src={`/images/${imageUrl}`} alt={editedRecipe.title} className="moderation-image" />
            </div>
            <div style={{ flex: '1', marginTop: '20px' }}>
                <h4>Ingredients</h4>
                {editedRecipe.ingredients.map((ingredient, index) => (
                    <div key={index} className="mb-3">
                        <div className="d-flex align-items-center">
                            <input
                                type="text"
                                value={ingredient.name}
                                onChange={(e) => handleChangeIngredient(index, 'name', e.target.value)}
                                className="moderation-form-control"
                                placeholder="Ingredient name"
                                style={{ width: '425px' }} // Увеличение ширины
                            />
                            <input
                                type="text"
                                value={ingredient.amount}
                                onChange={(e) => handleChangeIngredient(index, 'amount', e.target.value)}
                                className="moderation-form-control mx-2"
                                placeholder="Amount"
                                style={{ width: '100px' }} // Увеличение ширины
                            />
                            <select
                                value={ingredient.measurement}
                                onChange={(e) => handleChangeIngredient(index, 'measurement', e.target.value)}
                                className="moderation-form-control mx-2"
                                style={{ width: '100px' }} // Увеличение ширины
                            >
                                {measurementOptions.map(option => (
                                    <option key={option} value={option}>{option}</option>
                                ))}
                            </select>
                            <select
                                value={ingredient.category || ''}
                                onChange={(e) => handleCategoryChange(index, e.target.value)}
                                className="moderation-form-control mx-2"
                                style={{ width: '150px' }} // Увеличение ширины
                            >
                                <option value="" disabled>Choose category</option>
                                <option value="meat">Meat</option>
                                <option value="chicken">Chicken</option>
                                <option value="turkey">Turkey</option>
                                <option value="liver">Liver</option>
                                <option value="fish">Fish</option>
                                <option value="seafood">Seafood</option>
                                <option value="deli meats">Deli meats</option>
                                <option value="canned fish">Canned fish</option>
                                <option value="cheese">Cheese</option>
                                <option value="dairy">Dairy</option>
                                <option value="eggs">Eggs</option>
                                <option value="mushrooms">Mushrooms</option>
                                <option value="beans">Beans</option>
                                <option value="canned beans">Canned beans</option>
                                <option value="canned goods">Canned goods</option>
                                <option value="pasta">Pasta</option>
                                <option value="rice">Rice</option>
                                <option value="cereal">Cereal</option>
                                <option value="potato">Potato</option>
                                <option value="carrot">Carrot</option>
                                <option value="tomato">Tomato</option>
                                <option value="vegetables">Vegetables</option>
                                <option value="fruits">Fruits</option>
                                <option value="greenery">Greenery</option>
                                <option value="sauces">Sauces</option>
                                <option value="seasoning">Seasoning</option>
                                <option value="sweets">Sweets</option>
                                <option value="dry food">Dry food</option>
                                <option value="baking supplies">Baking supplies</option>
                                <option value="other">Other</option>
                            </select>
                            <label className="mx-2">
                                Is main? <input type="checkbox" checked={!!ingredient.isMain} onChange={(e) => handleIsMainChange(index, e.target.checked)} />
                            </label>
                        </div>
                    </div>
                ))}
                <h4>Instructions</h4>
                {editedRecipe.steps.map((step, index) => (
                    <div key={index} className="mb-3">
                        <textarea
                            value={step.description}
                            onChange={(e) => handleChangeStep(index, e.target.value)}
                            className="moderation-form-control"
                            style={{ width: '100%', marginBottom: '10px' }}
                        />
                    </div>
                ))}
            </div>
            <h3 className="text-center common-header">Moderator Actions</h3>
            <div className="moderation-card-container">
                <div className="moderation-card common-card narrow">
                    <h4>Dish Type:</h4>
                    <small>Choose only one option</small>
                    <div>
                        {['Soup', 'Salad', 'Starter', 'Hot starter', 'Appetizer', 'Main dish', 'Side dish', 'Desert'].map((type, idx) => (
                            <label key={idx} onClick={toggleSelect}>
                                <input type="radio" name="dishType" value={type.toLowerCase()} checked={dishType === type.toLowerCase()} onChange={handleRadioChange} />
                                <span>{type}</span>
                            </label>
                        ))}
                    </div>
                </div>
                <div className="moderation-card common-card narrow">
                    <h4>Need side dish?</h4>
                    <div>
                        <label onClick={toggleSelect}>
                            <input type="radio" name="needSideDish" value="yes" checked={needSideDish === 'yes'} onChange={handleRadioChange} />
                            <span>Yes</span>
                        </label>
                        <label onClick={toggleSelect}>
                            <input type="radio" name="needSideDish" value="no" checked={needSideDish === 'no'} onChange={handleRadioChange} />
                            <span>No</span>
                        </label>
                    </div>
                </div>
                <div className="moderation-card common-card narrow">
                    <h4>Season:</h4>
                    <small>Choose one or more options</small>
                    <div>
                        {['All seasons', 'Winter', 'Autumn', 'Spring', 'Summer'].map((season, idx) => (
                            <label key={idx} onClick={toggleSelect}>
                                <input 
                                    type="checkbox" 
                                    value={season.toLowerCase()} 
                                    checked={seasons.includes(season.toLowerCase())} 
                                    onChange={(e) => handleCheckboxChange(e, setSeasons)} />
                                <span>{season}</span>
                            </label>
                        ))}
                    </div>
                </div>
                <div className="moderation-card common-card narrow">
                    <h4>Dinner time:</h4>
                    <small>Choose one or more options</small>
                    <div>
                        {['Right now', 'Today', 'Tomorrow'].map((time, idx) => (
                            <label key={idx} onClick={toggleSelect}>
                                <input type="checkbox" value={time.split(' ').pop().toLowerCase()} checked={dinnerTimes.includes(time.split(' ').pop().toLowerCase())} onChange={(e) => handleCheckboxChange(e, setDinnerTimes)} />
                                <span>{time}</span>
                            </label>
                        ))}
                    </div>
                </div>
                <div className="moderation-card common-card wide">
                    <h4>Cooking time:</h4>
                    <small>Choose only one option</small>
                    <div>
                        {cookingTimes.map((time) => (
                            <label key={time.value} onClick={toggleSelect}>
                                <input
                                    type="radio"
                                    name="cookingTime"
                                    value={time.value}
                                    checked={cookingTime === time.value}
                                    onChange={handleRadioChange}
                                />
                                <span>{time.label}</span>
                            </label>
                        ))}
                    </div>
                </div>
                <div className="moderation-card common-card wide">
                    <h4>Cuisine:</h4>
                    <small>Choose one or more options</small>
                    <div>
                        {['Universal', 'European', 'Central Asian', 'East Asian', 'Mediterranean', 'Slavic', 'Italian', 'Tex-Mex'].map((cuisineOption, idx) => (
                            <label key={idx} onClick={toggleSelect}>
                                <input
                                    type="checkbox"
                                    value={cuisineOption.toLowerCase()}
                                    checked={cuisine.includes(cuisineOption.toLowerCase())}
                                    onChange={(e) => handleCheckboxChange(e, setCuisine)}
                                />
                                <span>{cuisineOption}</span>
                            </label>
                        ))}
                    </div>
                </div>
                <div className="moderation-card common-card wide">
                    <h4>Dinner category:</h4>
                    <small>Choose one or more options</small>
                    <div>
                        {['Weeknight dinner', 'Family dinner', 'Guest dinner', 'Festive dinner', 'Romantic dinner'].map((category, idx) => (
                            <label key={idx} onClick={toggleSelect}>
                                <input type="checkbox" value={category.split(' ')[0].toLowerCase()} checked={dinnerCategories.includes(category.split(' ')[0].toLowerCase())} onChange={(e) => handleCheckboxChange(e, setDinnerCategories)} />
                                <span>{category}</span>
                            </label>
                        ))}
                    </div>
                </div>
            </div>
            <Modal show={showModal} onHide={handleCloseModal} centered>
                <Modal.Body className="text-center">
                    <p>Please fill out all fields before publishing.</p>
                    <button className="btn btn-recipe-primary" onClick={handleCloseModal}>OK</button>
                </Modal.Body>
            </Modal>
        </div>
    );
}
