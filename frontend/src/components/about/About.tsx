import './About.css';

export default function About () {
  return (
    <div className="about-container">
      <h3 className="text-center">About</h3>
      <div className="about-card common-card">
        <div className="about-card-content">
          <h2 className="about-card-title">TastySpace</h2>
          <p className="about-card-text">
            Everyone who cooks often faces the challenge of coming up with a dinner idea and selecting the right dishes, which can be more difficult than preparing the dinner itself. If this problem sounds familiar, <span className="highlight">TastySpace</span> will definitely come in handy. <span className="highlight">TastySpace</span> is not an ordinary culinary site. This application helps create a dinner menu for any occasion. The app takes into account the seasonality of ingredients, compatibility of dishes from various cuisines, and provides a diverse menu including dishes with fish, meat, mushrooms, and vegetables.
          </p>
        </div>
      </div>
      <div className="about-card common-card">
        <div className="about-card-content">
          <h2 className="about-card-title">How to start</h2>
          <p className="about-card-text">
            To get started, select the <strong className="highlight">Create menu</strong> option and answer a few simple questions. You will need to specify the type of dinner you are planning, when the dinner is planned, and how much time you are willing to spend on preparation. The app will provide you with a menu option and also calculate a <strong className="highlight">Shopping list</strong> for all the ingredients you will need to prepare the dinner.
          </p>
        </div>
      </div>
      <div className="about-card common-card">
        <div className="about-card-content">
          <h2 className="about-card-title">Saving menus</h2>
          <p className="about-card-text">
            Registered users have the ability to save menus. If you are preparing for an event in advance, such as planning a festive dinner, you can save the menu to prepare later. Before starting the preparation, select the <strong className="highlight">Saved menus</strong> option to go to the list of your saved menus.
          </p>
        </div>
      </div>
      <div className="about-card common-card">
        <div className="about-card-content">
          <h2 className="about-card-title">Share recipes</h2>
          <p className="about-card-text">
            If you want to share your favorite recipes with the app users, select the <strong className="highlight">I want to become an author</strong> option during registration, and you will have the opportunity to add recipes. If you want to become an app moderator, select the <strong className="highlight">Contact us</strong> option to get in touch with the administrator.
          </p>
        </div>
      </div>
    </div>
  );
}
