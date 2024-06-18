export type ActionButton = {
  text: string;
  action: () => void;
};

type ActionButtonsProps = {
  buttons: ActionButton[];
};

export default function ActionButtons({ buttons }: ActionButtonsProps) {
  return (
    <div className="action-buttons">
      {buttons.map((button, index) => (
        <button
          key={index}
          className="action-button"
          onClick={button.action}
        >
          {button.text}
        </button>
      ))}
    </div>
  );
}
