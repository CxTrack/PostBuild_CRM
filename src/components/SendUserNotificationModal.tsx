import React from 'react';
import { X } from 'lucide-react';
import NotificationSender from './NotificationSender';

interface SendUserNotificationModalProps {
  isOpen: boolean; 
  userId: string; // TODO: Inject this var into NotificationSender
  onClose: () => void;
  title: string;
}

const SendUserNotificationModal: React.FC<SendUserNotificationModalProps> = ({
  isOpen,
  onClose,
  title,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-dark-800 rounded-lg p-6 w-full max-w-4xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>
        
        <p className="text-gray-300 mb-6">
          <NotificationSender></NotificationSender> 
        </p>      
      </div>
    </div>
  );
};

export default SendUserNotificationModal;