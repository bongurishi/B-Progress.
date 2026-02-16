
export enum Role {
  ADMIN = 'ADMIN',
  FRIEND = 'FRIEND'
}

export enum TaskStatus {
  DONE = 'DONE',
  PENDING = 'PENDING'
}

export interface User {
  id: string;
  name: string;
  username: string;
  password?: string;
  role: Role;
  bio?: string;
  joinedAt: string;
}

export interface Attachment {
  name: string;
  type: string;
  data: string; // Base64
}

export interface StatusUpdate {
  id: string;
  userId: string;
  userName: string;
  content?: string;
  attachment?: Attachment;
  timestamp: string;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  attachment?: Attachment;
  timestamp: string;
}

export interface Task {
  id: string;
  title: string;
  category: string;
}

export interface ProgressRecord {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  tasksCompleted: string[];
  timeSpentMinutes: number;
  remarks: string;
  dayJournal: string;
  mood?: string; // New field for emotional tracking
}

export interface GroupPost {
  id: string;
  content: string;
  attachment?: Attachment;
  timestamp: string;
  authorId: string;
}

export interface Group {
  id: string;
  name: string;
  description: string;
  memberIds: string[];
  posts: GroupPost[];
}

export interface AppState {
  users: User[];
  tasks: Task[];
  records: ProgressRecord[];
  messages: Message[];
  groups: Group[];
  statuses: StatusUpdate[];
  currentUser: User | null;
}
