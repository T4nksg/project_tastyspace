import { useRef, useState } from 'react'
import './AuthModal.css';

const BACKEND_URL = "http://localhost:5000"

type RegistrationFormProps = {
    role: string;
    setUserToken: (token: string | null) => void;
};

export default function RegistrationForm({ role, setUserToken }: RegistrationFormProps) {
    const usernameRef = useRef<HTMLInputElement>(null);
    const passwordRef = useRef<HTMLInputElement>(null);
    const confirmPasswordRef = useRef<HTMLInputElement>(null);
    const emailRef = useRef<HTMLInputElement>(null); 

    const [usernameError, setUsernameError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [confirmPasswordError, setConfirmPasswordError] = useState('');
    const [emailError, setEmailError] = useState('');

    const clearFormFields = () => {
        usernameRef.current.value = "";
        passwordRef.current.value = "";
        confirmPasswordRef.current.value = "";
        emailRef.current.value = "";
    };

    const handleRegister = () => {
        const username = usernameRef.current?.value;
        const password = passwordRef.current?.value;
        const confirmPassword = confirmPasswordRef.current?.value;
        const email = emailRef.current?.value;

        if (!username) {
            setUsernameError('Please enter a username');
            return;
        }
        if (!password) {
            setPasswordError('Please enter a password');
            return;
        }
        if (!confirmPassword) {
            setConfirmPasswordError('Please confirm your password');
            return;
        }
        if (password !== confirmPassword) {
            setConfirmPasswordError('Passwords do not match');
            return;
        }
        if (!email) {
            setEmailError('Please enter an email');
            return;
        }
        
        fetch(BACKEND_URL + "/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password, email, role })
        })
        .then(response => response.json())
        .then(data => {
            if (role !== 'moderator') {
                if (data.access_token) {
                    localStorage.setItem("access_token", data.access_token);
                    setUserToken(data.access_token); 
                    alert("Registration successful");
                    clearFormFields(); 
                } else {
                    alert(data.error || "Registration failed");
                    clearFormFields(); 
                }
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert("Registration failed: " + error);
            clearFormFields(); 
        });
    };

    const handleUsernameBlur = () => {
        const username = usernameRef.current?.value || "";
        if (!username) {
          setUsernameError('Please enter a username');
          return;
        }
    
        fetch(BACKEND_URL + "/check_username", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username }),
        })
          .then(response => response.json())
          .then(data => {
            if (data.valid) {
                setUsernameError('This username already exists, please choose another one');
            } else {
                setUsernameError('');
            }
          })
          .catch((error) => {
            console.error("Error checking username: ", error);
            setUsernameError('Error checking username');
          });
      };
    
    const handleUsernameChange = () => {
        setUsernameError('');
    };

    const handlePasswordBlur = () => {
        const password = passwordRef.current?.value || "";
        if (!password) {
            setPasswordError('Please enter a password');
        } else {
            setPasswordError('');
        }
    };

    const handlePasswordChange = () => {
        setPasswordError('');
        setConfirmPasswordError('');
    };

    const handleConfirmPasswordChange = () => {
        const password = passwordRef.current?.value || "";
        const confirmPassword = confirmPasswordRef.current?.value || "";
        if (confirmPassword && password.startsWith(confirmPassword)) {
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
        const email = emailRef.current?.value || "";
        if (!validateEmail(email)) {
            setEmailError('Please enter a valid email address');
        } else {
            setEmailError('');
        }
    };

    const handleEmailChange = () => {
        setEmailError('');
    };

    return <>
        <input 
            type="text" 
            name="username" 
            placeholder="Username" 
            ref={usernameRef} 
            required 
            onBlur={handleUsernameBlur}
            onChange={handleUsernameChange}
            className="auth-input"
        />
        {usernameError && <div className="error-message">{usernameError}</div>}
        <input 
            type="password" 
            name="password" 
            placeholder="Password" 
            ref={passwordRef} 
            required 
            onBlur={handlePasswordBlur}
            onChange={handlePasswordChange}
            className="auth-input"
        />
        {passwordError && <div className="error-message">{passwordError}</div>}
        <input 
            type="password" 
            name="confirmPassword" 
            placeholder="Confirm Password" 
            ref={confirmPasswordRef} 
            required 
            onChange={handleConfirmPasswordChange}
            className="auth-input"
        />
        {confirmPasswordError && <div className="error-message">{confirmPasswordError}</div>}
        <input 
            type="email" 
            name="email" 
            placeholder="Email" 
            ref={emailRef} 
            required 
            onBlur={handleEmailBlur}
            onChange={handleEmailChange}
            className="auth-input"
        />
        {emailError && <div className="error-message">{emailError}</div>}
        <button onClick={handleRegister} className="auth-button">Sign up</button>
    </>
}