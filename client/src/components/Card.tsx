import { HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export default function Card({ children, className = '', ...props }: CardProps) {
  return (
    <div
      className={`bg-white dark:bg-gray-800 p-6 rounded-lg shadow ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}