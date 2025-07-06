export interface EmailAddress {
  name?: string;
  address: string;
}

export interface EmailAttachment {
  filename: string;
  contentType: string;
  size: number;
  contentId?: string;
  cid?: string;
  related?: boolean;
  content?: Buffer | string;
}

export interface Email {
  id: string;
  uid?: string | number;
  seqno?: number;
  folder?: string;
  messageId?: string;
  inReplyTo?: string;
  references?: string | string[];
  from?: EmailAddress;
  to?: EmailAddress[];
  cc?: EmailAddress[];
  bcc?: EmailAddress[];
  replyTo?: EmailAddress;
  subject?: string;
  date: Date | string;
  text?: string;
  html?: string;
  textAsHtml?: string;
  snippet?: string;
  attachments?: EmailAttachment[];
  flags: string[];
  labels?: string[];
  thread?: string;
  importance?: 'high' | 'normal' | 'low';
  size?: number;
}

export interface Folder {
  name: string;
  path: string;
  delimiter: string;
  flags: string[];
  level: number;
  hasChildren: boolean;
  specialUse: 'inbox' | 'sent' | 'drafts' | 'trash' | 'spam' | null;
  unreadCount?: number;
  totalCount?: number;
}

export interface EmailFolder {
  inbox: Email[];
  sent: Email[];
  drafts: Email[];
  trash: Email[];
  spam: Email[];
  [key: string]: Email[];
}

export interface EmailFilter {
  folder?: string;
  search?: string;
  from?: string;
  to?: string;
  subject?: string;
  hasAttachment?: boolean;
  isUnread?: boolean;
  isStarred?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
  labels?: string[];
}

export interface EmailComposerData {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  text?: string;
  html?: string;
  attachments?: File[];
  priority?: 'high' | 'normal' | 'low';
  replyTo?: string;
  inReplyTo?: string;
  references?: string;
}

export interface EmailThread {
  id: string;
  emails: Email[];
  participants: EmailAddress[];
  subject: string;
  lastUpdated: Date;
  unreadCount: number;
}