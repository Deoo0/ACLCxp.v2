import { useNavigate } from "react-router-dom";

interface ModalProps {
  title: string;
  message: string;
  actionLabel: string;
  actionTo: string;
  onClose: () => void;
}

export default function Modal({ title, message, actionLabel, actionTo, onClose }: ModalProps) {
  const navigate = useNavigate();

  const handleAction = () => {
    onClose();
    navigate(actionTo, { replace: true });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icon */}
        <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-[#2E308E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
        </div>

        {/* Text */}
        <h2 className="text-center text-base font-semibold text-gray-900 mb-1">{title}</h2>
        <p className="text-center text-sm text-gray-400 mb-6">{message}</p>

        {/* Buttons */}
        <button
          onClick={handleAction}
          className="w-full py-2.5 bg-[#2E308E] text-white text-sm font-semibold rounded-xl hover:bg-indigo-800 transition-colors mb-2"
        >
          {actionLabel}
        </button>
        <button
          onClick={onClose}
          className="w-full py-2.5 text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}