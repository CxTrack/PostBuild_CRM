import React, { useRef } from 'react';
import { Send, Paperclip, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export interface CoPilotInputProps {
  input: string;
  setInput: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  hasMessages: boolean;
  onClear: () => void;
  /** Auto-focus the textarea on mount */
  autoFocus?: boolean;
  /** External ref for the textarea (e.g. to focus from parent) */
  textareaRef?: React.RefObject<HTMLTextAreaElement>;
}

const CoPilotInput: React.FC<CoPilotInputProps> = ({
  input,
  setInput,
  onSubmit,
  isLoading,
  hasMessages,
  onClear,
  autoFocus = false,
  textareaRef,
}) => {
  const internalRef = useRef<HTMLTextAreaElement>(null);
  const ref = textareaRef || internalRef;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit(e);
    }
  };

  return (
    <div className="p-4 border-t border-gray-200 dark:border-gray-700">
      <form onSubmit={onSubmit} className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <textarea
              ref={ref}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask CoPilot anything..."
              autoFocus={autoFocus}
              className="
                w-full px-4 py-3 pr-10
                rounded-xl
                border
                bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600
                text-gray-900 dark:text-white
                placeholder:text-gray-400 dark:placeholder:text-gray-500
                focus:border-purple-500 focus:outline-none
                resize-none
                transition-colors
                max-h-32
              "
              rows={1}
              style={{ minHeight: '48px' }}
            />

            {hasMessages && (
              <button
                type="button"
                onClick={onClear}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-600"
                title="Clear conversation"
              >
                <Trash2 className="w-4 h-4 text-gray-400 dark:text-gray-500" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 self-end pb-0.5">
            <input
              type="file"
              id="copilot-file-upload"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  toast.success(`File "${file.name}" selected for upload`);
                }
              }}
            />
            <label
              htmlFor="copilot-file-upload"
              className="p-3 rounded-xl border transition-all cursor-pointer bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white hover:border-gray-300 dark:hover:border-gray-500"
              title="Upload file"
            >
              <Paperclip className="w-5 h-5" />
            </label>

            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="
                p-3 rounded-xl
                bg-gradient-to-br from-purple-500 to-purple-600
                text-white
                shadow-md
                hover:from-purple-600 hover:to-purple-700
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-all
              "
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </form>

      <p className="text-xs text-gray-500 mt-3 text-center">
        Press Enter to send &bull; Shift+Enter for new line
      </p>
    </div>
  );
};

export default CoPilotInput;
