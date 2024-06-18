import { Card } from 'react-bootstrap';
import { FaRegTrashAlt } from 'react-icons/fa';
import './SavedMenuCard.css';

type RecipeApiResponse = {
    id: number;
    title: string;
    image_url: string;
};

type SavedMenuCardProps = {
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
    onClick: () => void;
    onRemove: (menuId: number) => void;
};

export default function SavedMenuCard({ menu, onClick, onRemove }: SavedMenuCardProps) {
    console.log(`Rendering SavedMenuCard for menu ${menu.id}:`, menu);

    const getGridClass = () => {
        const recipeCount = menu.recipes.length;
        if (recipeCount < 4) {
            return { className: 'two-images', displayCount: 2 };
        } else if (recipeCount < 6) {
            return { className: 'four-images', displayCount: 4 };
        } else if (recipeCount < 9) {
            return { className: 'six-images', displayCount: 6 };
        } else {
            return { className: 'nine-images', displayCount: 9 };
        }
    };

    const gridClass = getGridClass();

    const capitalizeFirstLetter = (string: string) => {
        return string.charAt(0).toUpperCase() + string.slice(1);
    };

    const getCookingTimeText = (cookingTime: string) => {
        switch (cookingTime) {
            case '1':
                return 'Cooking Time: no more than an hour';
            case '2':
                return 'Cooking Time: about 2 hours';
            case '3':
                return 'Cooking Time: from 3 to 4 hours';
            case '4':
                return 'Cooking Time: at least 4 hours';
            default:
                return 'Cooking Time: N/A';
        }
    };

    const getDinnerTimeText = (dinnerTime: string) => {
        switch (dinnerTime) {
            case 'now':
                return 'When to start cooking: anytime';
            case 'today':
                return 'When to start cooking: on the day of dinner';
            case 'tomorrow':
                return 'When to start cooking: the day before dinner';
            case 'later':
                return 'When to start cooking: two days before dinner';
            default:
                return 'When to start cooking: N/A';
        }
    };

    return (
        <Card onClick={onClick} className="mb-3 saved-menu-card common-card" style={{ cursor: 'pointer' }}>
            <div className="d-flex align-items-center card-content">
                <div className="recipes-preview-container">
                    <div className={`recipes-preview ${gridClass.className}`}>
                        {menu.recipes.slice(0, gridClass.displayCount).map(recipe => (
                            <img
                                key={recipe.id}
                                src={recipe.image_url}
                                alt={recipe.title}
                                className={gridClass.displayCount <= 4 ? 'medium-image' : 'small-image'}
                            />
                        ))}
                    </div> 
                </div>
                <Card.Body className="card-body-content">
                    <Card.Title className="mb-3">{menu.title}</Card.Title>
                    <Card.Subtitle className="mb-2 text-muted">
                        {capitalizeFirstLetter(menu.dinner_category)} dinner
                    </Card.Subtitle>
                    <Card.Text>
                        <small>{getCookingTimeText(menu.cooking_time)}</small><br />
                        <small>{getDinnerTimeText(menu.dinner_time)}</small><br />
                        <small>Number of Dishes: {menu.dishes.split(',').length}</small><br />
                        <small>Saved Date: {new Date(menu.saved).toLocaleDateString()}</small>
                    </Card.Text>
                </Card.Body>
                <FaRegTrashAlt
                    className="remove-icon"
                    title="Remove from saved menus"
                    onClick={(e) => {
                        e.stopPropagation();
                        onRemove(menu.id);
                    }}
                />
            </div>
        </Card>
    );
}
