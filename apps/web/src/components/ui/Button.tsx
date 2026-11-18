import { Spinner } from './Spinner';

type ButtonProps = React.ComponentProps<'button'> & {
  variant?: 'primary' | 'secondary';
  // When set, a spinner replaces the content without changing the button's width.
  loadingLabel?: string;
};

export function Button({
  variant = 'primary',
  loadingLabel,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`relative rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
        variant === 'primary'
          ? 'bg-primary text-primary-foreground'
          : 'border border-border'
      } ${className ?? ''}`}
      {...props}
    >
      {loadingLabel ? (
        <>
          <span className="invisible">{children}</span>
          <span className="absolute inset-0 grid place-items-center">
            <Spinner label={loadingLabel} />
          </span>
        </>
      ) : (
        children
      )}
    </button>
  );
}
