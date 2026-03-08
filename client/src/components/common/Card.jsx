function Card({ className = '', children }) {
  return <div className={`card-surface p-4 sm:p-5 ${className}`}>{children}</div>;
}

export default Card;
