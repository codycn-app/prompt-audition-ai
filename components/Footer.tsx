import React from 'react';
import { EmailIcon } from './icons/EmailIcon';
import { PhoneIcon } from './icons/PhoneIcon';
import { FacebookIcon } from './icons/FacebookIcon';
import { UserGroupIcon } from './icons/UserGroupIcon';
import { TagIcon } from './icons/TagIcon';
import { SparklesIcon } from './icons/SparklesIcon';

const Footer: React.FC = () => {
  const buttonLinks = [
    {
      label: 'Cộng đồng',
      fullLabel: 'Cộng đồng AUDITION AI',
      href: 'https://m.me/cm/AbZT2-fW9wJlrX7M/?send_source=cm:copy_invite_link',
      icon: <UserGroupIcon className="w-4 h-4" />,
    },
    {
      label: 'Prompt GPT',
      fullLabel: 'PROMPT GPT AUDITION AI',
      href: 'https://byvn.net/codycn-prompt',
      icon: <TagIcon className="w-4 h-4" />,
    },
    {
      label: 'APP V4',
      fullLabel: 'APP AUDITION AI V4',
      href: 'https://byvn.net/codycn-app',
      icon: <SparklesIcon className="w-4 h-4" />,
    },
  ];

  return (
    <footer className="w-full px-4 py-4 mt-8 border-t sm:px-6 lg:px-8 border-cyber-pink/20">
      <div className="flex flex-col items-center justify-between gap-4 mx-auto max-w-7xl sm:flex-row">
        
        {/* Copyright */}
        <p className="flex-shrink-0 text-xs text-center sm:text-sm text-cyber-on-surface-secondary sm:text-left">
          © 2025 Prompt Audition AI.
        </p>
        
        {/* Action Buttons - takes remaining space on desktop, centers on mobile */}
        <div className="flex items-center justify-center w-full gap-2 sm:w-auto sm:flex-grow">
            {buttonLinks.map(link => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                // Compact button styles
                className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium text-white transition-all duration-300 border-2 border-transparent rounded-lg shadow-md outline-none bg-gradient-to-r from-cyber-pink to-cyber-cyan group hover:shadow-cyber-glow focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-cyber-black focus:ring-cyber-pink active:scale-95 whitespace-nowrap"
              >
                {link.icon}
                {/* Use shorter labels for small screens to ensure they fit */}
                <span className="ml-1.5 hidden md:inline">{link.fullLabel}</span>
                <span className="ml-1.5 md:hidden">{link.label}</span>
              </a>
            ))}
        </div>
        
        {/* Social Icons */}
        <div className="flex items-center flex-shrink-0 space-x-4">
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