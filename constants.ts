
import { Role, Task, User } from './types';

export const INITIAL_TASKS: Task[] = [
  { id: 't1', title: 'Deep Work Session', category: 'Core' },
  { id: 't2', title: 'Technical Reading', category: 'Learning' },
  { id: 't3', title: 'Physical Activity', category: 'Health' },
  { id: 't4', title: 'Personal Project', category: 'Growth' },
];

export const INITIAL_USERS: User[] = [
  { 
    id: 'admin-1', 
    name: 'Coach Support', 
    username: 'B', 
    role: Role.ADMIN, 
    password: 'BMYLR@04',
    joinedAt: new Date().toISOString()
  },
];

export const MOTIVATIONAL_QUOTES = [
  "Consistency is better than perfection.",
  "Your only limit is your mind.",
  "Small steps every day lead to big results.",
  "Discipline is choosing between what you want now and what you want most.",
  "The secret of getting ahead is getting started."
];

export const STORAGE_KEY = 'b-progress-v2-data';
