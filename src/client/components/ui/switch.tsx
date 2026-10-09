import * as React from 'react';
import { cn } from 'cn';
import { Switch as SwitchPrimitive } from 'radix-ui';

// iOS 風のトグル。サイズと色は以前の自作 ToggleSwitch に合わせている
function Switch({ className, ...props }: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        'peer relative inline-flex h-7.75 w-12.75 shrink-0 items-center rounded-full p-0.5 transition-colors duration-300 ease-in-out outline-none after:absolute after:-inset-2 focus-visible:ring-3 focus-visible:ring-ring/50 data-checked:bg-[#34C759] data-unchecked:bg-[#39393D] data-disabled:cursor-not-allowed data-disabled:opacity-50',
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className="pointer-events-none block size-6.75 rounded-full bg-white shadow-md transition-transform duration-300 ease-in-out data-checked:translate-x-5 data-unchecked:translate-x-0"
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
