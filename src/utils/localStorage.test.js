import { saveToLocalStorage, loadFromLocalStorage } from './localStorage';

describe('localStorage utils', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('saveToLocalStorage saves data', () => {
    const key = 'testKey';
    const value = { test: 'data' };
    saveToLocalStorage(key, value);
    expect(JSON.parse(localStorage.getItem(key))).toEqual(value);
  });

  test('loadFromLocalStorage loads data', () => {
    const key = 'testKey';
    const value = { test: 'data' };
    localStorage.setItem(key, JSON.stringify(value));
    expect(loadFromLocalStorage(key)).toEqual(value);
  });

  test('loadFromLocalStorage returns null for non-existent key', () => {
    expect(loadFromLocalStorage('nonExistentKey')).toBeNull();
  });
});