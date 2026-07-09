import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import catalogReducer from './catalogSlice';
import systemReducer from './systemSlice';
import salesReducer from './salesSlice';
import inventoryReducer from './inventorySlice';
import customersReducer from './customersSlice';
import purchasingReducer from './purchasingSlice';

export const store = configureStore({
    reducer: {
        auth: authReducer,
        catalog: catalogReducer,
        system: systemReducer,
        sales: salesReducer,
        inventory: inventoryReducer,
        customers: customersReducer,
        purchasing: purchasingReducer,
    },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
