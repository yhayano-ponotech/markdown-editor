export const saveToLocalStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Error saving to localStorage', error);
  }
};

export const loadFromLocalStorage = (key) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch (error) {
    console.error('Error loading from localStorage', error);
    return null;
  }
};

// 新しい関数を追加
export const saveAutoSaveState = (state) => {
  saveToLocalStorage('autoSaveState', state);
};

export const loadAutoSaveState = () => {
  return loadFromLocalStorage('autoSaveState') ?? false; // デフォルトはfalse
};