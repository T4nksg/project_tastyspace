import { useState, useRef } from 'react';
import RegistrationForm from './RegistrationForm';
import './AuthModal.css';

const BACKEND_URL = "http://localhost:5000";

export type UserDataProps = {
  setUserToken: (userId: string | null) => void;
  switchToRegister: (role: string) => void;
};

export default function LoginForm({ setUserToken, switchToRegister }: UserDataProps) {
  const usernameRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const [showRegistration, setShowRegistration] = useState(false);
  const [registrationRole, setRegistrationRole] = useState('user');
  const [usernameError, setUsernameError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const handleLogin = () => {
    const username = usernameRef.current?.value || "";
    const password = passwordRef.current?.value || "";

    if (!password) {
      setPasswordError('Please enter a valid password');
      return;
    } else {
      setPasswordError('');
    }

    fetch(BACKEND_URL + "/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    })
      .then(response => response.json())
      .then(data => {
        if (data.error && data.error.includes("password")) {
          setPasswordError('Please enter a valid password');
        } else {
          localStorage.setItem("access_token", data.access_token);
          setUserToken(data.access_token);
        }
      })
      .catch((error) => alert("Error logging in: " + error));
  };


  const handleUsernameBlur = () => {
    const username = usernameRef.current?.value || "";
    if (!username.trim()) {
      setUsernameError('Please enter a valid username');
      return;
    }

    fetch(BACKEND_URL + "/check_username", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username }),
    })
      .then(response => response.json())
      .then(data => {
        if (!data.valid) {
          setUsernameError('Please enter a valid username');
        } else {
          setUsernameError('');
        }
      })
      .catch((error) => {
        console.error("Error checking username:", error);
        setUsernameError("Error checking username. Please try again.");
      });
  };

  const handleUsernameChange = () => {
    setUsernameError('');
  };

  const handlePasswordBlur = () => {
    const password = passwordRef.current?.value || "";
    if (!password) {
      setPasswordError('Please enter a valid password');
    } else {
      setPasswordError('');
    }
  };

  const handlePasswordChange = () => {
    setPasswordError('');
  };

  const handleRegistrationClick = (role: string) => {
    switchToRegister(role);
    setRegistrationRole(role);
    setShowRegistration(true);
  };

  if (showRegistration) {
    return <RegistrationForm role={registrationRole} setUserToken={setUserToken} />;
  }

    return (
        <div className="auth-form">
            <input
                type="text"
                name="username"
                placeholder="Username"
                ref={usernameRef}
                className="auth-input"
                onBlur={handleUsernameBlur}
                onChange={handleUsernameChange}
            />
            {usernameError && <div className="error-message">{usernameError}</div>}
            <input
                type="password"
                name="password"
                placeholder="Password"
                ref={passwordRef}
                className="auth-input"
                onBlur={handlePasswordBlur}
                onChange={handlePasswordChange}
            />
            {passwordError && <div className="error-message">{passwordError}</div>}
            <button onClick={handleLogin} className="auth-button">Sign in</button>
            <button onClick={() => handleRegistrationClick("user")} className="link-button user-sign-up">I want to sign up</button>
            <button onClick={() => handleRegistrationClick("author")} className="link-button author-sign-up">I want to become an author</button>
        </div>
    );
}
