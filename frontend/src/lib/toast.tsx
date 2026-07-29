'use client';

import toast, { Toaster, type ToastOptions } from 'react-hot-toast';

const base: ToastOptions = {
  duration: 3500,
  style: {
    background: '#0c1218',
    color: '#ffffff',
    border: '1px solid #1a2a33',
    borderRadius: '12px',
    padding: '12px 14px',
    fontSize: '13px',
    fontWeight: 600,
    maxWidth: '420px',
  },
};

export const notify = {
  success(message: string, opts?: ToastOptions) {
    return toast.success(message, {
      ...base,
      ...opts,
      iconTheme: { primary: '#01a6c2', secondary: '#0c1218' },
    });
  },
  error(message: string, opts?: ToastOptions) {
    return toast.error(message, {
      ...base,
      duration: 4500,
      ...opts,
      iconTheme: { primary: '#ff4d6d', secondary: '#0c1218' },
    });
  },
  info(message: string, opts?: ToastOptions) {
    return toast(message, {
      ...base,
      ...opts,
      icon: '🎮',
    });
  },
  dismiss: toast.dismiss,
};

/** Site-wide toast host — brand-styled for dark storefront + admin. */
export function AppToaster() {
  return (
    <Toaster
      position="top-center"
      reverseOrder={false}
      gutter={10}
      containerStyle={{ top: 16, zIndex: 9999 }}
      toastOptions={{
        className: 'gm-toast',
        success: {
          style: {
            borderColor: 'rgba(1, 166, 194, 0.55)',
          },
        },
        error: {
          style: {
            borderColor: 'rgba(255, 77, 109, 0.55)',
          },
        },
      }}
    />
  );
}
