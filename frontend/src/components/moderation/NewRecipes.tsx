import { useEffect, useState } from 'react';
import NewRecipeCard from './NewRecipeCard';
import Moderation from './Moderation';
import { ActionButton } from '../ActionButtons';
import { Modal } from 'react-bootstrap';

const BACKEND_URL = "http://localhost:5000";
const defaultImageUrl = '/images/PSX_20240502_001821.jpg';

type NewRecipesProps = {
  updateActionButtons: (buttons: ActionButton[]) => void;
};

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
  author: string;
  created: string;
  edited?: string;
  ingredients: Ingredient[];
  steps: Step[];
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

export default function NewRecipes({ updateActionButtons }: NewRecipesProps) {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [showModeratorActions, setShowModeratorActions] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);

  // Функция для загрузки рецептов с сервера
  const fetchRecipes = () => {
    fetch(`${BACKEND_URL}/newRecipes`, {
      headers: { "Authorization": "Bearer " + localStorage.getItem("access_token") }
    })
      .then(response => response.json())
      .then(data => {
        const updatedData = data.map(item => ({
          ...item,
          image_url: item.image_url ? `/images/${item.image_url}` : defaultImageUrl,
          dateCreated: new Date(item.created).toLocaleDateString(),
          dateEdited: item.edited ? new Date(item.edited).toLocaleDateString() : undefined
        }));
        setRecipes(updatedData);
      })
      .catch(error => console.error('Load new recipes error', error));
  };

  // Загружаем рецепты при монтировании компонента
  useEffect(() => {
    fetchRecipes();
  }, []);

  // Функция для получения данных рецепта для модерации
  const handleModerate = (recipeId: number) => {
    fetch(`${BACKEND_URL}/recipes/${recipeId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem("access_token")}`,
        'Content-Type': 'application/json'
      }
    })
      .then(response => response.json())
      .then(data => {
        if (data.error) {
          console.error('Error fetching recipe details:', data.error);
          return;
        }
        setSelectedRecipe(data);
        setShowModeratorActions(true);
      })
      .catch(error => {
        console.error('Error fetching recipe details:', error);
      });
  };

  // Функция для продолжения модерации рецепта
  const handleContinueModeration = (updatedRecipe: Recipe) => {
    fetch(`${BACKEND_URL}/recipes/${updatedRecipe.id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem("access_token")}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updatedRecipe)
    })
      .then(response => response.json())
      .then(data => {
        if (data.error) {
          console.error('Error updating recipe details:', data.error);
        } else {
          console.log('Recipe updated successfully');
          const updatedRecipeWithImage = {
            ...updatedRecipe,
            image_url: updatedRecipe.image_url ? `/images/${updatedRecipe.image_url}` : defaultImageUrl
          };
          setSelectedRecipe(updatedRecipeWithImage); // Обновляем для текущего просмотра
          setRecipes(prevRecipes => prevRecipes.map(recipe =>
            recipe.id === updatedRecipe.id ? updatedRecipeWithImage : recipe
          ));
          fetchRecipes();
          setShowModeratorActions(true);
        }
      })
      .catch(error => {
        console.error('Error updating recipe details:', error);
      });
  };

  // Функция для отклонения рецепта
  const handleRejectRecipe = (recipeId: number) => {
    fetch(`${BACKEND_URL}/recipes/${recipeId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem("access_token")}`,
        'Content-Type': 'application/json'
      }
    })
      .then(response => response.json())
      .then(data => {
        if (data.error) {
          console.error('Error fetching recipe details:', data.error);
        } else {
          console.log(data.message);
          setRecipes(prevRecipes => prevRecipes.filter(recipe => recipe.id !== recipeId));
          setSelectedRecipe(null);
        }
      })
      .catch(error => {
        console.error('Error deleting recipe:', error);
      });
  };

  // Функция для публикации рецепта
  const handlePublish = (moderationData: ModerationData) => {
    fetch(`${BACKEND_URL}/recipes/publish/${selectedRecipe!.id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem("access_token")}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(moderationData)
    })
      .then(response => response.json())
      .then(data => {
        if (data.error) {
          console.error('Error publishing recipe:', data.error);
        } else {
          console.log('Recipe published successfully');
          setShowModeratorActions(false);
          setSelectedRecipe(null);
          setRecipes(prevRecipes => prevRecipes.filter(recipe => recipe.id !== selectedRecipe!.id));
          setShowSuccessModal(true); // Показать успешное модальное окно
        }
      })
      .catch(error => {
        console.error('Error publishing recipe:', error);
      });
  };

  const handleBackToList = () => {
    setSelectedRecipe(null);
    setShowModeratorActions(false);
    updateActionButtons([]); // Обновляем кнопки действий пустым массивом
  };

  const handleCloseSuccessModal = () => setShowSuccessModal(false);

  const openRejectModal = () => setShowRejectModal(true);
  const closeRejectModal = () => setShowRejectModal(false);

  const confirmRejectRecipe = () => {
    handleRejectRecipe(selectedRecipe!.id);
    closeRejectModal();
  };

  return (
    <div>
      {selectedRecipe && showModeratorActions ? (
        <Moderation
          recipe={selectedRecipe}
          onUpdate={handleContinueModeration}
          onRejectRecipe={openRejectModal}
          onBackToList={handleBackToList}
          onPublish={handlePublish}
          updateActionButtons={updateActionButtons}
          showSuccessModal={() => setShowSuccessModal(true)}
        />
      ) : (
        <>
          <h3 className="text-center my-4">
            {recipes.length > 0 ? 'New recipes for moderation' : 'There are no new recipes for moderation'}
          </h3>
          {recipes.map(recipe => (
            <NewRecipeCard
              key={recipe.id}
              image={recipe.image_url || defaultImageUrl}
              title={recipe.title}
              author={recipe.author}
              dateCreated={recipe.created}
              dateEdited={recipe.edited}
              onModerate={() => handleModerate(recipe.id)}
            />
          ))}
        </>
      )}
      <Modal show={showSuccessModal} onHide={handleCloseSuccessModal} centered>
        <Modal.Body className="text-center">
          <p>Moderation successful. The recipe will now be available to app users.</p>
          <button className="btn btn-recipe-primary" onClick={handleCloseSuccessModal}>OK</button>
        </Modal.Body>
      </Modal>
      <Modal show={showRejectModal} onHide={closeRejectModal} centered>
        <Modal.Body className="text-center">
          <p>Are you sure you want to reject the recipe?</p>
          <div className="d-flex justify-content-center">
            <button className="btn btn-recipe-primary mx-2" onClick={confirmRejectRecipe}>Yes</button>
            <button className="btn btn-recipe-secondary mx-2" onClick={closeRejectModal}>No</button>
          </div>
        </Modal.Body>
      </Modal>
    </div>
  );
}
