import { useState, useEffect } from 'react';
import SavedMenuCard from './SavedMenuCard';
import { SavedMenuDisplay } from './SavedMenuDisplay';
import { ActionButton } from '../ActionButtons';
import './SaveMenu.css'

const BACKEND_URL = "http://localhost:5000";

type RecipeApiResponse = {
    id: number;
    title: string;
    description: string;
    image_url: string;
    type: string;
};

type SavedMenu = {
    id: number;
    title: string;
    dinner_category: string;
    dinner_time: string;
    cooking_time: string;
    dishes: string;
    saved: string;
    recipes: RecipeApiResponse[];
};

type SavedMenusProps = {
    setCurrentComponent: (component: JSX.Element | null) => void;
    updateActionButtons: (buttons: ActionButton[]) => void;
};

export default function SavedMenus({ setCurrentComponent, updateActionButtons }: SavedMenusProps) {
    const [savedMenus, setSavedMenus] = useState<SavedMenu[]>([]);
    const [selectedMenu, setSelectedMenu] = useState<SavedMenu | null>(null);

    useEffect(() => {
        const token = localStorage.getItem('access_token');
        fetch(`${BACKEND_URL}/savedMenus`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(response => response.json())
        .then(data => {
            const updatedMenus = data.map((menu: SavedMenu) => ({
                ...menu,
                recipes: menu.recipes.map((recipe: RecipeApiResponse) => ({
                    ...recipe,
                    image_url: `/images/${recipe.image_url}`
                }))
            }));
            setSavedMenus(updatedMenus);
        })
        .catch(error => console.error('Error fetching saved menus:', error));
    }, []);

    const handleMenuClick = (menu: SavedMenu) => {
        setSelectedMenu(menu);
        setCurrentComponent(
          <SavedMenuDisplay
            menu={menu}
            onBackToSaved={handleBackToMenus}
            setCurrentComponent={setCurrentComponent}
            updateActionButtons={updateActionButtons}
          />
        );
      };

      const handleBackToMenus = () => {
        setSelectedMenu(null);
        setCurrentComponent(
          <SavedMenus 
            setCurrentComponent={setCurrentComponent} 
            updateActionButtons={updateActionButtons} 
          />
        );
      };

    const handleRemoveMenu = (menuId: number) => {
        const token = localStorage.getItem('access_token');
        fetch(`${BACKEND_URL}/removeMenu`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ menuId })
        })
        .then(response => {
            if (response.ok) {
                setSavedMenus(savedMenus.filter(menu => menu.id !== menuId));
            } else {
                console.error('Failed to remove menu');
            }
        })
        .catch(error => console.error('Error removing menu:', error));
    };

    useEffect(() => {
        updateActionButtons([]);
    }, [updateActionButtons]);

    return (
        <div>
            {selectedMenu ? (
                <SavedMenuDisplay 
                    menu={selectedMenu}
                    onBackToSaved={handleBackToMenus}
                    setCurrentComponent={setCurrentComponent} 
                    updateActionButtons={updateActionButtons}
                />
            ) : (
                <div>
                    <h3 className="text-center">Your Saved Menus</h3>
                    <div className="saved-menus-grid">
                        {savedMenus.length === 0 && <div>No saved menus found.</div>}
                        {savedMenus.map(menu => (
                            <SavedMenuCard 
                                key={menu.id} 
                                menu={menu} 
                                onClick={() => handleMenuClick(menu)}
                                onRemove={handleRemoveMenu} 
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
