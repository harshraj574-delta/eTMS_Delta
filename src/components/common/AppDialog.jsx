import React from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';

/**
 * AppDialog — production-grade dialog wrapper for the entire application.
 *
 * Desktop : centered modal, width controlled by `size` prop.
 * Mobile  : full-width bottom sheet with slide-up animation (CSS-driven, zero extra code).
 *
 * Usage — shorthand footer (most dialogs):
 *   <AppDialog title="Confirm" onCancel={onHide} onConfirm={save} confirmLabel="Save" variant="success">
 *     Are you sure?
 *   </AppDialog>
 *
 * Usage — custom footer:
 *   <AppDialog title="Route Split" size="lg" variant="warning"
 *     footer={<div className="d-flex gap-2"><Button .../><Button .../></div>}>
 *     ...complex body...
 *   </AppDialog>
 *
 * Usage — no footer (informational / self-managed):
 *   <AppDialog title="Add Employee" footer={null}>
 *     ...body manages its own actions...
 *   </AppDialog>
 */

const SIZE_CLASS = {
  sm: 'app-dialog-sm',   // 420 px
  md: 'app-dialog-md',   // 580 px
  lg: 'app-dialog-lg',   // 820 px
  xl: 'app-dialog-xl',   // 1060 px
};

const VARIANT_CLASS = {
  danger:  'app-dialog-danger',
  warning: 'app-dialog-warning',
  info:    'app-dialog-info',
  success: 'app-dialog-success',
};

const AppDialog = ({
  // Visibility
  visible,
  onHide,

  // Header
  title,
  icon,        // pi icon class, e.g. 'pi pi-trash'
  iconColor,   // hex, e.g. '#ef4444'

  // Layout
  size = 'md',
  variant,     // 'danger' | 'warning' | 'info' | 'success'

  // Body
  children,

  // Footer — three modes:
  //   undefined  → build from onCancel / onConfirm shorthand
  //   null       → render no footer at all
  //   <JSX>      → render exactly this
  footer,

  // Footer shorthand
  onCancel,
  cancelLabel = 'Cancel',
  onConfirm,
  confirmLabel = 'Confirm',
  confirmSeverity = 'primary',
  isLoading = false,

  // Any other PrimeReact Dialog props (maximizable, position, style, contentStyle, closable, etc.)
  ...rest
}) => {
  // ── className ─────────────────────────────────────────────────────
  const dialogClass = [
    'app-dialog',
    SIZE_CLASS[size] ?? SIZE_CLASS.md,
    VARIANT_CLASS[variant] ?? '',
  ].filter(Boolean).join(' ');

  // ── Header ────────────────────────────────────────────────────────
  const headerContent = (
    <div className="d-flex align-items-center gap-2">
      {icon && (
        <i
          className={icon}
          style={{ fontSize: '1.1rem', color: iconColor ?? '#64748b', flexShrink: 0 }}
        />
      )}
      <span>{title}</span>
    </div>
  );

  // ── Footer ────────────────────────────────────────────────────────
  let resolvedFooter;
  if (footer !== undefined) {
    // Caller passed explicit footer (including null to suppress it)
    resolvedFooter = footer;
  } else if (onCancel || onConfirm) {
    // Build standard two-button footer from shorthand props
    resolvedFooter = (
      <div className="d-flex gap-2 justify-content-end w-100">
        {onCancel && (
          <Button
            label={cancelLabel}
            outlined
            onClick={onCancel}
            disabled={isLoading}
          />
        )}
        {onConfirm && (
          <Button
            label={isLoading ? 'Please wait…' : confirmLabel}
            severity={confirmSeverity}
            onClick={onConfirm}
            disabled={isLoading}
            icon={isLoading ? 'pi pi-spin pi-spinner' : undefined}
          />
        )}
      </div>
    );
  } else {
    resolvedFooter = null;
  }

  return (
    <Dialog
      {...rest}
      visible={visible}
      onHide={onHide}
      header={headerContent}
      footer={resolvedFooter}
      className={dialogClass}
      maskClassName="app-dialog-mask"
      draggable={false}
      resizable={false}
      dismissableMask={false}
      modal
    >
      {children}
    </Dialog>
  );
};

export default AppDialog;
