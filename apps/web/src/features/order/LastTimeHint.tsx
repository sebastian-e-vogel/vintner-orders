import { describeWine, type Wine } from './wine';

type LastTimeHintProps = {
  wine: Wine;
  quantity: number;
  onUse: (wineId: string, quantityText: string) => void;
};

export function LastTimeHint({ wine, quantity, onUse }: LastTimeHintProps) {
  return (
    <button
      type="button"
      className="rounded-md text-xs text-muted underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      onClick={() => onUse(wine.id, String(quantity))}
    >
      Last time: {quantity}{' '}
      <span className="sr-only">for {describeWine(wine)}</span>
    </button>
  );
}
