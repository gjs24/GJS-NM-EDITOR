import React from 'react';
import { AuthModal } from './AuthModal';

// Re-export for seamless backward compatibility
export const GoogleAuthModal: React.FC = () => {
  return <AuthModal />;
};

export default GoogleAuthModal;
