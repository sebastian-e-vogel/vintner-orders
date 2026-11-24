import { type SavedRequestLine } from './savedRequest';

type StockAtSaveProps = {
  line: SavedRequestLine;
};

export function StockAtSave({ line }: StockAtSaveProps) {
  const short = line.shortBy;

  return short > 0 ? (
    <span className="text-warning">
      <strong>Short by {short}</strong> ({line.availableAtSave} available)
    </span>
  ) : (
    <span className="text-success">Within stock ({line.availableAtSave})</span>
  );
}
