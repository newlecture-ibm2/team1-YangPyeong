import styles from './Input.module.css';

interface InputProps {
  label?: string;
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  name?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  as?: 'input' | 'textarea';
  rows?: number;
}

export default function Input({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  name,
  required = false,
  disabled = false,
  className = '',
  as = 'input',
  rows = 4,
}: InputProps) {
  const renderField = () => {
    if (as === 'textarea') {
      return (
        <textarea
          className={styles.input}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          name={name}
          required={required}
          disabled={disabled}
          rows={rows}
        />
      );
    }

    return (
      <input
        className={styles.input}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        name={name}
        required={required}
        disabled={disabled}
      />
    );
  };

  return (
    <div className={`${styles.group} ${className}`}>
      {label && <label className={styles.label}>{label}</label>}
      {renderField()}
    </div>
  );
}
