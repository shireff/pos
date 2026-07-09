import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import catalogReducer from './catalogSlice';
import systemReducer from './systemSlice';
import salesReducer from './salesSlice';
import customersReducer from './customersSlice';

export const store = configureStore({
    reducer: {
        auth: authReducer,
        catalog: catalogReducer,
        system: systemReducer,
        sales: salesReducer,
        customers: customersReducer,
    },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
