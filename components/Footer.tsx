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
      label: 'CỘNG ĐỒNG AUDITION AI',
      href: 'https://m.me/cm/AbZT2-fW9wJlrX7M/?send_source=cm:copy_invite_link',
      icon: <UserGroupIcon className="w-5 h-5 mr-2" />,
    },
    {
      label: 'PROMPT GPT AUDITION AI',
      href: 'https://byvn.net/codycn-prompt',
      icon: <TagIcon className="w-5 h-5 mr-2" />,
    },
    {
      label: 'APP AUDITION AI V4',
      href: 'https://byvn.net/codycn-app',
      icon: <SparklesIcon className="w-5 h-5 mr-2" />,
    },
  ];

  return (
    <footer className="w-full px-4 py-4 mt-8 border-t sm:px-6 lg:px-8 border-cyber-pink/20">
      <div className="flex flex-col items-center justify-center mx-auto max-w-7xl">
        <div className="flex items-center justify-between w-full">
            <p className="text-sm text-cyber-on-surface-secondary">
              © 2025 Prompt Audition AI. All rights reserved.
            </p>
            <div className="flex items-center space-x-4">
              <a href="mailto:contact@caulenhau.io.vn" aria-label="Email" className="text-cyber-on-surface-secondary hover:text-cyber-pink transition-colors">
                <EmailIcon className="w-5 h-5" />
              </a>
              <a href="tel:+0824280497" aria-label="Phone" className="text-cyber-on-surface-secondary hover:text-cyber-pink transition-colors">
                <PhoneIcon className="w-5 h-5" />
              </a>
              <a href="https://www.facebook.com/iam.cody.real/" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="text-cyber-on-surface-secondary hover:text-cyber-pink transition-colors">
                <FacebookIcon className="w-5 h-5" />
              </a>
            </div>
        </div>
        
        <div className="flex flex-col items-center justify-center w-full gap-4 mt-6 sm:flex-row">
            {buttonLinks.map(link => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center w-full px-5 py-3 text-sm font-medium text-white transition-all duration-300 border-2 border-transparent rounded-lg shadow-lg outline-none sm:w-auto bg-gradient-to-r from-cyber-pink to-cyber-cyan group hover:shadow-cyber-glow focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-cyber-black focus:ring-cyber-pink active:scale-95"
              >
                {link.icon}
                <span>{link.label}</span>
              </a>
            ))}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
