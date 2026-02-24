export const setSession = (key, value) => {
  sessionStorage.setItem(key, JSON.stringify(value));
};

export const getSession = (key) => {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.warn("getSession parse error:", e);
    return null;
  }
};

export const removeSession = (key) => {
  sessionStorage.removeItem(key);
};

export const clearAllSession = () => {
  sessionStorage.clear();
};
