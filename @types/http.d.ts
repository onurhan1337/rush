import type { Session } from 'iron-session';
import type { User } from '../models/user';

declare module 'http' {
  export interface IncomingMessage {
    session: Session;
    user?: User;
  }
}
