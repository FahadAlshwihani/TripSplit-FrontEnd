import { act, renderHook } from '@testing-library/react';
import usePreferenceControls from './usePreferenceControls';

const mockLocalChangeLanguage = jest.fn();
let mockLanguage = 'en';
jest.mock('react-i18next', () => ({ useTranslation: () => ({ i18n: { language: mockLanguage, changeLanguage: mockLocalChangeLanguage } }) }));

let mockAuth = { user: null, isAuthenticated: false, authLoading: false };
jest.mock('../../../auth/AuthContext', () => ({ useAuth: () => mockAuth }));

const mockSetTheme = jest.fn();
let mockTheme = 'light';
jest.mock('../../../components/ThemeProvider', () => ({ useTheme: () => ({ theme: mockTheme, setTheme: mockSetTheme }) }));

const mockSaveLanguage = jest.fn();
const mockSaveTheme = jest.fn();
jest.mock('./usePreferenceSave', () => () => ({ status: {}, changeLanguage: mockSaveLanguage, changeTheme: mockSaveTheme }));

beforeEach(() => {
  jest.clearAllMocks();
  mockAuth = { user: null, isAuthenticated: false, authLoading: false };
  mockLanguage = 'en';
  mockTheme = 'light';
});

test('guests read and update the existing local language and theme sources', () => {
  mockLanguage = 'ar';
  mockTheme = 'dark';
  const { result } = renderHook(() => usePreferenceControls());
  expect(result.current.language).toBe('ar');
  expect(result.current.theme).toBe('dark');
  act(() => result.current.changeLanguage('en'));
  act(() => result.current.changeTheme('light'));
  expect(mockLocalChangeLanguage).toHaveBeenCalledWith('en');
  expect(mockSetTheme).toHaveBeenCalledWith('light');
  expect(mockSaveLanguage).not.toHaveBeenCalled();
  expect(mockSaveTheme).not.toHaveBeenCalled();
});

test('registered users use server-authoritative values and the profile save path', () => {
  mockAuth = { user: { preferred_language: 'ar', preferred_theme: 'dark' }, isAuthenticated: true, authLoading: false };
  const { result } = renderHook(() => usePreferenceControls());
  expect(result.current.language).toBe('ar');
  expect(result.current.theme).toBe('dark');
  act(() => result.current.changeLanguage('en'));
  act(() => result.current.changeTheme('light'));
  expect(mockSaveLanguage).toHaveBeenCalledWith('en');
  expect(mockSaveTheme).toHaveBeenCalledWith('light');
  expect(mockLocalChangeLanguage).not.toHaveBeenCalled();
  expect(mockSetTheme).not.toHaveBeenCalled();
});
