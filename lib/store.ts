import { atom } from 'jotai';
import { User } from './types';

export const currentUserAtom = atom<User | null>(null);
export const isLoggedInAtom = atom<boolean>(false);