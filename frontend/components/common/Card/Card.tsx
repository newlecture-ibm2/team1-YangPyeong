import styles from './Card.module.css';

interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'dark';
  className?: string;
  onClick?: () => void;
}

export default function Card({
  children,
  variant = 'default',
  className = '',
  onClick,
}: CardProps) {
  return (
    <div
      className={`${styles.card} ${variant === 'dark' ? styles['card--dark'] : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
