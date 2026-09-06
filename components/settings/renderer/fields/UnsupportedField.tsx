import React from 'react';
import type { FieldProps } from '../FieldProps';

export const UnsupportedField: React.FC<FieldProps> = ({ field, id }) => (
  <p
    id={id}
    data-testid="unsupported-field"
    className="text-xxs text-slate-600 italic"
  >
    {`Unsupported field type: ${field.type}`}
  </p>
);
