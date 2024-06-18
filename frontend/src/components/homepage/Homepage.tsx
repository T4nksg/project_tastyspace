import './Homepage.css';

const cardData = [
    {
        image: '/dinner/Weeknight.jpg',
        title: 'Weeknight dinner',
        text: 'A simple dinner that is easy to prepare even after a workday. It’s a great opportunity to diversify your daily menu. The simplest version includes a salad and a main course, while a more extensive menu also features an easy soup recipe.'
    },
    {
        image: '/dinner/Family.jpg',
        title: 'Family dinner',
        text: 'A dinner that is perfect for delighting yourself and your family on a weekend, when you have more time to prepare interesting dishes. The simplest menu includes a salad, soup, and a main course. More extensive menu options may include additional starters or baked goods for tea.'
    },
    {
        image: '/dinner/Guest.jpg',
        title: 'Guest dinner',
        text: 'A wonderful opportunity to surprise guests with an interesting and delicious dinner even without a special occasion. The dinner menu can include between four to seven dishes, depending on how much time you are willing to spend cooking and how much time you have before your guests arrive.'
    },
    {
        image: '/dinner/Festive.jpg',
        title: 'Festive dinner',
        text: 'A festive dinner for special occasions with various appetizers, hot and cold starters, salads, a main course, and an exquisite dessert. The menu is designed to include a variety of dishes: cheese and vegetable plates, fish or seafood dishes, chicken dishes, and meat delicacies.'
    },
    {
        image: '/dinner/Romantic.jpg',
        title: 'Romantic dinner',
        text: 'A dinner for two with beautiful presentation for a romantic evening. You can create many different menu options, ranging from simple appetizers and portioned salads for a charming date to a large and varied menu for an anniversary or Valentine\'s Day.'
    },
];
export default function Homepage() {
  return (
    <div className="homepage-container">
        {cardData.map((card, index) => (
            <div key={index} className="homepage-card common-card">
                <img src={card.image} alt={card.title} className="homepage-card-image" />
                <div className="homepage-card-content">
                    <h2 className="homepage-card-title">{card.title}</h2>
                    <p className="homepage-card-text">{card.text}</p>
                </div>
            </div>
        ))}
    </div>
  );
}
  
  