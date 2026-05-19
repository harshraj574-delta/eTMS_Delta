import React from 'react';
import AppDialog from './AppDialog';

/**
 * AppConfirmDialog — standardised confirmation dialog for the entire application.
 *
 * Bundles icon, color, and default button label per semantic `variant`.
 * For anything needing a custom footer or complex body, use AppDialog directly.
 *
 * Usage:
 *   <AppConfirmDialog
 *     visible={open}
 *     onHide={close}
 *     title="Remove Employee"
 *     message={<>Remove <strong>{emp.name}</strong> from route <strong>{routeId}</strong>?</>}
 *     variant="remove"
 *     onConfirm={handleConfirm}
 *     isLoading={isDeleting}
 *   />
 *
 * For extra body content beyond message + detail, pass children:
 *   <AppConfirmDialog variant="unlock" ...>
 *     <p>Custom warning text here.</p>
 *   </AppConfirmDialog>
 */

const VARIANTS = {
  //  variant         dialogVariant   icon                           iconColor   severity    defaultLabel
  delete:  { dv: 'danger',  icon: 'pi pi-trash',               c: '#ef4444', sv: 'danger',  lbl: 'Delete'   },
  remove:  { dv: 'danger',  icon: 'pi pi-minus-circle',         c: '#ef4444', sv: 'danger',  lbl: 'Remove'   },
  warning: { dv: 'warning', icon: 'pi pi-exclamation-triangle', c: '#f59e0b', sv: 'warning', lbl: 'Confirm'  },
  merge:   { dv: 'info',    icon: 'pi pi-share-alt',            c: '#3b82f6', sv: 'info',    lbl: 'Merge'    },
  unlock:  { dv: 'warning', icon: 'pi pi-lock-open',            c: '#f59e0b', sv: 'warning', lbl: 'Unlock'   },
  success: { dv: 'success', icon: 'pi pi-check-circle',         c: '#22c55e', sv: 'success', lbl: 'Confirm'  },
  info:    { dv: 'info',    icon: 'pi pi-info-circle',          c: '#3b82f6', sv: 'info',    lbl: 'OK'       },
};

const AppConfirmDialog = ({
  visible,
  onHide,

  // Header
  title,

  // Variant drives icon, color, accent border, and default button label
  variant = 'warning',

  // Body — message accepts string or JSX
  message,
  detail,    // optional smaller grey text below message
  children,  // additional body content below message/detail

  // Footer
  onConfirm,
  confirmLabel,   // overrides variant default
  cancelLabel,    // overrides 'Cancel'
  isLoading = false,
}) => {
  const v = VARIANTS[variant] ?? VARIANTS.warning;

  return (
    <AppDialog
      visible={visible}
      onHide={onHide}
      title={title}
      icon={v.icon}
      iconColor={v.c}
      size="sm"
      variant={v.dv}
      onCancel={onHide}
      cancelLabel={cancelLabel}
      onConfirm={onConfirm}
      confirmLabel={confirmLabel ?? v.lbl}
      confirmSeverity={v.sv}
      isLoading={isLoading}
    >
      {message != null && (
        <p className="app-dialog-body-message">{message}</p>
      )}
      {detail != null && (
        <p className="app-dialog-body-detail">{detail}</p>
      )}
      {children}
    </AppDialog>
  );
};

export default AppConfirmDialog;
