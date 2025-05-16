
import { useReducer, useCallback } from 'react';
import { Order, OrderStatus } from '../types';

// Define action types
type OrderAction =
  | { type: 'SET_ORDERS', payload: Order[] }
  | { type: 'ADD_ORDER', payload: Order }
  | { type: 'ASSIGN_ORDER', payload: { orderId: string, deliveryPerson: string } }
  | { type: 'UPDATE_STATUS', payload: { orderId: string, status: OrderStatus, extraData?: { paymentMethod?: string } } }
  | { type: 'SET_LOADING', payload: boolean };

// Define state interface
interface OrderState {
  orders: Order[];
  loading: boolean;
}

// Initial state
const initialState: OrderState = {
  orders: [],
  loading: false
};

// Reducer function
function orderReducer(state: OrderState, action: OrderAction): OrderState {
  switch (action.type) {
    case 'SET_ORDERS':
      return {
        ...state,
        orders: action.payload
      };
    case 'ADD_ORDER':
      return {
        ...state,
        orders: [action.payload, ...state.orders]
      };
    case 'ASSIGN_ORDER':
      return {
        ...state,
        orders: state.orders.map((order) => {
          if (order.id === action.payload.orderId) {
            return {
              ...order,
              status: "assigned" as OrderStatus,
              deliveryPerson: action.payload.deliveryPerson,
              assignedAt: new Date()
            };
          }
          return order;
        })
      };
    case 'UPDATE_STATUS':
      return {
        ...state,
        orders: state.orders.map((order) => {
          if (order.id === action.payload.orderId) {
            const updatedOrder = {
              ...order,
              status: action.payload.status,
            };

            if (action.payload.status === "delivered" && action.payload.extraData?.paymentMethod) {
              updatedOrder.deliveredAt = new Date();
              updatedOrder.paymentMethod = action.payload.extraData.paymentMethod;
            }

            return updatedOrder;
          }
          return order;
        })
      };
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload
      };
    default:
      return state;
  }
}

export function useOrderReducer() {
  const [state, dispatch] = useReducer(orderReducer, initialState);

  const setOrders = useCallback((orders: Order[]) => {
    dispatch({ type: 'SET_ORDERS', payload: orders });
  }, []);

  const addOrder = useCallback((order: Order) => {
    dispatch({ type: 'ADD_ORDER', payload: order });
  }, []);

  const assignOrder = useCallback((orderId: string, deliveryPerson: string) => {
    dispatch({ 
      type: 'ASSIGN_ORDER', 
      payload: { orderId, deliveryPerson } 
    });
  }, []);

  const updateOrderStatus = useCallback((
    orderId: string, 
    status: OrderStatus, 
    extraData?: { paymentMethod?: string }
  ) => {
    dispatch({ 
      type: 'UPDATE_STATUS', 
      payload: { orderId, status, extraData } 
    });
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  }, []);

  return {
    orders: state.orders,
    loading: state.loading,
    setOrders,
    addOrder,
    assignOrder,
    updateOrderStatus,
    setLoading
  };
}
