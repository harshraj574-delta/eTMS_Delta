import { useState } from 'react';
import { Dropdown } from 'primereact/dropdown';
import ManageRouteService from '../../../../services/compliance/ManageRouteService';
import { toastService } from '../../../../services/toastService';
import SortableStopList from './SortableStopList';

const parseList = (response) => {
    const parsed = typeof response === 'string' ? JSON.parse(response) : response;
    return Array.isArray(parsed) ? parsed : [];
};

const AddEmployeeForm = ({ stopCount, onAdd, disabled }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selected, setSelected] = useState(null);
    const [position, setPosition] = useState(stopCount + 1);

    const search = async (e) => {
        e.preventDefault();
        if (!query.trim()) return;
        setIsSearching(true);
        setSelected(null);
        try {
            const list = parseList(
                await ManageRouteService.EmpSearch({
                    locationid: sessionStorage.getItem('locationid') || '2',
                    empidname: query.trim(),
                    IsAdmin: 'N',
                })
            );
            setResults(list);
            if (!list.length) toastService.info('No employees found matching your search.');
        } catch (error) {
            console.error('Employee search failed:', error);
            toastService.error('Employee search failed.');
        } finally {
            setIsSearching(false);
        }
    };

    const positionOptions = Array.from({ length: stopCount + 1 }, (_, i) => ({ label: `Stop ${i + 1}`, value: i + 1 }));

    return (
        <div className="re-add-form">
            <form onSubmit={search} className="re-search-row">
                <input
                    className="re-input"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Employee ID or name"
                    aria-label="Search employee"
                />
                <button type="submit" className="re-btn" disabled={isSearching}>
                    {isSearching ? <i className="pi pi-spin pi-spinner" /> : <i className="pi pi-search" />}
                </button>
            </form>
            {results.length > 0 && (
                <ul className="re-result-list">
                    {results.map((emp) => (
                        <li key={emp.id}>
                            <button
                                type="button"
                                className={`re-result${selected?.id === emp.id ? ' is-selected' : ''}`}
                                onClick={() => setSelected(emp)}
                            >
                                <strong>{emp.empName}</strong>
                                <span>{emp.id}</span>
                            </button>
                        </li>
                    ))}
                </ul>
            )}
            {selected && (
                <div className="re-search-row">
                    <Dropdown
                        value={position}
                        options={positionOptions}
                        onChange={(e) => setPosition(e.value)}
                        className="re-dropdown re-dropdown-sm"
                        appendTo="self"
                    />
                    <button
                        type="button"
                        className="re-btn re-btn-primary"
                        disabled={disabled}
                        onClick={() => onAdd(selected, position)}
                    >
                        <i className="pi pi-user-plus" /> Add {selected.empName}
                    </button>
                </div>
            )}
        </div>
    );
};

const EMPTY_SET = new Set();

/**
 * Right-hand panel for one route in edit mode: drag-to-reorder stop list,
 * remove, plus add-employee. Reordering on a list is more precise than on the map.
 * preview (optional) = { stops, movedKeys } for a pending, unconfirmed reorder:
 * the order it would produce and the employees being moved.
 */
const RouteInspector = ({ route, preview, color, isStale, selectedStopKeys, onSelectStop, onReorder, onRemove, onAdd, onClose, disabled }) => {
    const [showAdd, setShowAdd] = useState(false);
    const stops = preview?.stops ?? [...route.stops].sort((a, b) => Number(a.stopNo) - Number(b.stopNo));
    const movedKeys = preview?.movedKeys ?? EMPTY_SET;

    return (
        <aside className="re-inspector" aria-label={`Route ${route.routeId} editor`}>
            <header className="re-inspector-header" style={{ borderTopColor: color }}>
                <div>
                    <h3>Route {route.routeId}</h3>
                    <span className="re-muted">
                        {stops.length} employees
                        {isStale && <span className="re-badge re-badge-warn">Needs recalculation</span>}
                    </span>
                </div>
                <button type="button" className="re-icon-btn" onClick={onClose} aria-label="Close route editor">
                    <i className="pi pi-times" />
                </button>
            </header>

            {route.isLocked ? (
                <p className="re-locked"><i className="pi pi-lock" /> This route is finalized. Unlock it on Manage Route to edit.</p>
            ) : (
                <>
                    <p className="re-inspector-tip">
                        <i className="pi pi-bars" /> Drag a stop to any position, or focus its handle and use
                        Space + arrow keys.
                    </p>
                    <SortableStopList
                        stops={stops}
                        color={color}
                        selectedStopKeys={selectedStopKeys ?? EMPTY_SET}
                        movedKeys={movedKeys}
                        disabled={disabled || !!preview}
                        onReorder={onReorder}
                        onSelect={onSelectStop}
                        onRemove={onRemove}
                    />

                    <div className="re-inspector-footer">
                        {showAdd ? (
                            <AddEmployeeForm
                                stopCount={stops.length}
                                disabled={disabled}
                                onAdd={onAdd}
                            />
                        ) : (
                            <button type="button" className="re-btn re-btn-block" onClick={() => setShowAdd(true)}>
                                <i className="pi pi-user-plus" /> Add employee
                            </button>
                        )}
                    </div>
                </>
            )}
        </aside>
    );
};

export default RouteInspector;
