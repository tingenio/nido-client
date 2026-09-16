"use client";

import { onAuthStateChanged, type User as FirebaseUser } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

import { auth, db } from "@/lib/firebase/client";
import type { AppUser } from "@/types";

interface AuthContextValue {
  /** Usuario de Firebase Auth (identidad). */
  firebaseUser: FirebaseUser | null;
  /** Perfil de la app en `users/{uid}` (rol, hogar, puntos). */
  appUser: AppUser | null;
  /** true mientras se resuelve el estado inicial de auth y/o el perfil. */
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue>({
  firebaseUser: null,
  appUser: null,
  loading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [authResolved, setAuthResolved] = useState(false);
  const [profileResolvedFor, setProfileResolvedFor] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      setAuthResolved(true);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!firebaseUser) return;

    const unsubscribe = onSnapshot(
      doc(db, "users", firebaseUser.uid),
      (snapshot) => {
        setAppUser(snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as AppUser) : null);
        setProfileResolvedFor(firebaseUser.uid);
      },
      () => setProfileResolvedFor(firebaseUser.uid),
    );
    return unsubscribe;
  }, [firebaseUser]);

  const profileResolved = !firebaseUser || profileResolvedFor === firebaseUser.uid;
  const effectiveAppUser = firebaseUser ? appUser : null;

  const value = useMemo<AuthContextValue>(
    () => ({
      firebaseUser,
      appUser: effectiveAppUser,
      loading: !authResolved || !profileResolved,
    }),
    [firebaseUser, effectiveAppUser, authResolved, profileResolved],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
