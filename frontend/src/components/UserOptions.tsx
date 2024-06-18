import { useState, useEffect } from 'react';
import RoleBasedButtons, { UserRole } from './RoleBasedButtons';
import AddRecipeForm from './AddRecipeForm';
import { RecipeData } from './AddRecipeForm';
import NewRecipes from './moderation/NewRecipes';
import CreateMenuQuestions from './menu/CreateMenuQuestions';
import SavedMenus from './menu/SavedMenus';
import RecipesHistory from './history/RecipesHistory';
import MenusHistory from './history/MenusHistory';
import Homepage from './homepage/Homepage';
import UserInfo from './UserInfo';
import About from './about/About';
import ContactUs from './contact/ContactUs';
import { ActionButton } from './ActionButtons';

const BACKEND_URL = "http://localhost:5000"

export type UserOptionsProps = {
  setUserToken: (userId: string | null) => void;
  handleLogout: () => void;
  toggleRegistration: (role: string, formType: string) => void;
  userRole: UserRole;
  setCurrentComponent: (component: JSX.Element | null) => void;
  setActionButtons: (buttons: ActionButton[]) => void;
  onUserUpdate: (user: any) => void;
}

export default function UserOptions({ handleLogout, toggleRegistration, userRole, setCurrentComponent, setActionButtons, onUserUpdate }: UserOptionsProps) {
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    fetch(BACKEND_URL + '/users/me', {
      headers: { Authorization: 'Bearer ' + localStorage.getItem('access_token') },
    })
      .then(response => response.json())
      .then(data => setUserData(data))
      .catch(error => {
        console.error('Error fetching user data:', error);
        handleLogout();
      });
  }, []);

  const handleAddRecipe = (recipeData: RecipeData) => {
    console.log('Recipe added:', recipeData);
    setActionButtons([]);
  };

  const handleCreateMenu = () => {
    setCurrentComponent(
      <CreateMenuQuestions 
        onClose={() => setCurrentComponent(null)} 
        setCurrentComponent={setCurrentComponent} 
        updateActionButtons={setActionButtons} 
        key={Date.now()} // Force re-render by changing the key
      />
    );
    setActionButtons([]);
  };

  const actions = {
    createMenu: handleCreateMenu,
    showSavedMenus: () => {
      setCurrentComponent(
        <SavedMenus
          setCurrentComponent={setCurrentComponent}
          updateActionButtons={setActionButtons}
        />
      );
    },
    addModerator: () => toggleRegistration('moderator', 'register'),
    recipesHistory: () => {
      setCurrentComponent(<RecipesHistory />);
      setActionButtons([]);
    },
    menusHistory: () => {
      setCurrentComponent(<MenusHistory />);
      setActionButtons([]);
    },
    showNewRecipes: () => {
      setCurrentComponent(<NewRecipes updateActionButtons={setActionButtons}/>);
      setActionButtons([]);
    },
    addRecipe: () => {
      setCurrentComponent(<AddRecipeForm onAddRecipe={handleAddRecipe} />);
      setActionButtons([]);
    },
    showUserInfo: () => {
      setCurrentComponent(<UserInfo onUserUpdate={onUserUpdate} />);
      setActionButtons([]);
    },
    showHelp: () => {
      setCurrentComponent(<About />);
      setActionButtons([]); // Clear action buttons
    },
    showContact: () => {
      setCurrentComponent(<ContactUs />); // Set ContactUs component
      setActionButtons([]); // Clear action buttons
    },
    showHomepage: () => {
      setCurrentComponent(<Homepage />);
      setActionButtons([]);
    },
    signOut: () => handleLogout(),
  };

  if (!userData) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <RoleBasedButtons userRole={userData.role} actions={actions} />
    </>
  );
}
