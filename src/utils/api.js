import { supabase } from './supabaseClient';

export const saveDocument = async (content, fileName, font) => {
  console.log('Saving document in API with font:', font);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('documents')
    .upsert({ 
      user_id: user.id, 
      content, 
      name: fileName,
      font,
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
    .select('content, font')
    .eq('user_id', user.id)
    .eq('name', fileName)
    .single();

  if (error) throw error;
  return { content: data?.content || '', font: data?.font || '' };
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

export const loadLocalFonts = () => {
  // フォントファイル名のリストを返す
  return ['xxxx.ttf']; // フォントファイル名のリスト
};
