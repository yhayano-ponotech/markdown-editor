import { saveDocument, loadDocument } from './api';
import { supabase } from './supabaseClient';

jest.mock('./supabaseClient', () => ({
    supabase: {
      auth: {
        user: jest.fn(() => ({ id: '123' })),
      },
      from: jest.fn().mockReturnValue({
        upsert: jest.fn().mockResolvedValue({ data: 'saved', error: null }),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: { content: 'Loaded content' }, error: null }),
      }),
    },
  }));

describe('api', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    supabase.auth.user.mockReturnValue({ id: '123' });
  });

  test('saveDocument saves content for authenticated user', async () => {
    console.log('supabase.from mock:', supabase.from);

    const mockFrom = supabase.from;
    mockFrom.mockReturnValue({
      upsert: jest.fn().mockResolvedValue({ data: 'saved', error: null }),
    });

    await saveDocument('Test content');
    expect(supabase.from).toHaveBeenCalledWith('documents');
    expect(supabase.from().upsert).toHaveBeenCalledWith(
      { user_id: '123', content: 'Test content' },
      { onConflict: 'user_id' }
    );
  });

  test('loadDocument loads content for authenticated user', async () => {
    console.log('supabase.from mock:', supabase.from);

    const mockFrom = supabase.from;
    mockFrom.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: { content: 'Loaded content' }, error: null }),
    });

    const result = await loadDocument();
    expect(supabase.from).toHaveBeenCalledWith('documents');
    expect(supabase.from().select).toHaveBeenCalledWith('content');
    expect(supabase.from().select().eq).toHaveBeenCalledWith('user_id', '123');
    expect(result).toBe('Loaded content');
  });
});
