"use client";
import React from "react";
import { Modal } from "./index";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: "danger" | "warning" | "info";
  loading?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Təsdiqlə",
  cancelText = "Ləğv et",
  type = "danger",
  loading = false,
}) => {
  const colorClass =
    type === "danger"
      ? "bg-error-500 hover:bg-error-600 shadow-error-500/20"
      : type === "warning"
      ? "bg-warning-500 hover:bg-warning-600 shadow-warning-500/20"
      : "bg-brand-500 hover:bg-brand-600 shadow-brand-500/20";

  const iconColor =
    type === "danger"
      ? "text-error-500 bg-error-50 dark:bg-error-500/10"
      : type === "warning"
      ? "text-warning-500 bg-warning-50 dark:bg-warning-500/10"
      : "text-brand-500 bg-brand-50 dark:bg-brand-500/10";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} className="max-w-md">
      <div className="flex flex-col items-center text-center">
        <div
          className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 ${iconColor}`}
        >
          {type === "danger" && (
            <svg
              className="w-10 h-10"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          )}
          {type === "warning" && (
            <svg
              className="w-10 h-10"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          )}
          {type === "info" && (
            <svg
              className="w-10 h-10"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          )}
        </div>
        <p className="text-gray-500 dark:text-gray-400 mb-8 px-4 leading-relaxed">
          {message}
        </p>
        <div className="flex gap-3 w-full">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 text-sm font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={async () => {
              try {
                await onConfirm();
                onClose();
              } catch (error) {
                console.error("Confirmation error:", error);
              }
            }}
            disabled={loading}
            className={`flex-1 px-4 py-3 rounded-xl text-white text-sm font-bold transition-all shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 ${colorClass}`}
          >
            {loading && (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            )}
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
};
