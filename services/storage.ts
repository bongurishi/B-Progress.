
import { AppState } from '../types';
import { STORAGE_KEY, INITIAL_USERS, INITIAL_TASKS } from '../constants';

export const getStoredData = (): AppState => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    const parsed = JSON.parse(saved);
    if (!parsed.messages) parsed.messages = [];
    if (!parsed.groups) parsed.groups = [];
    if (!parsed.statuses) parsed.statuses = [];
    return parsed;
  }
  return {
    users: INITIAL_USERS,
    tasks: INITIAL_TASKS,
    records: [],
    messages: [],
    groups: [],
    statuses: [],
    currentUser: null,
  };
};

export const saveData = (state: AppState) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

export const clearSession = () => {
  const data = getStoredData();
  data.currentUser = null;
  saveData(data);
};
