import React from 'react';
import type { FieldProps } from '../FieldProps';
import type { CustomField } from '../../schema/types';

const CustomImpl: React.FC<FieldProps> = ({
  field,
  ctx,
  updateConfig,
  id,
  labelId,
  describedBy,
}) => {
  if (field.type !== 'custom' || !updateConfig) return null;
  return (
    <>
      {field.render({
        ...ctx,
        updateConfig,
        id,
        labelId: labelId ?? `${id}-label`,
        describedBy,
      })}
    </>
  );
};

function sameConfig(
  a: Record<string, unknown>,
  b: Record<string, unknown>
): boolean {
  if (a === b) return true;
  const keys = Object.keys(a);
  if (keys.length !== Object.keys(b).length) return false;
  return keys.every((key) => Object.is(a[key], b[key]));
}

// Re-renders on a config change (shallow), a language switch (ctx.t), or a new render/updateConfig; a parent repaint alone never rebuilds the tree.
export const Custom = React.memo(CustomImpl, (prev, next) => {
  const prevField = prev.field as CustomField<string>;
  const nextField = next.field as CustomField<string>;
  return (
    prev.ctx.widget === next.ctx.widget &&
    prev.ctx.isAdmin === next.ctx.isAdmin &&
    prev.ctx.t === next.ctx.t &&
    sameConfig(prev.ctx.config, next.ctx.config) &&
    prevField.key === nextField.key &&
    prevField.render === nextField.render &&
    prev.updateConfig === next.updateConfig &&
    prev.id === next.id &&
    prev.labelId === next.labelId &&
    prev.describedBy === next.describedBy
  );
});
