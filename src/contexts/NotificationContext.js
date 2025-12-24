import React, { createContext, useState, useContext } from 'react';

const NotificationContext = createContext({});

export const useNotificationCount = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotificationCount must be used within NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [unreadCount, setUnreadCount] = useState(0);

  const updateUnreadCount = (count) => {
    setUnreadCount(count);
  };

  return (
    <NotificationContext.Provider value={{ unreadCount, updateUnreadCount }}>
      {children}
    </NotificationContext.Provider>
  );
};

