import React from 'react';

interface HeaderProps {
  title: string;
}

export const Header = ({ title }: HeaderProps) => (
  <header>
    <h1 className="app-header">{title}</h1>
  </header>
);
