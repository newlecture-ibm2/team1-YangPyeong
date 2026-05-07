import styles from './Card.module.css';

interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'dark';
  className?: string;
  onClick?: () => void;
  style?: React.CSSProperties;
}

export default function Card({
  children,
  variant = 'default',
  className = '',
  onClick,
  style,
}: CardProps) {
  return (
    <div
      className={`${styles.card} ${variant === 'dark' ? styles['card--dark'] : ''} ${className}`}
      onClick={onClick}
      style={style}
    >
      {children}
    </div>
  );
}
