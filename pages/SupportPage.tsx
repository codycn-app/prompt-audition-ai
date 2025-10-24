import React, { useState } from 'react';
import { HeartIcon } from '../components/icons/HeartIcon';
import { QR_CODE_URL } from '../constants';
import { CopyIcon } from '../components/icons/CopyIcon';
import { CheckIcon } from '../components/icons/CheckIcon';

const SupportPage: React.FC = () => {
    const [isCopied, setIsCopied] = useState(false);
    const accountNumber = '0931004209434';

    const handleCopy = () => {
        navigator.clipboard.writeText(accountNumber);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    return (
        // Increased max-width for better layout on larger screens
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8 animate-fade-in-scale">
            <div className="flex flex-col items-center text-center mb-8">
                <h1 className="text-4xl font-bold font-oxanium text-cyber-on-surface">Ủng hộ Dự án AUDITION AI</h1>
                <p className="mt-2 text-cyber-on-surface-secondary">Sự ủng hộ của bạn là nguồn động lực to lớn!</p>
            </div>

            <div 
                className="w-full flex flex-col overflow-hidden rounded-xl shadow-2xl bg-cyber-surface/80 backdrop-blur-2xl shadow-cyber-glow"
                // Updated border gradient to match app theme (pink to cyan)
                style={{border: '1px solid transparent', background: 'linear-gradient(#1A1A1A, #1A1A1A) padding-box, linear-gradient(120deg, rgba(255, 0, 230, 0.5), rgba(0, 255, 255, 0.5)) border-box'}}
            >
                <div className="p-6 sm:p-8">
                    <div className="flex items-start gap-4">
                        {/* Changed icon color to pink */}
                        <HeartIcon className="w-8 h-8 text-cyber-pink flex-shrink-0 mt-1" />
                        <div>
                            <h2 className="text-xl font-bold text-cyber-on-surface">Cảm ơn bạn đã ghé thăm!</h2>
                            <p className="mt-2 text-cyber-on-surface-secondary">
                                Nếu bạn thấy ứng dụng này hữu ích và muốn khích lệ tinh thần để đội ngũ phát triển có thể tiếp tục phát triển và duy trì dự án AUDITION AI, bạn có thể ủng hộ một ly cà phê. Mọi đóng góp, dù nhỏ nhất, đều vô cùng quý giá.
                            </p>
                        </div>
                    </div>
                    
                    {/* Added a subtle separator */}
                    <hr className="my-6 border-t border-cyber-pink/20" />

                    {/* Restructured for a balanced side-by-side layout on medium screens and up */}
                    <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
                        {/* Bank Info Section (no internal borders for a cleaner look) */}
                        <div className="flex-grow w-full space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-cyber-on-surface-secondary">Ngân hàng</span>
                                <span className="font-semibold text-cyber-on-surface">Vietcombank</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-cyber-on-surface-secondary">Số tài khoản</span>
                                <div className="flex items-center gap-3">
                                    <span className="font-semibold text-cyber-on-surface">{accountNumber}</span>
                                    <button onClick={handleCopy} className="text-cyber-on-surface-secondary hover:text-cyber-cyan transition-colors" aria-label="Sao chép số tài khoản">
                                        {isCopied ? <CheckIcon className="w-5 h-5 text-cyber-cyan"/> : <CopyIcon className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-cyber-on-surface-secondary">Chủ tài khoản</span>
                                <span className="font-semibold tracking-wider text-cyber-on-surface">NGUYEN QUOC CUONG</span>
                            </div>
                        </div>

                        {/* QR Code Section with hover effect */}
                        <div className="flex-shrink-0 text-center transition-transform duration-300 ease-in-out hover:scale-105">
                            <div className="w-48 p-1 mx-auto bg-white rounded-xl shadow-lg aspect-square">
                                <img 
                                    src={QR_CODE_URL} 
                                    alt="Mã QR ủng hộ" 
                                    className="w-full h-full object-contain rounded-lg"
                                />
                            </div>
                            <p className="mt-3 text-sm text-cyber-on-surface-secondary italic">Quét mã QR để ủng hộ dự án nhé ^^!</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SupportPage;