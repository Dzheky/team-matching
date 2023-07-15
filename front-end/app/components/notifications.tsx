"use client";
import React from "react";
import { create } from "zustand";
import cn from "classnames";

type NotificationTypes = "info" | "success" | "error";

type NotificationsState = {
  notifications: {
    type: NotificationTypes;
    message: string;
  }[];
};

type NotificationsActions = {
  addNotification: (type: NotificationTypes, message: string) => void;
};

export const useNotifications = create<
  NotificationsState & NotificationsActions
>((set) => ({
  notifications: [],
  addNotification: (type, message) => {
    set((state) => ({
      notifications: [...state.notifications, { type, message }],
    }));

    setTimeout(() => {
      set((state) => ({
        notifications: state.notifications.slice(1),
      }));
    }, 3000);
  },
}));

export const setNotifications = useNotifications.getState().addNotification;

const Notifications = () => {
  const { notifications } = useNotifications((state) => ({
    notifications: state.notifications,
  }));

  return (
    <div className="toast toast-start">
      {notifications.map((notification, index) => {
        return (
          <div
            key={index}
            className={cn(`alert`, {
              "alert-info": notification.type === "info",
              "alert-success": notification.type === "success",
              "alert-error": notification.type === "error",
            })}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              className="stroke-current shrink-0 w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              ></path>
            </svg>
            <span>{notification.message}</span>
          </div>
        );
      })}
    </div>
  );
};

export default Notifications;
