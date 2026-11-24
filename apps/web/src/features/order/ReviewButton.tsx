import { useSyncExternalStore } from 'react';
import { Button } from '@/components/ui/Button';

const subscribe = () => () => {};
const isMac = () => /Mac|iPhone|iPad/.test(navigator.userAgent);

// The server and the first client render show nothing, so hydration matches.
function ShortcutHint() {
  const hint = useSyncExternalStore(
    subscribe,
    () => (isMac() ? '⌘↵' : 'Ctrl+↵'),
    () => '',
  );
  if (!hint) return null;
  return (
    <kbd className="ml-2 rounded border border-primary-foreground/40 px-1.5 font-sans text-xs">
      {hint}
    </kbd>
  );
}

type ReviewButtonProps = {
  label: string;
  onClick: () => void;
};

export function ReviewButton({ label, onClick }: ReviewButtonProps) {
  return (
    <Button
      type="button"
      className="w-full"
      aria-keyshortcuts="Control+Enter Meta+Enter"
      onClick={onClick}
    >
      {label}
      <ShortcutHint />
    </Button>
  );
}
