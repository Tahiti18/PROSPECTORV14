
export type ToastType = 'success' | 'error' | 'info' | 'warning' | 'neural';

type ToastListener = (id: string, type: ToastType, message: string) => void;

class ToastManager {
  private listeners: Set<ToastListener> = new Set();

  subscribe(listener: ToastListener): (() => void) {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  }

  show(type: ToastType, message: string) {
    const id = Math.random().toString(36).substr(2, 9);
    this.listeners.forEach(l => l(id, type, message));
  }

  success(msg: string) { this.show('success', msg); }
  error(msg: string) { this.show('error', msg); }
  info(msg: string) { this.show('info', msg); }
  neural(msg: string) { this.show('neural', msg); }
}

export const toast = new ToastManager();
