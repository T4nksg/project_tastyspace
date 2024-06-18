import { useEffect, useRef, useState } from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import './UserInfo.css';

const BACKEND_URL = "http://localhost:5000";

export type User = {
  username: string;
  email: string;
  role: string;
  created: string;
  password: string;
  saved_menus_count: number;
  recipes_count: number;
};

type UserInfoProps = {
  onUserUpdate: (user: User) => void;
};

export default function UserInfo({ onUserUpdate }: UserInfoProps) {
    const [user, setUser] = useState<User | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [isEditingUsername, setIsEditingUsername] = useState(false);
    const [isEditingPassword, setIsEditingPassword] = useState(false);
    const [isEditingEmail, setIsEditingEmail] = useState(false);

    const newUsernameRef = useRef<HTMLInputElement>(null);
    const newPasswordRef = useRef<HTMLInputElement>(null);
    const confirmPasswordRef = useRef<HTMLInputElement>(null);
    const newEmailRef = useRef<HTMLInputElement>(null);

    const [usernameError, setUsernameError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [confirmPasswordError, setConfirmPasswordError] = useState('');
    const [emailError, setEmailError] = useState('');

    useEffect(() => {
        fetch(`${BACKEND_URL}/users/me`, {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
        })
        .then(response => response.json())
        .then(data => {
            const formattedDate = new Date(data.created).toLocaleDateString('ru-RU');
            setUser({ ...data, created: formattedDate });
        })
        .catch(error => console.error('Error fetching user data:', error));
    }, []);

    if (!user) {
        return <div>Loading...</div>;
    }

    const toggleShowPassword = () => {
        setShowPassword(!showPassword);
    };

    const handleBlur = (field: string) => {
        if (field === 'username' && !newUsernameRef.current?.value) {
            setUsernameError('Please enter a valid username');
        }
        if (field === 'password' && !newPasswordRef.current?.value) {
            setPasswordError('Please enter a valid password');
        }
        if (field === 'email' && !newEmailRef.current?.value) {
            setEmailError('Please enter a valid email');
        }
    };

    const handleFocus = (field: string) => {
        if (field === 'username') {
            setUsernameError('');
        }
        if (field === 'password') {
            setPasswordError('');
        }
        if (field === 'email') {
            setEmailError('');
        }
    };

    const handleSaveUsername = () => {
        const newUsername = newUsernameRef.current?.value;
        if (!newUsername) {
            setUsernameError('Please enter a valid username');
            return;
        }
        fetch(`${BACKEND_URL}/users/me`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username: newUsername })
        })
        .then(response => response.json())
        .then(() => {
            const updatedUser = { ...user, username: newUsername };
            setUser(updatedUser);
            onUserUpdate(updatedUser);
            setIsEditingUsername(false);
        })
        .catch(error => console.error('Error updating username:', error));
    };

    const handleSavePassword = () => {
        const newPassword = newPasswordRef.current?.value;
        const confirmPassword = confirmPasswordRef.current?.value;
        if (!newPassword) {
            setPasswordError('Please enter a valid password');
            return;
        }
        if (newPassword !== confirmPassword) {
            setConfirmPasswordError('Passwords do not match');
            return;
        }
        fetch(`${BACKEND_URL}/users/me`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ password: newPassword })
        })
        .then(response => response.json())
        .then(() => {
            const updatedUser = { ...user, password: newPassword };
            setUser(updatedUser);
            onUserUpdate(updatedUser);
            setIsEditingPassword(false);
        })
        .catch(error => console.error('Error updating password:', error));
    };

    const handleSaveEmail = () => {
        const newEmail = newEmailRef.current?.value;
        if (!newEmail) {
            setEmailError('Please enter a valid email');
            return;
        }
        fetch(`${BACKEND_URL}/users/me`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email: newEmail })
        })
        .then(response => response.json())
        .then(() => {
            const updatedUser = { ...user, email: newEmail };
            setUser(updatedUser);
            onUserUpdate(updatedUser);
            setIsEditingEmail(false);
        })
        .catch(error => console.error('Error updating email:', error));
    };

    const handleConfirmPasswordChange = () => {
        const newPassword = newPasswordRef.current?.value || "";
        const confirmPassword = confirmPasswordRef.current?.value || "";
        if (confirmPassword && newPassword.startsWith(confirmPassword)) {
            setConfirmPasswordError('');
        } else if (confirmPassword) {
            setConfirmPasswordError('Passwords do not match');
        } else {
            setConfirmPasswordError('');
        }
    };

    const validateEmail = (email: string): boolean => {
        return /\S+@\S+\.\S+/.test(email);
    };
    
    const handleEmailBlur = () => {
        const email = newEmailRef.current?.value || "";
        if (!validateEmail(email)) {
            setEmailError('Please enter a valid email');
        } else {
            setEmailError('');
        }
    };
    
    const handleEmailChange = () => {
        setEmailError('');
    };
    

    const toggleEditingUsername = () => {
        setIsEditingUsername(!isEditingUsername);
        setUsernameError('');
    };

    const toggleEditingPassword = () => {
        setIsEditingPassword(!isEditingPassword);
        setPasswordError('');
        setConfirmPasswordError('');
    };

    const toggleEditingEmail = () => {
        setIsEditingEmail(!isEditingEmail);
        setEmailError('');
    };

    return (
        <div className="user-info-card common-card">
            <h3 className="text-center">User Information</h3>
            <div className="user-info-row">
                <span>Username: {user.username}</span>
                <button className="user-info-link-button" onClick={toggleEditingUsername}>Edit</button>
            </div>
            {isEditingUsername && (
                <>
                    <div className="user-info-edit-row">
                        <input
                            type="text"
                            placeholder="Enter new username"
                            ref={newUsernameRef}
                            className="user-info-input"
                            onBlur={() => handleBlur('username')}
                            onFocus={() => handleFocus('username')}
                        />
                        <button className="user-info-auth-button" onClick={handleSaveUsername}>OK</button>
                    </div>
                    {usernameError && <div className="user-info-error-message">{usernameError}</div>}
                </>
            )}
            <div className="user-info-row">
                <span>
                    Password: {showPassword ? user.password : '*'.repeat(user.password.length)}
                    <button onClick={toggleShowPassword} className="user-info-eye-button">
                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                </span>
                <button className="user-info-link-button" onClick={toggleEditingPassword}>Edit</button>
            </div>
            {isEditingPassword && (
                <>
                    <div className="user-info-edit-row">
                        <input
                            type="password"
                            placeholder="Enter new password"
                            ref={newPasswordRef}
                            className="user-info-input"
                            onBlur={() => handleBlur('password')}
                            onFocus={() => handleFocus('password')}
                        />
                    </div>
                    {passwordError && <div className="user-info-error-message">{passwordError}</div>}
                    <div className="user-info-edit-row">
                        <input
                            type="password"
                            placeholder="Confirm new password"
                            ref={confirmPasswordRef}
                            className="user-info-input"
                            onChange={handleConfirmPasswordChange}
                        />
                        <button className="user-info-auth-button" onClick={handleSavePassword}>OK</button>
                    </div>
                    {confirmPasswordError && <div className="user-info-error-message">{confirmPasswordError}</div>}
                </>
            )}
            <div className="user-info-row">
                <span>Email: {user.email}</span>
                <button className="user-info-link-button" onClick={toggleEditingEmail}>Edit</button>
            </div>
            {isEditingEmail && (
                <>
                    <div className="user-info-edit-row">
                        <input
                            type="email"
                            placeholder="Enter new email"
                            ref={newEmailRef}
                            className="user-info-input"
                            onBlur={handleEmailBlur}
                            onChange={handleEmailChange}
                        />
                        <button className="user-info-auth-button" onClick={handleSaveEmail}>OK</button>
                    </div>
                    {emailError && <div className="user-info-error-message">{emailError}</div>}
                </>
            )}
            <p>Registration date: {user.created}</p>
            <p>Saved menus: {user.saved_menus_count}</p>
            {user.role === 'author' && <p>Added recipes: {user.recipes_count}</p>}
            {user.role === 'moderator' && <p>Moderated recipes: {user.recipes_count}</p>}
        </div>
    );
}
