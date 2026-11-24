// A disabled fieldset turns off every control inside it without a prop on each one.
export function LockGroup({
  isLocked,
  children,
}: {
  isLocked: boolean;
  children: React.ReactNode;
}) {
  return (
    <fieldset disabled={isLocked} className="contents">
      {children}
    </fieldset>
  );
}
