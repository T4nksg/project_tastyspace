import './NewRecipeCard.css'
const defaultImageUrl = '/images/PSX_20240502_001821.jpg'

type NewRecipeCardProps = {
    image: string;
    title: string;
    author: string;
    dateCreated: string;
    dateEdited?: string;
    onModerate: () => void;
  };
  
export default function NewRecipeCard ({ image, title, author, dateCreated, dateEdited, onModerate }: NewRecipeCardProps) {
    const imageUrl = image || defaultImageUrl 
    
    return (
      <div className="card new-recipe-card mb-3 common-card" style={{ display: 'flex', flexDirection: 'row', cursor: 'pointer' }} onClick={() => onModerate()}>
          <img src={imageUrl} alt={title} className="recipe-image"  />
          <div className="card-body">
            <h5 className="card-title">{title}</h5>
            <p className="card-text">Author: {author}</p>
            <p className="card-text"><small className="text-muted">Created: {dateCreated}</small></p>
            {dateEdited && <p className="card-text"><small className="text-muted">Last Edited: {dateEdited}</small></p>}
          </div>
        </div>
      );
}