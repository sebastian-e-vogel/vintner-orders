'use client';

import { startTransition, useActionState, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { CurrentPolicy } from './CurrentPolicy';
import { formatTime } from './formatTimestamp';
import { PolicyOption } from './PolicyOption';
import {
  findPolicyOption,
  policyOptions,
  type InventoryPolicy,
} from './policyOptions';
import { SaveFeedback } from './SaveFeedback';
import { SwitchPolicyDialog } from './SwitchPolicyDialog';

export type SaveResult = { policy: InventoryPolicy; changedAt: string };

type InventoryPolicyFormProps = {
  currentPolicy: InventoryPolicy;
  changedAt: string;
  savedRequestCount: number;
  onSave: (policy: InventoryPolicy) => Promise<SaveResult>;
};

type SaveState = {
  status: 'idle' | 'success' | 'error';
  policy: InventoryPolicy;
  changedAt: string;
};

export function InventoryPolicyForm({
  currentPolicy,
  changedAt,
  savedRequestCount,
  onSave,
}: InventoryPolicyFormProps) {
  const [choice, setChoice] = useState(currentPolicy);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [state, saveAction, isPending] = useActionState<
    SaveState,
    InventoryPolicy
  >(
    async (previous, policy) => {
      try {
        const result = await onSave(policy);
        return {
          status: 'success',
          policy: result.policy,
          changedAt: result.changedAt,
        };
      } catch {
        return { ...previous, status: 'error' };
      } finally {
        dialogRef.current?.close();
      }
    },
    { status: 'idle', policy: currentPolicy, changedAt },
  );

  const isUnchanged = choice === state.policy;
  const chosen = findPolicyOption(choice);
  const showSuccess = state.status === 'success' && isUnchanged && !isPending;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    dialogRef.current?.showModal();
  }

  return (
    <>
      <p className="mt-2 text-muted">
        One setting for the whole company. It decides whether a request can be
        saved when a wine is requested above its available stock.
      </p>
      <form
        onSubmit={handleSubmit}
        className="mt-6 flex max-w-[60rem] flex-col gap-5 rounded-md border border-border bg-surface p-6"
      >
        <CurrentPolicy policy={state.policy} changedAt={state.changedAt} />
        <fieldset className="flex flex-col gap-3" disabled={isPending}>
          <legend className="mb-2 text-lg font-medium">
            Applies to every rep
          </legend>
          {policyOptions.map((option) => (
            <PolicyOption
              key={option.value}
              option={option}
              checked={choice === option.value}
              onSelect={() => setChoice(option.value)}
            />
          ))}
        </fieldset>
        <SaveFeedback
          success={
            showSuccess
              ? {
                  label: findPolicyOption(state.policy).label,
                  time: formatTime(state.changedAt),
                }
              : null
          }
          hasError={state.status === 'error' && !isPending}
        />
        <div>
          <Button
            type="submit"
            disabled={isPending || isUnchanged}
            loadingLabel={isPending ? 'Applying' : undefined}
          >
            {isUnchanged
              ? `${chosen.label} is in use`
              : `Change to ${chosen.label}…`}
          </Button>
        </div>
      </form>
      <SwitchPolicyDialog
        ref={dialogRef}
        policy={choice}
        savedRequestCount={savedRequestCount}
        isPending={isPending}
        onConfirm={() => startTransition(() => saveAction(choice))}
        onClose={() => dialogRef.current?.close()}
      />
    </>
  );
}
