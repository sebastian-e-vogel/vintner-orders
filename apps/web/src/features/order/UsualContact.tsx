import { Button } from '@/components/ui/Button';

type UsualContactProps = {
  name: string;
  phone: string;
  isInUse: boolean;
  onUse: () => void;
};

export function UsualContact({
  name,
  phone,
  isInUse,
  onUse,
}: UsualContactProps) {
  return (
    <p className="flex flex-wrap items-center gap-3 text-sm">
      <span>
        Usual contact: <strong>{name}</strong> · {phone}
      </span>
      {isInUse ? (
        <span className="text-success">✓ Using usual contact</span>
      ) : (
        <Button type="button" variant="secondary" onClick={onUse}>
          Use usual contact
        </Button>
      )}
    </p>
  );
}
