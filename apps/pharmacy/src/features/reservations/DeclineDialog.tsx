'use client';

import { useState } from 'react';
import { isValidDeclineReason } from '@medfind/core';
import { Button, Icon, Text, cssVar } from '@medfind/ui/web';
import { decline } from './store';
import s from './reservations.module.css';

const MAX = 350;

/** Decline reason popup (Figma 2620:124268). The customer sees the reason straight away. */
export function DeclineDialog({ id, name, onClose, onDeclined }: { id: string; name: string; onClose: () => void; onDeclined?: () => void }) {
  const [reason, setReason] = useState('');
  return (
    <div className={s.scrim} onClick={onClose}>
      <div className={s.dialog} role="dialog" aria-modal aria-labelledby="decline-title" onClick={(e) => e.stopPropagation()}>
        <div className={s.headingBlock}>
          <Text variant="h4" as="h2" color={cssVar.text.primary}>
            <span id="decline-title">Decline {name}’s reservation?</span>
          </Text>
          <Text variant="body2" as="p" color={cssVar.text.secondary}>
            Tell {name} why. They’re refunded straight away and can reserve at another pharmacy.
          </Text>
        </div>
        <label className={s.field}>
          <span className={s.row} style={{ gap: 8 }}>
            <Text variant="label1" color={cssVar.input.label}>
              Reason<span style={{ color: cssVar.text.required }}>*</span>
            </Text>
            <Icon name="info-circle" size={16} color={cssVar.text.secondary} />
          </span>
          <span className={s.textareaBox}>
            <textarea
              className={`${s.textarea} mf-t-label2`}
              placeholder="e.g. The prescription has expired"
              maxLength={MAX}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              autoFocus
            />
            <span className={s.counter}>
              <Text variant="caption2" color={cssVar.text.secondary}>
                {reason.length}/{MAX}
              </Text>
            </span>
          </span>
          <span className={s.helper}>
            <Icon name="info-circle" size={14} />
            <Text variant="caption2">{name} will see this message.</Text>
          </span>
        </label>
        <div className={s.buttons} style={{ marginTop: 0 }}>
          <Button label="Cancel" variant="secondary" fullWidth onPress={onClose} />
          <Button
            label="Decline reservation"
            variant="destructive-primary"
            fullWidth
            disabled={!isValidDeclineReason(reason)}
            onPress={() => {
              decline(id, reason);
              onClose();
              onDeclined?.();
            }}
          />
        </div>
      </div>
    </div>
  );
}
