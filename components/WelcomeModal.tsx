import React, { useEffect, useRef } from 'react';
import { CloseIcon } from './icons/CloseIcon';
import { FacebookIcon } from './icons/FacebookIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { TikTokIcon } from './icons/TikTokIcon';
import { ArrowUpRightIcon } from './icons/ArrowUpRightIcon';

interface WelcomeModalProps {
  onClose: () => void;
}

const socialLinks = [
  {
    label: 'Facebook',
    description: 'Theo dõi CodyCN',
    actionLabel: 'Theo dõi Facebook',
    href: 'https://www.facebook.com/codycn2804/',
    icon: FacebookIcon,
    className: 'welcome-social-facebook',
  },
  {
    label: 'TikTok',
    description: '@auditionai.io.vn',
    actionLabel: 'Theo dõi TikTok',
    href: 'https://www.tiktok.com/@auditionai.io.vn',
    icon: TikTokIcon,
    className: 'welcome-social-tiktok',
  },
  {
    label: 'AUDITION AI',
    description: 'Ứng dụng tạo ảnh AI',
    actionLabel: 'Mở ứng dụng AUDITION AI',
    href: 'https://auditionai.io.vn/',
    icon: SparklesIcon,
    className: 'welcome-social-app',
  },
];

const WelcomeModal: React.FC<WelcomeModalProps> = ({ onClose }) => {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const appLink = socialLinks[2];

  useEffect(() => {
    closeButtonRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="welcome-modal fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/75 p-3 backdrop-blur-md sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Thông báo chào mừng Prompt Audition AI"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="welcome-stage relative my-auto w-full max-w-2xl py-5 sm:py-8">
        <div className="welcome-orbit welcome-orbit-one" aria-hidden="true" />
        <div className="welcome-orbit welcome-orbit-two" aria-hidden="true" />

        <section className="welcome-panel relative overflow-hidden rounded-2xl border border-white/15 bg-[#161222]/95 shadow-2xl">
          <div className="welcome-grid absolute inset-0" aria-hidden="true" />
          <div className="welcome-light-strip absolute inset-x-0 top-0 h-px" aria-hidden="true" />

          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 z-10 inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-black/25 text-cyber-on-surface-secondary transition duration-200 hover:border-cyber-pink/70 hover:bg-cyber-pink/15 hover:text-white focus:outline-none focus:ring-2 focus:ring-cyber-cyan focus:ring-offset-2 focus:ring-offset-[#161222] active:scale-95"
            aria-label="Đóng thông báo chào mừng"
            title="Đóng"
          >
            <CloseIcon className="h-6 w-6" />
          </button>

          <div className="relative px-5 pb-6 pt-9 text-center sm:px-10 sm:pb-9 sm:pt-10">
            <div className="welcome-archive-mark relative mx-auto mb-4 grid h-[64px] w-[130px] place-items-center sm:mb-7 sm:h-[76px] sm:w-[150px]" aria-hidden="true">
              <span className="welcome-prompt-card welcome-prompt-card-one">PROMPT</span>
              <span className="welcome-prompt-card welcome-prompt-card-two">ART</span>
              <div className="welcome-crystal-core relative z-10 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-cyber-pink via-fuchsia-500 to-cyber-cyan shadow-cyber-glow">
                <SparklesIcon className="h-8 w-8 text-white sm:h-9 sm:w-9" />
              </div>
            </div>

            <div className="hidden sm:block">
              <p className="welcome-kicker mb-3 text-sm font-bold uppercase">Thư viện câu lệnh tạo ảnh AI</p>
              <h2 id="welcome-modal-title" className="mx-auto max-w-xl font-oxanium text-4xl font-semibold leading-tight text-white">
                Chào mừng bạn đến với <span className="text-transparent bg-gradient-to-r from-cyber-pink via-fuchsia-300 to-cyber-cyan bg-clip-text">Prompt Audition AI</span>
              </h2>
              <p className="welcome-stat mx-auto mt-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold">
                <span className="welcome-stat-dot" aria-hidden="true" /> Hơn 1.000+ câu lệnh đang chờ bạn khám phá
              </p>
              <p className="mx-auto mt-3 max-w-lg text-base leading-7 text-cyber-on-surface-secondary">
                Kho dữ liệu tổng hợp hơn 1.000+ câu lệnh tạo ảnh AI, được cập nhật liên tục để đồng hành cùng mọi ý tưởng của bạn.
              </p>
              <div className="my-7 flex items-center gap-3 text-left">
                <span className="h-px flex-1 bg-gradient-to-r from-transparent to-cyber-pink/70" aria-hidden="true" />
                <span className="text-[11px] font-bold uppercase text-cyber-on-surface-secondary">Kết nối cùng chúng tôi</span>
                <span className="h-px flex-1 bg-gradient-to-l from-transparent to-cyber-cyan/70" aria-hidden="true" />
              </div>
              <div className="grid gap-3 text-left sm:grid-cols-2">
                {socialLinks.map(({ label, description, actionLabel, href, icon: Icon, className }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`welcome-social-link group flex min-h-[76px] items-center gap-3 rounded-xl border p-3 transition duration-200 focus:outline-none focus:ring-2 focus:ring-cyber-cyan focus:ring-offset-2 focus:ring-offset-[#161222] active:scale-[0.98] ${className}`}
                    aria-label={actionLabel}
                  >
                    <span className="welcome-social-icon grid h-11 w-11 shrink-0 place-items-center rounded-lg transition duration-200 group-hover:scale-105">
                      <Icon className="h-6 w-6" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-bold leading-5">{actionLabel}</span>
                      <span className="mt-0.5 block text-xs leading-4 text-white/65">{description}</span>
                    </span>
                    <ArrowUpRightIcon className="welcome-social-arrow ml-auto h-5 w-5 shrink-0" />
                  </a>
                ))}
              </div>
            </div>

            <div className="sm:hidden">
              <p className="welcome-kicker mb-2 text-xs font-bold uppercase">Thư viện câu lệnh tạo ảnh AI</p>
              <h2 id="welcome-modal-title-mobile" className="mx-auto max-w-xs font-oxanium text-2xl font-semibold leading-tight text-white">
                Khám phá <span className="text-transparent bg-gradient-to-r from-cyber-pink via-fuchsia-300 to-cyber-cyan bg-clip-text">Prompt Audition AI</span>
              </h2>
              <p className="mx-auto mt-2 max-w-xs text-sm leading-5 text-cyber-on-surface-secondary">Hơn 1.000+ câu lệnh sẵn sàng cho ý tưởng của bạn.</p>
              <a href={appLink.href} target="_blank" rel="noopener noreferrer" className="welcome-social-link welcome-social-app mt-5 flex min-h-[68px] items-center gap-3 rounded-xl border p-3 text-left transition duration-200 focus:outline-none focus:ring-2 focus:ring-cyber-cyan focus:ring-offset-2 focus:ring-offset-[#161222] active:scale-[0.98]" aria-label={appLink.actionLabel}>
                <span className="welcome-social-icon grid h-11 w-11 shrink-0 place-items-center rounded-lg">
                  <SparklesIcon className="h-6 w-6" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-bold leading-5">Mở AUDITION AI</span>
                  <span className="mt-0.5 block text-xs leading-4 text-white/65">Ứng dụng tạo ảnh AI</span>
                </span>
                <ArrowUpRightIcon className="welcome-social-arrow ml-auto h-5 w-5 shrink-0" />
              </a>
              <div className="mt-3 grid grid-cols-2 gap-3 text-left">
                {socialLinks.slice(0, 2).map(({ label, actionLabel, href, icon: Icon, className }) => (
                  <a key={label} href={href} target="_blank" rel="noopener noreferrer" className={`welcome-social-link flex min-h-14 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-bold ${className}`} aria-label={actionLabel}>
                    <Icon className="h-5 w-5 shrink-0" /><span>{label}</span>
                  </a>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="mt-6 inline-flex min-h-11 items-center justify-center rounded-lg bg-gradient-to-r from-cyber-pink to-cyber-cyan px-7 py-3 text-sm font-bold text-white shadow-cyber-glow transition duration-200 hover:-translate-y-0.5 hover:shadow-cyber-glow-lg focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#161222] active:translate-y-0 active:scale-95"
            >
              Bắt đầu khám phá
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default WelcomeModal;
