import { create } from 'zustand';

const useSOSStore = create((set) => ({
  sosAlerts: [],

  setAlerts: (alerts) => set({ sosAlerts: alerts }),

  acknowledgeAlert: (sosid) =>
    set((state) => ({
      sosAlerts: state.sosAlerts.filter((a) => a.sosid !== sosid),
    })),
}));

export default useSOSStore;
