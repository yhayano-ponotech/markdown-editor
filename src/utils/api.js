import { supabase } from './supabaseClient';

export const saveDocument = async (content, fileName) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('documents')
    .upsert({ 
      user_id: user.id, 
      content, 
      name: fileName,
      updated_at: new Date().toISOString()
    }, { 
      onConflict: 'user_id,name', 
      returning: 'minimal'
    });

  if (error) throw error;
  return data;
};

export const autoSaveDocument = async (content, fileName) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('documents')
    .upsert({ 
      user_id: user.id, 
      content, 
      name: fileName,
      updated_at: new Date().toISOString()
    }, { 
      onConflict: 'user_id,name', 
      returning: 'minimal'
    });

  if (error) throw error;
  return data;
};

export const loadDocument = async (fileName) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('documents')
    .select('content')
    .eq('user_id', user.id)
    .eq('name', fileName)
    .single();

  if (error) throw error;
  return data?.content || '';
};

export const loadDocumentList = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('documents')
    .select('id, name, updated_at')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return data || [];
};