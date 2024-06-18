import React, { useState, useEffect } from 'react';
import { FaRegListAlt } from 'react-icons/fa';
import { Modal } from 'react-bootstrap';
import './MenusHistory.css';
import { BACKEND_URL } from '../../App'; 

type Menu = {
    id: number;
    title: string;
    username: string;
    dinner_category: string;
    cooking_time: string;
    saved_date: string;
    removed_date: string | null;
    recipes: { title: string }[];
};

export default function MenusHistory() {
    const [menus, setMenus] = useState<Menu[]>([]);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [sortBy, setSortBy] = useState<string>('id');
    const [removedFilter, setRemovedFilter] = useState<string>('all');
    const [showModal, setShowModal] = useState<boolean>(false);
    const [selectedMenu, setSelectedMenu] = useState<Menu | null>(null);

    useEffect(() => {
        const token = localStorage.getItem('access_token');
        fetch(`${BACKEND_URL}/menusHistory`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(response => response.json())
        .then(data => {
            const updatedMenus = data.map((menu: Menu) => ({
                ...menu,
                recipes: menu.recipes || []
            }));
            setMenus(updatedMenus);
        })
        .catch(error => console.error('Error fetching menus history:', error));
    }, []);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
    };

    const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSortBy(e.target.value);
    };

    const handleRemovedChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setRemovedFilter(e.target.value);
    };

    const handleShowRecipes = (menu: Menu) => {
        setSelectedMenu(menu);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setSelectedMenu(null);
    };

    const filteredMenus = menus.filter(menu => {
        const matchesSearch = menu.title.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRemoved = removedFilter === 'all' ||
            (removedFilter === 'yes' && menu.removed_date !== '-') ||
            (removedFilter === 'no' && menu.removed_date === '-');
        return matchesSearch && matchesRemoved;
    });

    const parseDate = (dateString: string) => {
        if (dateString === '-') return null;
        const [day, month, year] = dateString.split('.').map(Number);
        return new Date(year, month - 1, day); // Month is 0-indexed
    };

    const sortedMenus = [...filteredMenus].sort((a, b) => {
        if (sortBy === 'username') return a.username.localeCompare(b.username);
        if (sortBy === 'dinner_category') return a.dinner_category.localeCompare(b.dinner_category);
        if (sortBy === 'saved_date') return parseDate(a.saved_date).getTime() - parseDate(b.saved_date).getTime();
        if (sortBy === 'removed_date') {
            const dateA = parseDate(a.removed_date);
            const dateB = parseDate(b.removed_date);
            if (dateA && dateB) return dateA.getTime() - dateB.getTime();
            if (dateA) return -1;
            if (dateB) return 1;
            return 0;
        }
        if (sortBy === 'id') return a.id - b.id;
        return 0;
    });

    const getCookingTimeText = (cookingTime: string) => {
        switch (cookingTime) {
            case '1':
                return 'No more than an hour';
            case '2':
                return 'About 2 hours';
            case '3':
                return 'From 3 to 4 hours';
            case '4':
                return 'At least 4 hours';
            default:
                return 'Cooking Time: N/A';
        }
    };

    return (
        <div>
            <h2>Saved Menus History</h2>
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
                        <option value="id">Menu ID</option>
                        <option value="username">Username</option>
                        <option value="dinner_category">Dinner category</option>
                        <option value="saved_date">Saved date</option>
                        <option value="removed_date">Removed Date</option>
                    </select>
                </div>
                <div>
                    <label><span className="label-text">Removed:</span> </label>
                    <select value={removedFilter} onChange={handleRemovedChange}>
                        <option value="all">All</option>
                        <option value="yes">Yes</option>
                        <option value="no">No</option>
                    </select>
                </div>
                <div className="menu-count">
                    Showing {sortedMenus.length} of {menus.length} menus
                </div>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>Menu ID</th>
                        <th>Title</th>
                        <th>Username</th>
                        <th>Dinner category</th>
                        <th>Cooking time</th>
                        <th>Saved date</th>
                        <th>Removed date</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {sortedMenus.length === 0 ? (
                        <tr>
                            <td colSpan={9}>No menus found.</td>
                        </tr>
                    ) : (
                        sortedMenus.map(menu => (
                            <tr key={menu.id}>
                                <td>{menu.id}</td>
                                <td>{menu.title}</td>
                                <td>{menu.username}</td>
                                <td>{menu.dinner_category}</td>
                                <td>{getCookingTimeText(menu.cooking_time)}</td>
                                <td>{menu.saved_date}</td>
                                <td>{menu.removed_date}</td>
                                <td>
                                    <FaRegListAlt title="Show list of dishes" style={{ cursor: 'pointer' }} onClick={() => handleShowRecipes(menu)} />
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
            {selectedMenu && (
                <Modal show={showModal} onHide={handleCloseModal}>
                    <Modal.Header closeButton>
                        <Modal.Title>List of Dishes</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <ul className="recipes-list">
                            {selectedMenu.recipes.map((recipe, index) => (
                                <li key={index}>{recipe.title}</li>
                            ))}
                        </ul>
                    </Modal.Body>
                </Modal>
            )}
        </div>
    );
}
