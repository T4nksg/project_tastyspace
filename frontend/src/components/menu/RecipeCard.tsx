import './RecipeCard.css'

export type RecipeCardProps = {
    image: string;
    title: string;
    description: string;
    onClick?: () => void;
};

export default function RecipeCard({ image, title, description, onClick }: RecipeCardProps) {
    return (
        <div className="card recipe-card common-card" 
            style={{ width: '15rem', height: '335px', cursor: onClick ? 'pointer' : 'default' }}
            onClick={onClick}
        >
            <div className="card-img-container">
                <img src={image} className="card-img-top" alt={title} />
            </div>
            <div className="card-body">
                <h5 className="card-title">{title}</h5>
                <p className="card-text">{description}</p>
            </div>
        </div>
    );
} 
