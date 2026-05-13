interface VoiceInputButtonProps {
  isListening: boolean;
  isSupported: boolean;
  onStart: () => void;
  onStop: () => void;
}

export function VoiceInputButton({
  isListening,
  isSupported,
  onStart,
  onStop,
}: VoiceInputButtonProps) {
  if (!isSupported) {
    return (
      <button
        disabled
        title="Voice input not supported in this browser"
        className="flex-shrink-0 p-3 rounded-xl bg-gray-100 text-gray-900 cursor-not-allowed"
        aria-label="Voice input not supported"
      >
        <MicOffIcon />
      </button>
    );
  }

  return (
    <button
      onClick={isListening ? onStop : onStart}
      title={isListening ? 'Stop listening' : 'Speak to translate'}
      aria-label={isListening ? 'Stop listening' : 'Speak your word or phrase'}
      className={`relative flex-shrink-0 p-3 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2
        ${
          isListening
            ? 'bg-red-500 text-white focus:ring-red-400 mic-pulse'
            : 'bg-saffron-500 text-white hover:bg-saffron-600 focus:ring-saffron-400'
        }`}
    >
      {isListening ? <MicActiveIcon /> : <MicIcon />}
    </button>
  );
}

function MicIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 1a4 4 0 0 1 4 4v6a4 4 0 0 1-8 0V5a4 4 0 0 1 4-4zm-7 9a1 1 0 0 1 2 0 5 5 0 0 0 10 0 1 1 0 1 1 2 0 7 7 0 0 1-6 6.92V19h2a1 1 0 1 1 0 2H9a1 1 0 1 1 0-2h2v-2.08A7 7 0 0 1 5 10z"/>
    </svg>
  );
}

function MicActiveIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 animate-pulse" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 1a4 4 0 0 1 4 4v6a4 4 0 0 1-8 0V5a4 4 0 0 1 4-4zm-7 9a1 1 0 0 1 2 0 5 5 0 0 0 10 0 1 1 0 1 1 2 0 7 7 0 0 1-6 6.92V19h2a1 1 0 1 1 0 2H9a1 1 0 1 1 0-2h2v-2.08A7 7 0 0 1 5 10z"/>
    </svg>
  );
}

function MicOffIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M2.28 3L1 4.27l6.97 6.97A7 7 0 0 0 19 17.73l2.72 2.72L23 19.17 2.28 3zM12 15a5 5 0 0 1-5-5V7.27l9.79 9.79A5 5 0 0 1 12 15zm4-5a4 4 0 0 0-8 0v.27l8 8V10zm-4-9a4 4 0 0 1 4 4v1.17l2 2V5a6 6 0 1 0-11.32 2.88L8.84 5.72A4 4 0 0 1 12 1z"/>
    </svg>
  );
}
