'use client';

export function ToggleSwitch({
  checked,
  onChange,
  disabled = false,
}: {
  checked: boolean;
  onChange: (nextValue: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      disabled={disabled}
      className={`inline-flex items-center justify-center -m-2 p-2 rounded-full ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      }`}
    >
      <div
        className={`w-12.75 h-7.75 rounded-full p-0.5 transition-colors duration-300 ease-in-out ${
          checked ? 'bg-[#34C759]' : 'bg-[#39393D]'
        }`}
      >
        <div
          className={`bg-white w-6.75 h-6.75 rounded-full shadow-md transform transition-transform duration-300 ease-in-out ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </div>
    </button>
  );
}
