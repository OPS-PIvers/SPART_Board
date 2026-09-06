import React from 'react';
import type { FieldProps } from '../FieldProps';
import type { CustomField } from '../../schema/types';

const CustomImpl: React.FC<FieldProps> = ({ field, ctx, updateConfig }) => {
  if (field.type !== 'custom' || !updateConfig) return null;
  return <>{field.render({ ...ctx, updateConfig })}</>;
};

// Keyed on [widget.id, field.key, field.render, updateConfig] so a keystroke elsewhere
// never rebuilds the custom element tree — ctx identity is deliberately not compared.
export const Custom = React.memo(CustomImpl, (prev, next) => {
  const prevField = prev.field as CustomField<string>;
  const nextField = next.field as CustomField<string>;
  return (
    prev.ctx.widget.id === next.ctx.widget.id &&
    prevField.key === nextField.key &&
    prevField.render === nextField.render &&
    prev.updateConfig === next.updateConfig
  );
});
