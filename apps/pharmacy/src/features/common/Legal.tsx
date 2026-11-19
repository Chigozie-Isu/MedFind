'use client';

import { useState } from 'react';
import { Button, Text, cssVar } from '@medfind/ui/web';
import { Modal } from './ui';
import c from './common.module.css';

const DOCS = {
  terms: {
    title: 'MedFind Terms for pharmacies',
    points: [
      'By listing on MedFind you confirm your premises hold a valid PCN licence and a superintendent pharmacist is on duty during opening hours.',
      'You keep stock levels accurate, honour reservations you accept, and release medicine only against a valid pickup code.',
      'Prescription-only medicines are released only after you have checked the prescription. MedFind pays out online sales every second Friday, less the agreed fee.',
    ],
  },
  privacy: {
    title: 'Privacy Policy',
    points: [
      'MedFind stores your pharmacy details, staff codes and sales records to run the service and pay you.',
      'Patient details you see are only for filling their reservation. Don’t copy or share them outside MedFind.',
      'You can ask for a copy of your data, or for it to be deleted, by emailing privacy@medfind.ng.',
    ],
  },
};

/** Figma "Overlay – medFind Terms" (2459:81834) and "Overlay – privacy Policy" (2459:81851). */
export function LegalLink({ doc, label }: { doc: keyof typeof DOCS; label: string }) {
  const [open, setOpen] = useState(false);
  const d = DOCS[doc];
  return (
    <>
      <button
        type="button"
        className={c.linkBtn}
        style={{ font: 'inherit', textDecoration: 'underline' }}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
        }}
      >
        {label}
      </button>
      {open && (
        <Modal title={d.title} width={560} onClose={() => setOpen(false)} footer={<Button label="Got it" size="medium" onPress={() => setOpen(false)} />}>
          <ol style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {d.points.map((p) => (
              <li key={p}>
                <Text variant="body3" color={cssVar.text.secondary}>
                  {p}
                </Text>
              </li>
            ))}
          </ol>
        </Modal>
      )}
    </>
  );
}
