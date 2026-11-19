'use client';

import { useRef, useState } from 'react';
import {
  allowedDocumentTypes,
  documentFileProblem,
  documentsComplete,
  formatFileSize,
  PHARMACY_DOCUMENTS,
  REQUIRED_DOCUMENT_COUNT,
  requiredDocumentsUploaded,
  type PharmacyDocumentKind,
} from '@medfind/core';
import { sizes } from '@medfind/ui';
import { Badge, Button, Icon, Text } from '@medfind/ui/web';
import { removeDocument, uploadDocument, type ApplicationDocument } from './api';
import { Notice, Section, signupStyles as s } from './Shell';

export interface UploadState {
  fileName: string;
  sizeBytes: number;
  progress: number;
  error?: string;
}

type LicenceKind = Exclude<PharmacyDocumentKind, 'shop_front'>;
const LICENCES = PHARMACY_DOCUMENTS.filter((d) => d.required) as unknown as { kind: LicenceKind; title: string; hint: string }[];
const SHOP_FRONT = PHARMACY_DOCUMENTS.find((d) => d.kind === 'shop_front')!;

/** Step 2 (Figma "Sign up step 2 – …"): the 3 licences, optional shop-front photos. */
export function StepDocuments({
  pharmacyId,
  documents,
  initialUploads = {},
  demo,
  onDocumentsChanged,
  onBack,
  onContinue,
}: {
  pharmacyId: string;
  documents: ApplicationDocument[];
  initialUploads?: Partial<Record<LicenceKind, UploadState>>;
  demo?: boolean;
  onDocumentsChanged: () => void;
  onBack: () => void;
  onContinue: () => void;
}) {
  const [uploads, setUploads] = useState<Partial<Record<LicenceKind, UploadState>>>(initialUploads);
  const [photoUploads, setPhotoUploads] = useState<(UploadState & { id: string })[]>([]);
  const cancels = useRef<Partial<Record<LicenceKind, () => void>>>({});
  const pickers = useRef<Partial<Record<string, HTMLInputElement | null>>>({});

  const uploaded = documents.map((d) => d.kind);
  const done = requiredDocumentsUploaded(uploaded);

  const startLicence = (kind: LicenceKind, file: File) => {
    const problem = documentFileProblem(kind, { sizeBytes: file.size, mimeType: file.type });
    if (problem) return setUploads((u) => ({ ...u, [kind]: { fileName: file.name, sizeBytes: file.size, progress: 0, error: problem } }));
    setUploads((u) => ({ ...u, [kind]: { fileName: file.name, sizeBytes: file.size, progress: 0 } }));
    if (demo) return;
    const h = uploadDocument(pharmacyId, kind, file, (progress) =>
      setUploads((u) => (u[kind] ? { ...u, [kind]: { ...u[kind]!, progress } } : u)),
    );
    cancels.current[kind] = h.cancel;
    h.done.then((res) => {
      delete cancels.current[kind];
      if (res.ok) {
        setUploads((u) => ({ ...u, [kind]: undefined }));
        onDocumentsChanged();
      } else if (res.reason === 'cancelled') {
        setUploads((u) => ({ ...u, [kind]: undefined }));
      } else {
        setUploads((u) => ({ ...u, [kind]: { ...u[kind]!, error: 'Upload failed. Check your connection and try again.' } }));
      }
    });
  };

  const startPhotos = (files: FileList) => {
    for (const file of Array.from(files)) {
      const id = `${Date.now()}-${Math.random()}`;
      const problem = documentFileProblem('shop_front', { sizeBytes: file.size, mimeType: file.type });
      setPhotoUploads((p) => [...p, { id, fileName: file.name, sizeBytes: file.size, progress: 0, error: problem ?? undefined }]);
      if (problem || demo) continue;
      const update = (patch: Partial<UploadState>) => setPhotoUploads((p) => p.map((x) => (x.id === id ? { ...x, ...patch } : x)));
      uploadDocument(pharmacyId, 'shop_front', file, (progress) => update({ progress })).done.then((res) => {
        if (res.ok) {
          setPhotoUploads((p) => p.filter((x) => x.id !== id));
          onDocumentsChanged();
        } else update({ error: `${file.name} didn’t upload. Try again.` });
      });
    }
  };

  const picker = (key: string, accept: readonly string[], onFiles: (f: FileList) => void, opts: { multiple?: boolean; capture?: boolean } = {}) => (
    <input
      ref={(el) => {
        pickers.current[key] = el;
      }}
      type="file"
      className={s.hidden}
      accept={accept.join(',')}
      multiple={opts.multiple}
      capture={opts.capture ? 'environment' : undefined}
      onChange={(e) => {
        if (e.target.files?.length) onFiles(e.target.files);
        e.target.value = '';
      }}
    />
  );

  const photos = documents.filter((d) => d.kind === 'shop_front');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className={s.progressCard} style={{ margin: '0 12px' }}>
        <div className={s.progressRow}>
          <Text variant="h5" color="var(--mf-text-heading)">{`${done} of ${REQUIRED_DOCUMENT_COUNT} required documents`}</Text>
          <Text variant="body3" color="var(--mf-text-secondary)">PDF, JPG or PNG · up to 10 MB each</Text>
        </div>
        <div className={s.bar} role="progressbar" aria-valuemin={0} aria-valuemax={REQUIRED_DOCUMENT_COUNT} aria-valuenow={done}>
          <div className={s.barFill} style={{ width: `${(done / REQUIRED_DOCUMENT_COUNT) * 100}%` }} />
        </div>
      </div>

      <div>
        {LICENCES.map((d) => {
          const doc = documents.find((x) => x.kind === d.kind);
          const up = uploads[d.kind];
          const state = up?.error ? 'error' : up ? 'uploading' : doc ? 'uploaded' : 'empty';
          return (
            <div key={d.kind} className={s.docRow}>
              <span className={s.docIcon} data-state={state}>
                <Icon name={state === 'uploading' ? 'upload' : 'document'} size={40} />
              </span>
              <div className={s.docText}>
                <div className={s.docTitle}>
                  <Text variant="h5" color="var(--mf-text-heading)">{d.title}</Text>
                  <Text variant="caption1" color="var(--mf-text-secondary)">· required</Text>
                </div>
                {state === 'error' ? (
                  <div className={`${s.mapError} mf-t-caption2`} role="alert">
                    <Icon name="danger-triangle" size={sizes.icon.xs} />
                    {up!.error}
                  </div>
                ) : (
                  <Text variant="caption1" color="var(--mf-text-secondary)">
                    {up ? `${up.fileName} · ${formatFileSize(up.sizeBytes)}` : doc ? `${doc.file_name} · ${formatFileSize(doc.size_bytes)}` : d.hint}
                  </Text>
                )}
                {state === 'uploading' && (
                  <div className={`${s.bar} ${s.docBar}`} role="progressbar" aria-valuenow={Math.round(up!.progress * 100)} aria-valuemin={0} aria-valuemax={100}>
                    <div className={s.barFill} style={{ width: `${up!.progress * 100}%` }} />
                  </div>
                )}
              </div>
              <Badge
                label={
                  state === 'uploaded' ? 'Uploaded' : state === 'error' ? 'Upload failed' : state === 'uploading' ? `Uploading ${Math.round(up!.progress * 100)}%` : 'Not uploaded'
                }
                tone={state === 'uploaded' ? 'success' : state === 'error' ? 'error' : 'info'}
                dot="left"
              />
              <span>
                {picker(d.kind, allowedDocumentTypes(d.kind), (f) => startLicence(d.kind, f[0]))}
                {state === 'uploading' ? (
                  <Button label="Cancel" variant="destructive-inline" size="medium" onPress={() => cancels.current[d.kind]?.() ?? setUploads((u) => ({ ...u, [d.kind]: undefined }))} />
                ) : state === 'uploaded' ? (
                  <Button label="Replace" variant="inline" size="medium" onPress={() => pickers.current[d.kind]?.click()} />
                ) : (
                  <Button label={state === 'error' ? 'Upload another file' : 'Upload'} variant="secondary" size="medium" iconLeft="upload" onPress={() => pickers.current[d.kind]?.click()} />
                )}
              </span>
            </div>
          );
        })}
      </div>

      <Section title="Photo of your shop front" aside={<Text variant="caption1" color="var(--mf-text-secondary)">· optional</Text>}>
        {(photos.length > 0 || photoUploads.length > 0) && (
          <div className={s.photos}>
            {photos.map((p) => (
              <span key={p.id} className={`${s.photo} mf-t-caption1`}>
                <Icon name="tick-circle" size={sizes.icon.sm} color="var(--mf-text-success)" />
                {p.file_name} · {formatFileSize(p.size_bytes)}
                <Button
                  label="Remove"
                  variant="destructive-inline"
                  size="small"
                  onPress={async () => {
                    if (demo) return;
                    await removeDocument(p.id);
                    onDocumentsChanged();
                  }}
                />
              </span>
            ))}
            {photoUploads.map((p) => (
              <span key={p.id} className={`${s.photo} mf-t-caption1`} style={p.error ? { color: 'var(--mf-text-error)' } : undefined}>
                {p.error ? p.error : `${p.fileName} · Uploading ${Math.round(p.progress * 100)}%`}
              </span>
            ))}
          </div>
        )}
        <div className={s.photoBox}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/auth/shop-front.svg" width={190} height={140} alt="" />
          <Text variant="h5" color="var(--mf-text-heading)">Add a photo of your shop front</Text>
          <Text variant="body3" color="var(--mf-text-secondary)">{SHOP_FRONT.hint}</Text>
          {picker('photos', allowedDocumentTypes('shop_front'), startPhotos, { multiple: true })}
          {picker('camera', ['image/*'], startPhotos, { capture: true })}
          <div className={s.photoButtons}>
            <Button label="Choose photos" onPress={() => pickers.current.photos?.click()} />
            <Button label="Use this device’s camera" variant="secondary" onPress={() => pickers.current.camera?.click()} />
          </div>
        </div>
      </Section>

      <div style={{ padding: '0 12px' }}>
        <Notice>
          Only MedFind’s verification team can see these documents. We never show them to patients or any third party. This is to
          check you are licensed.
        </Notice>
      </div>

      <div className={s.actions}>
        <Button label="Back" variant="secondary" onPress={onBack} />
        <Button label="Continue" disabled={!documentsComplete(uploaded)} onPress={onContinue} />
      </div>
    </div>
  );
}
