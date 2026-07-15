import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import useEmployeeSelection from '../useEmployeeSelection';

vi.mock('../../../services/toastService', () => ({
    toastService: {
        info: vi.fn(),
        warn: vi.fn(),
        success: vi.fn(),
        error: vi.fn(),
    },
}));

describe('useEmployeeSelection', () => {
    it('selects an employee, tracks the start route, and shows the panel', () => {
        const { result } = renderHook(() => useEmployeeSelection());

        act(() => {
            result.current.handleEmployeeSelection('R1-100', 'R1');
        });

        expect(result.current.selectedEmployees.has('R1-100')).toBe(true);
        expect(result.current.selectionStartRoute).toBe('R1');
        expect(result.current.showFloatingPanel).toBe(true);
    });

    it('deselecting the last employee resets modes but keeps the panel open', () => {
        const { result } = renderHook(() => useEmployeeSelection());

        act(() => {
            result.current.handleEmployeeSelection('R1-100', 'R1');
        });
        act(() => {
            result.current.handleToggleHold();
        });
        expect(result.current.isSelectionHeld).toBe(true);
        expect(result.current.crossPageDropMode).toBe(true);

        act(() => {
            result.current.handleEmployeeSelection('R1-100', 'R1'); // toggle off
        });

        expect(result.current.selectedEmployees.size).toBe(0);
        expect(result.current.selectionStartRoute).toBe(null);
        expect(result.current.isSelectionHeld).toBe(false);
        expect(result.current.crossPageDropMode).toBe(false);
        expect(result.current.selectedAction).toBe('multiSelect');
        // Panel intentionally stays open on manual deselection
        expect(result.current.showFloatingPanel).toBe(true);
    });

    it('keeps the first route as the selection start across multiple selections', () => {
        const { result } = renderHook(() => useEmployeeSelection());

        act(() => {
            result.current.handleEmployeeSelection('R1-100', 'R1');
        });
        act(() => {
            result.current.handleEmployeeSelection('R2-200', 'R2');
        });

        expect(result.current.selectedEmployees.size).toBe(2);
        expect(result.current.selectionStartRoute).toBe('R1');
    });

    it('clearSelection resets everything including the panel', () => {
        const { result } = renderHook(() => useEmployeeSelection());

        act(() => {
            result.current.handleEmployeeSelection('R1-100', 'R1');
            result.current.handleToggleHold();
        });
        act(() => {
            result.current.handleClearSelection();
        });

        expect(result.current.selectedEmployees.size).toBe(0);
        expect(result.current.showFloatingPanel).toBe(false);
        expect(result.current.isSelectionHeld).toBe(false);
        expect(result.current.crossPageDropMode).toBe(false);
        expect(result.current.selectedAction).toBe('multiSelect');
    });

    it('cleanupStaleSelections removes only stale keys; hides panel when all were stale', () => {
        const { result } = renderHook(() => useEmployeeSelection());

        act(() => {
            result.current.handleEmployeeSelection('R1-100', 'R1');
        });
        act(() => {
            result.current.handleEmployeeSelection('R1-101', 'R1');
        });

        act(() => {
            result.current.handleCleanupStaleSelections(['R1-100']);
        });
        expect(result.current.selectedEmployees.has('R1-101')).toBe(true);
        expect(result.current.showFloatingPanel).toBe(true);

        act(() => {
            result.current.handleCleanupStaleSelections(['R1-101']);
        });
        expect(result.current.selectedEmployees.size).toBe(0);
        expect(result.current.showFloatingPanel).toBe(false);
    });

    it('switching action back to multiSelect releases hold state', () => {
        const { result } = renderHook(() => useEmployeeSelection());

        act(() => {
            result.current.handleEmployeeSelection('R1-100', 'R1');
            result.current.handleToggleHold();
        });
        act(() => {
            result.current.handleActionChange('multiSelect');
        });

        expect(result.current.isSelectionHeld).toBe(false);
        expect(result.current.crossPageDropMode).toBe(false);
    });
});
