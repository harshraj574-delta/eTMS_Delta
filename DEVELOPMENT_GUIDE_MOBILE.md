# Mobile Development Guide (Container/Presenter Pattern)

## Overview
This guide outlines the standard approach for implementing mobile views in our application. We use the **Container/Presenter** pattern to separate data logic from UI rendering, ensuring code reuse and scalability.

## Core Principles
1.  **Data First**: Always implement data fetching in Custom Hooks (TanStack Query) before building UI.
2.  **Shared Logic**: The Container handles data; Presenters (Mobile/Desktop) just render props.
3.  **Mobile First Components**: Use the `src/components/common/mobile/` UI kit.

---

## Architecture

### 1. The Container (`FeatureName.jsx`)
The entry point. It fetches data and decides which view to render.

```jsx
// src/components/FeatureName.jsx
import useFeatureLogic from '../hooks/useFeatureLogic';
import FeatureDesktop from './FeatureDesktop'; // Renamed old component
import FeatureMobile from './FeatureMobile';   // New component
import useIsMobile from './common/useIsMobile';

const FeatureName = () => {
    const { data, actions, isLoading } = useFeatureLogic();
    const isMobile = useIsMobile();

    if (isMobile) {
        return <FeatureMobile data={data} actions={actions} />;
    }

    return <FeatureDesktop data={data} actions={actions} />;
};
```

### 2. The Custom Hook (`useFeatureLogic.js`)
Encapsulates all TanStack Query logic.

```javascript
// src/hooks/useFeatureLogic.js
export const useFeatureLogic = () => {
    const { data } = useQuery(...);
    const mutation = useMutation(...);
    
    return { 
        data, 
        actions: { update: mutation.mutate } 
    };
};
```

### 3. The Mobile View (`FeatureMobile.jsx`)
A dumb component that consumes data.

```jsx
// src/components/FeatureMobile.jsx
import MobileHeader from './common/mobile/MobileHeader';
import MobileCardList from './common/mobile/MobileCardList';

const FeatureMobile = ({ data }) => {
    return (
        <div className="bg-light min-vh-100">
            <MobileHeader title="My Feature" />
            <MobileCardList 
                data={data}
                itemTemplate={(item) => <div>{item.name}</div>}
            />
        </div>
    );
};
```

---

## UI Kit Components

### `MobileHeader`
Standard navigation header.
- `title`: Page title
- `showBack`: Show/hide back button
- `rightContent`: Actions (Buttons/Icons)

### `MobileCardList`
Standard list with loading/empty states.
- `data`: Array of items
- `itemTemplate`: Render function for each item
- `onRefresh`: Pull-to-refresh handler

---

## Styling
- Use **Bootstrap utility classes** (`d-flex`, `p-3`, `text-muted`) for layout.
- Use **PrimeReact** components for interactive elements (Buttons, Inputs).
- Keep padding consistent (`p-3` is standard for mobile spacing).
