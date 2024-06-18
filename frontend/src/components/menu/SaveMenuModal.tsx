import { useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import './SaveMenu.css'

type SaveMenuModalProps = {
    show: boolean;
    onClose: () => void;
    recipeIds: number[];
    dinnerCategory: string;
    dinnerTime: string;
    cookingTime: string;
    categoryMap: Record<string, string>;
    timeMap: Record<string, string>;
    cookingTimeMap: Record<string, number>;
};

const BACKEND_URL = "http://localhost:5000";

export default function SaveMenuModal({ show, onClose, recipeIds, dinnerCategory, dinnerTime, cookingTime, categoryMap, timeMap, cookingTimeMap }: SaveMenuModalProps) {
    const [title, setTitle] = useState('');

    const handleSave = () => {
        const token = localStorage.getItem('access_token');  
        const mappedCategory: string = categoryMap[dinnerCategory];
        const mappedTime: string = timeMap[dinnerTime];
        const mappedCookingTime: number = cookingTimeMap[cookingTime];
        
        fetch(`${BACKEND_URL}/saveMenu`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})  
            },
            body: JSON.stringify({
                title: title,
                dishes: recipeIds.join(', '),
                dinnerCategory: mappedCategory,
                dinnerTime: mappedTime,
                cookingTime: mappedCookingTime
            })
        })
        .then(response => {
            if (response.ok) {
                console.log("Menu saved successfully");
                onClose(); // Закрываем модальное окно
            }
        })
        .catch(error => {
            console.error('Error saving menu:', error);
        });
    };

    return (
        <Modal show={show} onHide={onClose}>
            <Modal.Header closeButton>
                <Modal.Title>Menu title:</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form>
                    <Form.Group controlId="formMenuTitle">
                        <Form.Control
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Enter menu title"
                        />
                    </Form.Group>
                </Form>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="primary" className="btn-save-primary" onClick={handleSave}>
                    Save Menu
                </Button>
                <Button variant="secondary" className="btn-save-secondary" onClick={onClose}>
                    Cancel
                </Button>
            </Modal.Footer>
        </Modal>
    );
}
