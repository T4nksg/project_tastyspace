import React, { useState, useEffect } from 'react';
import { FaRegTrashAlt, FaRegStickyNote } from 'react-icons/fa';
import { Modal } from 'react-bootstrap';
import RecipeDetails from '../menu/RecipeDetails';
import './RecipesHistory.css';

const BACKEND_URL = "http://localhost:5000";

type Recipe = {
    id: number;
    title: string;
    author: string;
    created_date: string;
    moderator: string;
    published_date: string;
};

export default function RecipesHistory() {
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [sortBy, setSortBy] = useState<string>('id');
    const [moderatedFilter, setModeratedFilter] = useState<string>('all');
    const [showModal, setShowModal] = useState<boolean>(false);
    const [recipeToDelete, setRecipeToDelete] = useState<number | null>(null);
    const [selectedRecipeId, setSelectedRecipeId] = useState<number | null>(null);
    const [showDetailsModal, setShowDetailsModal] = useState<boolean>(false);

    useEffect(() => {
        const token = localStorage.getItem('access_token');
        fetch(`${BACKEND_URL}/recipesHistory`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(response => response.json())
        .then(data => {
            setRecipes(data);
        })
        .catch(error => console.error('Error fetching recipes history:', error));
    }, []);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
    };

    const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSortBy(e.target.value);
    };

    const handleModeratedChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setModeratedFilter(e.target.value);
    };

    const handleDeleteRecipe = (id: number) => {
        const token = localStorage.getItem('access_token');
        fetch(`${BACKEND_URL}/recipes/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(response => {
            if (response.ok) {
                setRecipes(prevRecipes => prevRecipes.filter(recipe => recipe.id !== id));
                setShowModal(false);
            } else {
                console.error('Failed to delete recipe');
            }
        })
        .catch(error => console.error('Error deleting recipe:', error));
    };

    const handleShowModal = (id: number) => {
        setRecipeToDelete(id);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setRecipeToDelete(null);
    };

    const handleShowDetailsModal = (id: number) => {
        setSelectedRecipeId(id);
        setShowDetailsModal(true);
    };

    const handleCloseDetailsModal = () => {
        setShowDetailsModal(false);
        setSelectedRecipeId(null);
    };

    const filteredRecipes = recipes.filter(recipe => {
        const matchesSearch = recipe.title.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesModerated = moderatedFilter === 'all' ||
            (moderatedFilter === 'yes' && recipe.moderator !== '-') ||
            (moderatedFilter === 'no' && recipe.moderator === '-');
        return matchesSearch && matchesModerated;
    });

    const parseDate = (dateString: string) => {
        if (dateString === '-') return null;
        const [day, month, year] = dateString.split('.').map(Number);
        return new Date(year, month - 1, day); // Month is 0-indexed
    };

    const sortedRecipes = [...filteredRecipes].sort((a, b) => {
        if (sortBy === 'author') return a.author.localeCompare(b.author);
        if (sortBy === 'moderator') return a.moderator.localeCompare(b.moderator);
        if (sortBy === 'created_date') return parseDate(a.created_date).getTime() - parseDate(b.created_date).getTime();
        if (sortBy === 'published_date') {
            const dateA = parseDate(a.published_date);
            const dateB = parseDate(b.published_date);
            if (dateA && dateB) return dateA.getTime() - dateB.getTime();
            if (dateA) return -1;
            if (dateB) return 1;
            return 0;
        }
        if (sortBy === 'id') return a.id - b.id;
        return 0;
    });

    return (
        <div>
            <h2>Recipes History</h2>
            <div className="filters">
                <input
                    type="text"
                    placeholder="Search by title..."
                    value={searchTerm}
                    onChange={handleSearch}
                />
                <div>
                    <label><span className="label-text">Sort by:</span> </label>
                    <select value={sortBy} onChange={handleSortChange}>
                        <option value="id">Recipe ID</option>
                        <option value="author">Author</option>
                        <option value="moderator">Moderator</option>
                        <option value="created_date">Created date</option>
                        <option value="published_date">Published date</option>
                    </select>
                </div>
                <div>
                    <label><span className="label-text">Moderated recipes:</span> </label>
                    <select value={moderatedFilter} onChange={handleModeratedChange}>
                        <option value="all">All</option>
                        <option value="yes">Yes</option>
                        <option value="no">No</option>
                    </select>
                </div>
                <div className="recipe-count">
                    Showing {sortedRecipes.length} of {recipes.length} recipes
                </div>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>Recipe ID</th>
                        <th>Title</th>
                        <th>Author</th>
                        <th>Moderator</th>
                        <th>Created date</th>
                        <th>Published date</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {sortedRecipes.length === 0 ? (
                        <tr>
                            <td colSpan={7}>No recipes found.</td>
                        </tr>
                    ) : (
                        sortedRecipes.map(recipe => (
                            <tr key={recipe.id}>
                                <td>{recipe.id}</td>
                                <td>{recipe.title}</td>
                                <td>{recipe.author}</td>
                                <td>{recipe.moderator}</td>
                                <td>{recipe.created_date}</td>
                                <td>{recipe.published_date}</td>
                                <td>
                                    <FaRegStickyNote title="Show recipe details" style={{ cursor: 'pointer', marginRight: '10px' }} onClick={() => handleShowDetailsModal(recipe.id)} />
                                    <FaRegTrashAlt title="Delete recipe" style={{ cursor: 'pointer' }} onClick={() => handleShowModal(recipe.id)} />
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
            <Modal show={showModal} onHide={handleCloseModal} centered>
                <Modal.Body className="history-modal-body">
                    <p>Are you sure you want to delete this recipe?</p>
                    <div className="d-flex justify-content-center">
                        <button className="btn btn-history-primary mx-2" onClick={() => handleDeleteRecipe(recipeToDelete!)}>Yes</button>
                        <button className="btn btn-history-secondary" onClick={handleCloseModal}>No</button>
                    </div>
                </Modal.Body>
            </Modal>
            <Modal show={showDetailsModal} onHide={handleCloseDetailsModal} dialogClassName="modal-90w">
                <Modal.Header closeButton>
                    <Modal.Title>Recipe Details</Modal.Title>
                </Modal.Header>
                <Modal.Body className="custom-modal-body">
                    {selectedRecipeId !== null && <RecipeDetails recipeId={selectedRecipeId} />}
                </Modal.Body>
            </Modal>
        </div>
    );
}