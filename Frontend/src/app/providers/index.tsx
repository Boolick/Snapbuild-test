import React from 'react';
import { ToastContainer } from '../../shared/ui';

export interface ProvidersProps {
  children: React.ReactNode;
}

export const AppProviders: React.FC<ProvidersProps> = ({ children }) => {
  return (
    <>
      {children}
      <ToastContainer />
    </>
  );
};
