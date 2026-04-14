import React from 'react';
import './text-field.css';

interface TextFieldProps {
    value?: string;
    onChange?: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
    variant?: 'primary' | 'secondary';
    [x: string]: any;
}

export const TextField: React.FC<TextFieldProps> = ({
    value,
    onChange,
    placeholder,
    disabled = false,
    variant = 'primary',
    ...rest
}) => {
    const className = variant === 'primary' ? 'text-field1' : 'text-field2';

    return (
        <input
            type="text"
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            className={className}
            {...rest}
        />
    );
};
