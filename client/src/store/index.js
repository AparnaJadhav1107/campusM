import { create } from "zustand";

export const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem("campus_user") || "null"),
  token: localStorage.getItem("campus_token"),
  login: (user, token) => {
    localStorage.setItem("campus_token", token);
    localStorage.setItem("campus_user", JSON.stringify(user));
    set({ user, token });
  },
  logout: () => {
    localStorage.removeItem("campus_token");
    localStorage.removeItem("campus_user");
    set({ user: null, token: null });
  },
}));

let toastSeq = 0;

export const useUIStore = create((set, get) => ({
  sidebarOpen: false,
  setSidebar: (v) => set({ sidebarOpen: v }),

  // Toast queue: [{ id, type: "success" | "error" | "info", message }]
  toasts: [],
  showToast: (message, type = "success") => {
    const id = ++toastSeq;
    set({ toasts: [...get().toasts.slice(-3), { id, type, message }] });
    return id;
  },
  dismissToast: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
}));

export const useDashboardStore = create((set) => ({ data: null, setData: (d) => set({ data: d }) }));
export const useStudentStore = create(() => ({}));
export const useComplaintStore = create(() => ({}));
export const useNotificationStore = create(() => ({ items: [] }));
export const useQueueStore = create(() => ({}));
