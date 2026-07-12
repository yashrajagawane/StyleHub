import React, { createContext, useContext, useState, useCallback, useEffect } from "react";

const WLKey = "stylehub_wishlist";
const WishlistCtx = createContext(null);

export function WishlistProvider({ children }) {
  const [ids, setIds] = useState(() => {
    try { return JSON.parse(localStorage.getItem(WLKey) || "[]"); }
    catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem(WLKey, JSON.stringify(ids));
  }, [ids]);

  const toggle = useCallback((id) => {
    setIds((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  }, []);
  const has = useCallback((id) => ids.includes(id), [ids]);
  const clear = useCallback(() => setIds([]), []);

  return (
    <WishlistCtx.Provider value={{ ids, toggle, has, clear, count: ids.length }}>
      {children}
    </WishlistCtx.Provider>
  );
}

export const useWishlist = () => useContext(WishlistCtx);
