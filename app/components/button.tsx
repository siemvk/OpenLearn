import React from 'react';

interface ButtonProps {
    onClick?: () => void;
    disabled?: boolean;
    variant?: 'primary' | 'secondary';
    children?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
    onClick,
    disabled = false,
    variant = 'primary',
    children,
}) => {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className='bg-openlearn-700'
        >
            {children}
        </button>
    );
};