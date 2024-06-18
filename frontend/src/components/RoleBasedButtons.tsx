type ButtonAction = () => void;
type ButtonConfig = {
  text: string;
  action: ButtonAction;
};

export type UserRole = 'admin' | 'moderator' | 'author' | 'user' | 'guest';

export type ButtonsConfig = {
  [role in UserRole]?: ButtonConfig[];
};

export type RoleBasedButtonsProps = {
  userRole: UserRole;
  actions: { [key: string]: () => void };
};

export default function RoleBasedButtons({ userRole, actions }: RoleBasedButtonsProps) {
  const buttonsConfig: ButtonsConfig = {
    admin: [
      { text: "Create Menu", action: actions.createMenu },
      { text: "Saved Menus", action: actions.showSavedMenus },
      { text: "Add Moderator", action: actions.addModerator },
      { text: "Recipes History", action: actions.recipesHistory },
      { text: "Menus History", action: actions.menusHistory },
      { text: "User Information", action: actions.showUserInfo },
    ],
    moderator: [
      { text: "Create Menu", action: actions.createMenu },
      { text: "Saved Menus", action: actions.showSavedMenus },
      { text: "New Recipes", action: actions.showNewRecipes },
      { text: "User Information", action: actions.showUserInfo },
    ],
    author: [
      { text: "Create Menu", action: actions.createMenu },
      { text: "Saved Menus", action: actions.showSavedMenus },
      { text: "Add Recipe", action: actions.addRecipe },
      { text: "User Information", action: actions.showUserInfo },
    ],
    user: [
      { text: "Create Menu", action: actions.createMenu },
      { text: "Saved Menus", action: actions.showSavedMenus },
      { text: "User Information", action: actions.showUserInfo },
    ],
    guest: [
      { text: "Create Menu", action: actions.createMenu },
    ]
  };

  const universalButtons: ButtonConfig[] = [
    { text: "About", action: actions.showHelp },
    { text: "Contact Us", action: actions.showContact },
    { text: "Homepage", action: actions.showHomepage }
  ];

  const roleSpecificButtons = buttonsConfig[userRole] || [];
  const buttons = [...roleSpecificButtons, ...universalButtons].map((btn, index) => (
    <div key={index} className="App-nav-item" onClick={btn.action}>
      {btn.text}
    </div>
  ));

  return <div className="App-nav">{buttons}</div>;
}
