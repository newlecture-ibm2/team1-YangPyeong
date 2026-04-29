import styles from './Input.module.css';

interface InputProps {
  label?: string;
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  name?: string;
  id?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  as?: 'input' | 'textarea';
  rows?: number;
  autoComplete?: string;
}

export default function Input({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  name,
  id,
  required = false,
  disabled = false,
  className = '',
  as = 'input',
  rows = 4,
  autoComplete,
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
          id={id}
          required={required}
          disabled={disabled}
          rows={rows}
          autoComplete={autoComplete}
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
        id={id}
        required={required}
        disabled={disabled}
        autoComplete={autoComplete}
      />
    );
  };

  return (
    <div className={`${styles.group} ${className}`}>
      {label && (
        <label className={styles.label} htmlFor={id}>
          {label}
          {required && <span className={styles.required}>*</span>}
        </label>
      )}
      {renderField()}
    </div>
  );
}
