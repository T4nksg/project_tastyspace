import { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import UserOptions from './components/UserOptions';
import GuestOptions from './components/GuestOptions';
import AuthModal from './components/AuthModal ';
import ActionButtons, { ActionButton } from './components/ActionButtons';
import Homepage from './components/homepage/Homepage';
import { FaRegUser } from 'react-icons/fa';

export const BACKEND_URL = "http://localhost:5000";

export default function App() {
  const [userToken, setUserToken] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalType, setAuthModalType] = useState<'login' | 'register'>('login');
  const [userRole, setUserRole] = useState<'user' | 'author' | 'moderator' | 'admin' | 'guest'>('guest');
  const [currentComponent, setCurrentComponent] = useState<JSX.Element | null>(<Homepage />);
  const [userData, setUserData] = useState<any>(null);
  const [actionButtons, setActionButtons] = useState<ActionButton[]>([]);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      setUserToken(token);
      fetchUserData(token);
    }
  }, []);

  const fetchUserData = (token: string) => {
    fetch(BACKEND_URL + "/users/me", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(response => response.json())
      .then(data => {
        setUserRole(data.role);
        setUserData(data);
      })
      .catch(error => {
        console.error('Error fetching user data:', error);
        setUserToken(null);
        setUserRole('guest');
      });
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    setUserToken(null);
    setUserRole('guest');
    setUserData(null);
    setCurrentComponent(<Homepage />);
    setActionButtons([]);
  };

  const handleLoginSuccess = (token: string) => {
    setUserToken(token);
    fetchUserData(token);
    setShowAuthModal(false);
    setCurrentComponent(<Homepage />);
  };

  const toggleRegistration = (role: string, type: 'login' | 'register') => {
    setUserRole(role as any);
    setAuthModalType(type);
    setShowAuthModal(true);
  };

  const updateUserInfo = (updatedUser: any) => {
    setUserData(updatedUser);
  };

  return (
    <div className="App">
      <div className="App-sidebar">
        <nav className="App-nav">
          {!userToken ? (
            <GuestOptions
              showLoginForm={() => toggleRegistration('', 'login')}
              showRegistrationForm={(role: string) => toggleRegistration(role, 'register')}
              setCurrentComponent={setCurrentComponent}
              setActionButtons={setActionButtons}
            />
          ) : (
            <UserOptions
              setUserToken={setUserToken}
              handleLogout={handleLogout}
              toggleRegistration={toggleRegistration}
              userRole={userRole}
              setCurrentComponent={setCurrentComponent}
              setActionButtons={setActionButtons}
              onUserUpdate={updateUserInfo}
            />
          )}
        </nav>
      </div>
      <div className="App-content">
        <header className="App-header">
          <img src="/logo/logo.png" alt="TastySpace Logo" className="App-logo" onClick={() => {setCurrentComponent(<Homepage />); setActionButtons([])}}/>
          <div className="App-header-buttons">
            {!userToken ? (
              <button className="btn btn-primary App-header-button" onClick={() => toggleRegistration('', 'login')}>
                <span className="hover-effect">Sign in</span> <span className="hover-effect">|</span> <span className="hover-effect">Sign up</span>
              </button>
            ) : (
              <button className="btn btn-primary App-header-button" onClick={handleLogout}>
                <FaRegUser className="user-icon" /> <span className="user-name">{userData?.username}</span> <span className="hover-effect">|</span> <span className="hover-effect">Sign out</span>
              </button>
            )}
          </div>
        </header>
        {actionButtons.length > 0 && (
          <div className="App-action-bar">
            <ActionButtons buttons={actionButtons} />
          </div>
        )}
        <div className={`App-content-wrapper ${actionButtons.length === 0 ? 'no-action-bar' : ''}`}>
          {currentComponent}
        </div>
        {showAuthModal && (
          <AuthModal
            show={showAuthModal}
            handleClose={() => setShowAuthModal(false)}
            formType={authModalType}
            setUserToken={handleLoginSuccess}
            role={userRole}
          />
        )}
      </div>
    </div>
  );
}
