import { useState, useEffect } from 'react';
import { Modal } from 'react-bootstrap';
import LoginForm from './LoginForm';
import RegistrationForm from './RegistrationForm';
import './AuthModal.css';

type AuthModalProps = {
  show: boolean;
  handleClose: () => void;
  formType: 'login' | 'register';
  setUserToken: (token: string | null) => void;
  role?: string; // Добавьте роль как опциональный проп, если он не всегда нужен
};

export default function AuthModal({ show, handleClose, formType, setUserToken, role = 'user' }: AuthModalProps) {
  const [currentFormType, setCurrentFormType] = useState<'login' | 'register'>(formType);
  const [currentRole, setCurrentRole] = useState<string>(role);

  useEffect(() => {
    setCurrentFormType(formType);
    setCurrentRole(role);
  }, [formType, role]);
  
  const getTitle = () => {
    if (currentFormType === 'login') {
      return 'Enter your details';
    } else {
      return `Adding a new ${currentRole}`;
    }
  };

  return (
    <Modal show={show} onHide={handleClose} dialogClassName="modal-dialog">
      <Modal.Header closeButton>
        <Modal.Title>{getTitle()}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {currentFormType === 'login' ? (
          <LoginForm setUserToken={setUserToken} switchToRegister={(role: string) => { setCurrentFormType('register'); setCurrentRole(role); }} />
        ) : (
          <RegistrationForm role={currentRole} setUserToken={setUserToken} />
        )}
      </Modal.Body>
    </Modal>
  );
}
