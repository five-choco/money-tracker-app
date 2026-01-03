import { render, screen, waitFor } from '@testing-library/react';
import App from './App';
import { beforeEach, describe, expect, it, vi, Mocked } from 'vitest';
import * as SupabaseClientModule from './supabaseClient'; // Import as a module

// Mock the entire module './supabaseClient'
vi.mock('./supabaseClient', () => ({
  supabase: {
    auth: {
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
      getSession: vi.fn(() => ({ data: { session: null } })),
      signInAnonymously: vi.fn(() => ({ error: null })),
      getUser: vi.fn(() => ({ data: { user: null } })),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({ data: [], error: null }))
        }))
      })),
      insert: vi.fn(() => ({ error: null })),
      delete: vi.fn(() => ({ eq: vi.fn(() => ({ error: null })) })),
    })),
  },
}));

// Cast the imported module to its mocked type
const mockedSupabaseClient = SupabaseClientModule as Mocked<typeof SupabaseClientModule>;

// Mock analyzeReceipt to prevent actual AI calls during tests
vi.mock('./lib/gemini', () => ({
  analyzeReceipt: vi.fn(() => Promise.resolve({
    amount: 1000,
    shop_name: 'Test Shop',
    category: '食費',
    date: '2023-01-01',
  })),
}));

describe('App', () => {
  beforeEach(() => {
    // Reset mocks before each test to ensure isolation
    vi.clearAllMocks();
  });

  it('renders the main heading', () => {
    render(<App />);
    expect(screen.getByText('AI領収書カレンダー')).toBeInTheDocument();
  });

  it('renders the expense input form heading', () => {
    render(<App />);
    expect(screen.getByText('経費を入力')).toBeInTheDocument();
  });

  it('renders the history list heading', () => {
    render(<App />);
    expect(screen.getByText('選択した日の履歴')).toBeInTheDocument();
  });

  // Example of a test to check if supabase auth is called
  it('attempts to sign in anonymously on initial load', async () => { // Make test async
    render(<App />);
    // Wait for the async effect in useEffect to complete
    await waitFor(() => {
      expect(mockedSupabaseClient.supabase.auth.signInAnonymously).toHaveBeenCalled();
    });
  });
});
