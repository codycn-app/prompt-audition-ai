import React from 'react';
import { EmailIcon } from './icons/EmailIcon';
import { PhoneIcon } from './icons/PhoneIcon';
import { FacebookIcon } from './icons/FacebookIcon';

const Footer: React.FC = () => {
  return (
    <footer className="w-full px-4 py-4 mt-8 border-t sm:px-6 lg:px-8 border-cyber-pink/20">
      <div className="flex items-center justify-between mx-auto max-w-7xl">
        <p className="text-sm text-cyber-on-surface-secondary">
          © 2025 Prompt Audition AI. All rights reserved.
        </p>
        <div className="flex items-center space-x-4">
          <a href="mailto:contact@audition.ai" aria-label="Email" className="text-cyber-on-surface-secondary hover:text-cyber-pink transition-colors">
            <EmailIcon className="w-5 h-5" />
          </a>
          <a href="tel:+84123456789" aria-label="Phone" className="text-cyber-on-surface-secondary hover:text-cyber-pink transition-colors">
            <PhoneIcon className="w-5 h-5" />
          </a>
          <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="text-cyber-on-surface-secondary hover:text-cyber-pink transition-colors">
            <FacebookIcon className="w-5 h-5" />
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;