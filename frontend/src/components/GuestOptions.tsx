import RoleBasedButtons from './RoleBasedButtons';
import CreateMenuQuestions from './menu/CreateMenuQuestions';
import Homepage from './homepage/Homepage';
import About from './about/About';
import ContactUs from './contact/ContactUs';
import { ActionButton } from './ActionButtons';

type GuestOptionsProps = {
  showLoginForm: () => void;
  showRegistrationForm?: (role: string) => void;
  setCurrentComponent: (component: JSX.Element | null) => void; // Добавляем setCurrentComponent
  setActionButtons: (buttons: ActionButton[]) => void;
};

export default function GuestOptions({ showLoginForm, setCurrentComponent, setActionButtons }: GuestOptionsProps) {
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
    }
  };

  return (
    <>
      <RoleBasedButtons userRole="guest" actions={actions} />
    </>
  );
}
