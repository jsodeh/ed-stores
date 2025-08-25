// This file has been replaced by AuthContext.tsx and StoreContext.tsx
// Left as placeholder to avoid import errors during migration
export function useApp() {
  throw new Error('useApp is deprecated. Use useAuth and useStore instead.');
}

export function AppProvider() {
  throw new Error('AppProvider is deprecated. Use AuthProvider and StoreProvider instead.');
}
