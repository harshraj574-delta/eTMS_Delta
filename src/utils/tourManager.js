const KEY = 'etms_guided_tour';

const tourManager = {
  start() {
    localStorage.setItem(KEY, JSON.stringify({ active: true, page: 'profile' }));
  },

  getState() {
    try { return JSON.parse(localStorage.getItem(KEY)); } catch { return null; }
  },

  setPage(page) {
    const state = this.getState() || {};
    localStorage.setItem(KEY, JSON.stringify({ ...state, active: true, page }));
  },

  complete() {
    localStorage.removeItem(KEY);
  },

  isActive(page) {
    const s = this.getState();
    if (!s?.active) return false;
    return page ? s.page === page : true;
  },
};

export default tourManager;
