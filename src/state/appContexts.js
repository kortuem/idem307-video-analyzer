import { createContext } from 'react';
import { initialState } from './appReducer.js';
export const AppStateContext = createContext(initialState);
export const AppDispatchContext = createContext(() => {});
export const ServiceContext = createContext(null);
