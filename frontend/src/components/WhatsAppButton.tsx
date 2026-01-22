import { MessageCircle } from 'lucide-react';

interface WhatsAppButtonProps {
  phoneNumber?: string;
  message?: string;
}

export default function WhatsAppButton({ 
  phoneNumber = '254759599124',
  message = 'Hello! I need assistance with my loan inquiry.'
}: WhatsAppButtonProps) {
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-green-500 hover:bg-green-600 text-white px-4 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 group"
      aria-label="Chat on WhatsApp"
    >
      <MessageCircle className="h-6 w-6" />
      <span className="hidden sm:inline font-medium">Chat with us</span>
    </a>
  );
}
