interface ForgotPasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function ForgotPasswordModal({
    isOpen,
    onClose,
}: ForgotPasswordModalProps) {

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center px-4">

            {/* Modal */}
            <div className="relative w-full max-w-md rounded-4xl bg-black p-8 text-white">

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-5 right-5 text-4xl leading-none"
                >
                    ×
                </button>

                {/* Warning Icon */}
                <div className="flex justify-center mb-8">
                    <div className="w-12 h-12 rounded-full border-4 border-white flex items-center justify-center text-3xl">
                        !
                    </div>
                </div>

                {/* Message */}
                <p className="text-center text-md leading-snug">
                    For security reasons, password resets must be handled at the SSC Office.
                </p>

                <p className="text-center text-md leading-snug mt-4">
                Please visit the office to request a password reset.
                </p>
            </div>
        </div>
    );
}