import React, { useRef, useState } from 'react';
import { Modal } from 'react-bootstrap';
import './AddRecipeForm.css';

const BACKEND_URL = "http://localhost:5000";

type Ingredient = {
    name: string;
    amount: string;
    measurement: string;
};

type Step = {
    description: string;
};

export type RecipeData = {
    title: string;
    description: string;
    ingredients: Ingredient[];
    instructions: Step[];
};

type AddRecipeFormProps = {
    onAddRecipe: (recipeData: RecipeData) => void;
};

export default function AddRecipeForm({ onAddRecipe }: AddRecipeFormProps) {
    const titleRef = useRef<HTMLInputElement>(null);
    const descriptionRef = useRef<HTMLTextAreaElement>(null);
    const [file, setFile] = useState<File | null>(null);
    const [ingredients, setIngredients] = useState<Ingredient[]>([{ name: '', amount: '', measurement: '' }]);
    const [instructions, setInstructions] = useState<Step[]>([{ description: '' }]);
    const [titleError, setTitleError] = useState('');
    const [ingredientError, setIngredientError] = useState('');
    const [instructionError, setInstructionError] = useState('');
    const [amountError, setAmountError] = useState<string[]>([]);
    const [showModal, setShowModal] = useState(false);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            setFile(event.target.files[0]);
        }
    };

    const handleAddIngredient = () => {
        setIngredients([...ingredients, { name: '', amount: '', measurement: '' }]);
        setAmountError([...amountError, '']);
    };

    const handleIngredientChange = (index: number, field: keyof Ingredient, value: string) => {
        const newIngredients = [...ingredients];
        newIngredients[index][field] = value;
        setIngredients(newIngredients);

        if (field === 'amount') {
            handleAmountChange(index, value);
        }
        handleIngredientFieldChange();
    };

    const handleAmountChange = (index: number, value: string) => {
        const newAmountError = [...amountError];
        if (isNaN(Number(value))) {
            newAmountError[index] = 'Please enter a valid amount';
        } else {
            newAmountError[index] = '';
        }
        setAmountError(newAmountError);
    };

    const handleAddStep = () => {
        setInstructions([...instructions, { description: '' }]);
    };

    const handleStepChange = (index: number, value: string) => {
        const newInstructions = [...instructions];
        newInstructions[index].description = value;
        setInstructions(newInstructions);
        handleInstructionFieldChange();
    };

    const checkRecipeTitleExists = async (title: string): Promise<boolean> => {
        const response = await fetch(`${BACKEND_URL}/check_recipe_title`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem('access_token')
            },
            body: JSON.stringify({ title })
        });
        const data = await response.json();
        return data.exists;
    };

    const handleTitleBlur = async () => {
        const title = titleRef.current?.value || "";
        if (!title.trim()) {
            setTitleError('Please enter the recipe title');
            return;
        }

        const titleExists = await checkRecipeTitleExists(title);
        if (titleExists) {
            setTitleError('A recipe with this title already exists');
        } else {
            setTitleError('');
        }
    };

    const handleTitleChange = () => {
        setTitleError('');
    };

    const handleIngredientFieldChange = () => {
        if (ingredients.length > 0 && ingredients.some(ingredient => ingredient.name)) {
            setIngredientError('');
        }
    };

    const handleInstructionFieldChange = () => {
        if (instructions.length > 0 && instructions.some(step => step.description)) {
            setInstructionError('');
        }
    };

    const handleCloseModal = () => setShowModal(false);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const title = titleRef.current?.value;
        const description = descriptionRef.current?.value;

        let hasError = false;

        if (!title) {
            setTitleError('Please enter the recipe title');
            hasError = true;
        } else {
            const titleExists = await checkRecipeTitleExists(title);
            if (titleExists) {
                setTitleError('A recipe with this title already exists');
                hasError = true;
            }
        }

        const hasValidIngredient = ingredients.some(ingredient => ingredient.name.trim() !== '' || ingredient.amount.trim() !== '' || ingredient.measurement.trim() !== '');
        if (!hasValidIngredient) {
            setIngredientError('Please fill out the ingredients');
            hasError = true;
        } else {
            setIngredientError('');
        }

        const hasValidStep = instructions.some(step => step.description.trim() !== '');
        if (!hasValidStep) {
            setInstructionError('Please fill out the cooking instructions');
            hasError = true;
        } else {
            setInstructionError('');
        }

        const hasAmountError = amountError.some(error => error !== '');
        if (hasAmountError) {
            hasError = true;
        }

        if (hasError) {
            return;
        }

        const filteredIngredients = ingredients.filter(ingredient => ingredient.name.trim() !== '' || ingredient.amount.trim() !== '' || ingredient.measurement.trim() !== '');
        const filteredSteps = instructions.filter(step => step.description.trim() !== '');

        const formData = new FormData();
        formData.append('title', title);
        formData.append('description', description);

        filteredIngredients.forEach((ingredient, index) => {
            formData.append(`ingredients[${index}][name]`, ingredient.name);
            formData.append(`ingredients[${index}][amount]`, ingredient.amount);
            formData.append(`ingredients[${index}][measurement]`, ingredient.measurement);
            formData.append(`ingredients[${index}][index]`, index.toString());
        });

        filteredSteps.forEach((step, index) => {
            formData.append(`instructions[${index}][description]`, step.description);
        });

        if (file) {
            formData.append('image', file);
        }

        fetch(BACKEND_URL + '/addRecipe', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('access_token')
            },
            body: formData
        })
            .then(response => response.json())
            .then(data => {
                console.log('Success:', data);
                onAddRecipe(data);
                titleRef.current.value = '';
                descriptionRef.current.value = '';
                setIngredients([{ name: '', amount: '', measurement: '' }]);
                setInstructions([{ description: '' }]);
                setFile(null);
                setShowModal(true); // Показать модальное окно после успешной отправки
            })
            .catch((error) => {
                console.error('Error:', error);
            });
    };

    return (
        <div>
            <h3>Add a New Recipe</h3>
            <form onSubmit={handleSubmit} className="form-group">
                <div className="mb-3">
                    <label htmlFor="title" className="form-label">Title:</label>
                    <input
                        type="text"
                        ref={titleRef}
                        className="form-control"
                        id="title"
                        onBlur={handleTitleBlur}
                        onChange={handleTitleChange}
                    />
                    {titleError && <div className="error-recipe-message">{titleError}</div>}
                </div>
                <div className="mb-3">
                    <label htmlFor="description" className="form-label">Description:</label>
                    <textarea ref={descriptionRef} className="form-control" id="description" />
                </div>
                <div className="mb-3">
                    <label htmlFor="image" className="form-label">Image:</label>
                    <input type="file" onChange={handleFileChange} className="form-control" id="image" />
                </div>
                {ingredients.map((ingredient, index) => (
                    <div key={index} className="mb-3">
                        <div className="d-flex align-items-center">
                            <input
                                type="text"
                                value={ingredient.name}
                                onChange={(e) => handleIngredientChange(index, 'name', e.target.value)}
                                className="form-control"
                                placeholder="Ingredient name"
                            />
                            <input 
                                type="text"
                                value={ingredient.amount}
                                onChange={(e) => handleIngredientChange(index, 'amount', e.target.value)}
                                className="form-control mx-2"
                                placeholder="Amount"
                                style={{ width: '100px' }}
                            />
                            <select
                                value={ingredient.measurement}
                                onChange={(e) => handleIngredientChange(index, 'measurement', e.target.value)}
                                className="form-control mx-2"
                                style={{ width: '100px' }}
                            >
                                <option value="">-</option>
                                <option value="cup">cup</option>
                                <option value="tbsp">tbsp</option>
                                <option value="tsp">tsp</option>
                                <option value="ml">ml</option>
                                <option value="l">l</option>
                                <option value="g">g</option>
                                <option value="kg">kg</option>
                            </select>
                            {index === ingredients.length - 1 && (
                                <button type="button" className="btn btn-recipe-primary" onClick={handleAddIngredient}>Add</button>
                            )}
                        </div>
                        {amountError[index] && <div className="error-recipe-message">{amountError[index]}</div>}
                    </div>
                ))}
                {ingredientError && <div className="error-recipe-message">{ingredientError}</div>}
                {instructions.map((step, index) => (
                    <div key={index} className="mb-3">
                        <label htmlFor={`step-${index}`} className="form-label">{`Step ${index + 1}`}</label>
                        <textarea
                            id={`step-${index}`}
                            className="form-control"
                            value={step.description}
                            onChange={(e) => handleStepChange(index, e.target.value)}
                        />
                    </div>
                ))}
                {instructionError && <div className="error-recipe-message">{instructionError}</div>}
                <div className="mb-3">
                    <button type="button" className="btn btn-recipe-primary" onClick={handleAddStep}>Add Step</button>
                </div>
                <button type="submit" className="btn btn-recipe-primary">Submit Recipe</button>
            </form>
            <Modal show={showModal} onHide={handleCloseModal} centered>
                <Modal.Body className="text-center">
                    <p>Your recipe has been successfully submitted for moderation. It will be available in the application soon. You can continue adding recipes.</p>
                    <button className="btn btn-recipe-primary" onClick={handleCloseModal}>OK</button>
                </Modal.Body>
            </Modal>
        </div>
    );
}
