import styles from './Badge.module.css';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'green' | 'lime' | 'orange' | 'red' | 'gray' | 'outline' | 'dark';
  className?: string;
}

export default function Badge({
  children,
  variant = 'green',
  className = '',
}: BadgeProps) {
  return (
    <span className={`${styles.badge} ${styles[`badge--${variant}`]} ${className}`}>
      {children}
    </span>
  );
}
