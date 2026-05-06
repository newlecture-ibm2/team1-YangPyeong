import styles from './Spinner.module.css';

interface SpinnerProps {
  message?: string;
  fullHeight?: boolean;
}

export default function Spinner({ message = '데이터를 불러오는 중입니다...', fullHeight = true }: SpinnerProps) {
  return (
    <div className={`${styles.loadingContainer} ${fullHeight ? styles.fullHeight : ''}`}>
      <div className={styles.spinner} />
      {message && <p className={styles.message}>{message}</p>}
    </div>
  );
}
