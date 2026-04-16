import React from 'react';
import './button.css';
interface ButtonProps {
    onClick?: () => void;
    disabled?: boolean;
    variant?: 'primary' | 'secondary' | 'tertiary';
    children?: React.ReactNode;
    [x: string]: any; // Hiermee kunnen we extra props accepteren, zoals 'type' of 'formMethod'
}

export const Button: React.FC<ButtonProps> = ({
    onClick,
    disabled = false,
    variant = 'primary',
    children,
    ...rest
}) => {
    if (variant === 'primary') {
        return (
            <button
                onClick={onClick}
                disabled={disabled}
                className={'button1 flex flex-row'}
                {...rest}
            >
                {children}
            </button>
        );
    } else if (variant === 'secondary') {
        return (
            <button
                onClick={onClick}
                disabled={disabled}
                className='button2 flex flex-row'
                {...rest}
            >
                {children}
            </button>
        );
    } else {
        return (
            <button
                onClick={onClick}
                disabled={disabled}
                className='button3 flex flex-row'
                {...rest}
            >
                {children}
            </button>
        );
    }
};