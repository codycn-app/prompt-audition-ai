import React, { useEffect, useRef } from 'react';
import { CloseIcon } from './icons/CloseIcon';
import { FacebookIcon } from './icons/FacebookIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { TikTokIcon } from './icons/TikTokIcon';

interface WelcomeModalProps {
  onClose: () => void;
}

const socialLinks = [
  {
    label: 'Theo dõi Facebook',
    description: 'Cập nhật cảm hứng và tin mới',
    href: 'https://www.facebook.com/codycn2804/',
    icon: FacebookIcon,
    className: 'border-blue-400/35 bg-blue-500/10 text-blue-100 hover:border-blue-300 hover:bg-blue-500/20',
  },
  {
    label: 'Theo dõi TikTok',
    description: 'Xem ý tưởng và video ngắn',
    href: 'https://www.tiktok.com/@auditionai.io.vn',
    icon: TikTokIcon,
    className: 'border-cyber-pink/35 bg-cyber-pink/10 text-pink-100 hover:border-cyber-pink hover:bg-cyber-pink/20',
  },
  {
    label: 'Khám phá AUDITION AI',
    description: 'Mở ứng dụng tạo ảnh AI',
    href: 'https://auditionai.io.vn/',
    icon: SparklesIcon,
    className: 'border-cyber-cyan/35 bg-cyber-cyan/10 text-cyan-50 hover:border-cyber-cyan hover:bg-cyber-cyan/20',
  },
];

const WelcomeModal: React.FC<WelcomeModalProps> = ({ onClose }) => {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

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
      aria-labelledby="welcome-modal-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="welcome-stage relative my-auto w-full max-w-2xl py-5 sm:py-8">
        <div className="welcome-orbit welcome-orbit-one" aria-hidden="true" />
        <div className="welcome-orbit welcome-orbit-two" aria-hidden="true" />
        <div className="welcome-orbit welcome-orbit-three" aria-hidden="true" />

        <section className="welcome-panel relative overflow-hidden rounded-2xl border border-white/15 bg-[#161222]/95 shadow-2xl">
          <div className="welcome-grid absolute inset-0 opacity-40" aria-hidden="true" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyber-cyan to-transparent" aria-hidden="true" />

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

          <div className="relative px-5 pb-6 pt-9 text-center sm:px-10 sm:pb-9 sm:pt-12">
            <div className="welcome-crystal relative mx-auto mb-6 grid h-20 w-20 place-items-center sm:h-24 sm:w-24" aria-hidden="true">
              <div className="welcome-crystal-core grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-cyber-pink via-fuchsia-500 to-cyber-cyan shadow-cyber-glow sm:h-16 sm:w-16">
                <SparklesIcon className="h-8 w-8 text-white sm:h-9 sm:w-9" />
              </div>
            </div>

            <p className="mb-3 text-xs font-bold uppercase text-cyber-cyan sm:text-sm">Không gian sáng tạo dành cho bạn</p>
            <h2 id="welcome-modal-title" className="mx-auto max-w-xl font-oxanium text-2xl font-semibold leading-tight text-white sm:text-4xl">
              Chào mừng bạn đến với <span className="text-transparent bg-gradient-to-r from-cyber-pink to-cyber-cyan bg-clip-text">AUDITION 3D AI</span>
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-sm leading-6 text-cyber-on-surface-secondary sm:text-base sm:leading-7">
              Kho câu lệnh tạo ảnh được tuyển chọn để mỗi ý tưởng của bạn dễ dàng trở thành một khung hình ấn tượng. Chúc bạn một ngày đầy cảm hứng và tạo nên thật nhiều tác phẩm đẹp.
            </p>

            <div className="my-6 h-px bg-gradient-to-r from-transparent via-cyber-pink/60 to-transparent sm:my-7" aria-hidden="true" />

            <div className="grid gap-3 text-left sm:grid-cols-3">
              {socialLinks.map(({ label, description, href, icon: Icon, className }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`group flex min-h-20 items-center gap-3 rounded-xl border p-3 transition duration-200 focus:outline-none focus:ring-2 focus:ring-cyber-cyan focus:ring-offset-2 focus:ring-offset-[#161222] active:scale-[0.98] ${className}`}
                  aria-label={label}
                >
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-white/15 bg-black/25 transition duration-200 group-hover:scale-105">
                    <Icon className="h-6 w-6" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-bold leading-5">{label}</span>
                    <span className="mt-0.5 block text-xs leading-4 text-cyber-on-surface-secondary">{description}</span>
                  </span>
                </a>
              ))}
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
