import { UserCircle } from 'lucide-react';

interface MessageIllustrationProps {
  message: string;
  action: string;
}

export function MessageIllustration({
  message,
  action,
}: MessageIllustrationProps) {
  return (
    <div className="relative">
      {/* Message Bubble */}
      <div className="bg-gray-100 rounded-2xl rounded-tl-none px-4 py-3 max-w-xs shadow-sm relative">
        {/* Triangle shape pointing to top-left */}
        <div className="absolute rotate-90 -left-2 top-0 w-0 h-0 border-t-[12px] border-t-gray-100 border-r-[12px] border-r-transparent"></div>

        {/* User Icon and Message */}
        <div className="flex items-start gap-2">
          <UserCircle className="w-5 h-5 text-gray-600 flex-shrink-0" />
          <p className="text-sm text-gray-700">{message}</p>
        </div>
      </div>

      {/* Action Badge */}
      <div className="absolute top-[80%] left-4 bg-black text-white text-xs px-3 py-1 rounded-full shadow-md">
        {action}
      </div>
    </div>
  );
}
