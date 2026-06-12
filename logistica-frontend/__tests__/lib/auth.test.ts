import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAuthStore } from '@/stores/auth.store';

const resetState = () =>
  useAuthStore.setState({
    accessToken: null,
    refreshToken: null,
    user: null,
    permissions: [],
  });

beforeEach(() => {
  localStorage.clear();
  resetState();
});

describe('useAuthStore — setTokens', () => {
  it('stores access and refresh tokens', () => {
    useAuthStore.getState().setTokens('access-123', 'refresh-456');
    const { accessToken, refreshToken } = useAuthStore.getState();
    expect(accessToken).toBe('access-123');
    expect(refreshToken).toBe('refresh-456');
  });
});

describe('useAuthStore — setUser', () => {
  it('stores user object', () => {
    const user = { username: 'admin', email: 'a@test.com', is_superuser: false };
    useAuthStore.getState().setUser(user);
    expect(useAuthStore.getState().user).toEqual(user);
  });
});

describe('useAuthStore — setPermissions', () => {
  it('stores permissions array', () => {
    useAuthStore.getState().setPermissions(['view_customer', 'add_customer']);
    expect(useAuthStore.getState().permissions).toEqual(['view_customer', 'add_customer']);
  });

  it('replaces previous permissions', () => {
    useAuthStore.getState().setPermissions(['view_customer']);
    useAuthStore.getState().setPermissions(['view_shipment']);
    expect(useAuthStore.getState().permissions).toEqual(['view_shipment']);
  });
});

describe('useAuthStore — isAuthenticated', () => {
  it('returns false when no token', () => {
    expect(useAuthStore.getState().isAuthenticated()).toBe(false);
  });

  it('returns false for empty string token', () => {
    useAuthStore.setState({ accessToken: '' });
    expect(useAuthStore.getState().isAuthenticated()).toBe(false);
  });

  it('returns false for null token', () => {
    useAuthStore.setState({ accessToken: null });
    expect(useAuthStore.getState().isAuthenticated()).toBe(false);
  });

  it('returns true when token exists', () => {
    useAuthStore.setState({ accessToken: 'some-token' });
    expect(useAuthStore.getState().isAuthenticated()).toBe(true);
  });
});

describe('useAuthStore — hasPermission', () => {
  it('returns false when no permissions and not superuser', () => {
    useAuthStore.setState({ user: { username: 'user', is_superuser: false }, permissions: [] });
    expect(useAuthStore.getState().hasPermission('view_customer')).toBe(false);
  });

  it('returns true when codename is in permissions list', () => {
    useAuthStore.setState({
      user: { username: 'user', is_superuser: false },
      permissions: ['view_customer', 'add_product'],
    });
    expect(useAuthStore.getState().hasPermission('view_customer')).toBe(true);
  });

  it('returns false for codename not in list', () => {
    useAuthStore.setState({
      user: { username: 'user', is_superuser: false },
      permissions: ['view_customer'],
    });
    expect(useAuthStore.getState().hasPermission('delete_customer')).toBe(false);
  });

  it('returns true for superuser regardless of permissions list', () => {
    useAuthStore.setState({
      user: { username: 'admin', is_superuser: true },
      permissions: [],
    });
    expect(useAuthStore.getState().hasPermission('delete_everything')).toBe(true);
  });

  it('returns false when user is null', () => {
    useAuthStore.setState({ user: null, permissions: [] });
    expect(useAuthStore.getState().hasPermission('view_customer')).toBe(false);
  });
});

describe('useAuthStore — logout', () => {
  beforeEach(() => {
    vi.stubGlobal('location', { href: 'http://localhost:3000/' });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('clears tokens, user, and permissions', () => {
    useAuthStore.setState({
      accessToken: 'abc',
      refreshToken: 'xyz',
      user: { username: 'test' },
      permissions: ['view_customer'],
    });
    useAuthStore.getState().logout();
    const { accessToken, refreshToken, user, permissions } = useAuthStore.getState();
    expect(accessToken).toBeNull();
    expect(refreshToken).toBeNull();
    expect(user).toBeNull();
    expect(permissions).toEqual([]);
  });

  it('redirects to /login', () => {
    const loc = { href: 'http://localhost:3000/' };
    vi.stubGlobal('location', loc);
    useAuthStore.getState().logout();
    expect(loc.href).toBe('/login');
  });
});
