'use client';

import React, { useEffect, useState } from 'react';

interface DocumentPreviewProps {
  url: string;
  title: string;
  /** Classes for the image (photos, scanned Aadhaar, cheque images). */
  imageClassName?: string;
  /** Classes for the frame used for PDFs. */
  frameClassName?: string;
}

type PreviewState =
  | { kind: 'loading' }
  | { kind: 'image' | 'pdf' | 'other'; objectUrl: string }
  | { kind: 'error'; message: string };

/**
 * Shows an uploaded onboarding document. The file is downloaded first and shown
 * from a local blob URL, so the browser never has to frame the API's own page
 * (cross-origin PDF frames are blocked by some browsers). The file's real type
 * decides between an image and the PDF viewer.
 */
export default function DocumentPreview({ url, title, imageClassName, frameClassName }: DocumentPreviewProps) {
  const [state, setState] = useState<PreviewState>({ kind: 'loading' });

  useEffect(() => {
    let objectUrl = '';
    let cancelled = false;
    setState({ kind: 'loading' });

    fetch(url)
      .then(async (res) => {
        if (!res.ok) {
          const message =
            res.status === 404
              ? 'This file is missing. Ask the partner to upload it again.'
              : res.status === 401 || res.status === 403
              ? 'You do not have access to this file. Please log in again.'
              : `The file could not be loaded (error ${res.status}).`;
          if (!cancelled) setState({ kind: 'error', message });
          return;
        }
        const blob = await res.blob();
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        const type = blob.type || res.headers.get('content-type') || '';
        setState({
          kind: type.startsWith('image/') ? 'image' : type.includes('pdf') ? 'pdf' : 'other',
          objectUrl,
        });
      })
      .catch(() => {
        if (!cancelled) setState({ kind: 'error', message: 'The file could not be loaded. Check your connection and try again.' });
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [url]);

  if (state.kind === 'loading') {
    return <p className="p-8 text-xs font-semibold text-slate-500">Loading document…</p>;
  }

  if (state.kind === 'error') {
    return (
      <div className="p-8 text-center space-y-1">
        <p className="text-xs font-bold text-slate-800">Document not available</p>
        <p className="text-[11px] text-slate-500">{state.message}</p>
      </div>
    );
  }

  if (state.kind === 'image') {
    return (
      <div className="w-full h-full flex items-center justify-center p-4 bg-slate-950/95 overflow-auto">
        <img
          src={state.objectUrl}
          alt={title}
          className={imageClassName || 'max-h-[70vh] max-w-full w-auto object-contain rounded-lg shadow-xl'}
        />
      </div>
    );
  }

  return (
    <iframe
      src={state.objectUrl}
      title={title}
      className={frameClassName || 'w-full h-[70vh] bg-white border-0'}
    />
  );
}
