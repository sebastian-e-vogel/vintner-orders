import type { PolicyOptionData } from './policyOptions';

type PolicyOptionProps = {
  option: PolicyOptionData;
  checked: boolean;
  onSelect: () => void;
};

export function PolicyOption({ option, checked, onSelect }: PolicyOptionProps) {
  return (
    <label className="flex cursor-pointer gap-3 rounded-md border border-border p-4 has-checked:border-primary has-checked:bg-primary-soft has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ring">
      <input
        type="radio"
        name="policy"
        value={option.value}
        checked={checked}
        onChange={onSelect}
        className="mt-1"
      />
      <span className="flex flex-col gap-1">
        <span className="font-medium">
          {option.label} — {option.tagline}
        </span>
        <span className="text-sm">{option.summary}</span>
        <ul className="list-disc pl-5 text-sm text-muted">
          {option.bullets.map((bullet) => (
            <li key={bullet}>{bullet}</li>
          ))}
        </ul>
      </span>
    </label>
  );
}
