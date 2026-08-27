"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User,
  type UserCredential,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { fetchMe, syncSessionApi } from "@/lib/api";
import { useAppDispatch } from "@/store/hooks";
import {
  setAppUser,
  clearAuth,
  setLoading as setReduxLoading,
  setError,
} from "@/store/slices/authSlice";
import type { AuthContextType } from "@/types/auth";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(setReduxLoading(true));

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        try {
          const res = await fetchMe();
          if (res.success && res.data?.user) {
            const appUser = res.data.user;

            if (appUser.role === "STAFF" && appUser.isActive) {
              dispatch(setAppUser(appUser));
              // Sync session in background
              syncSessionApi().catch(() => {});
            } else if (!appUser.isActive) {
              dispatch(
                setError(
                  "Your account has been deactivated. Please contact an administrator."
                )
              );
              await signOut(auth);
              dispatch(clearAuth());
            } else {
              // Wrong role (e.g. Admin trying Staff portal)
              dispatch(
                setError(
                  "Access denied: You do not have permission to access the Staff portal."
                )
              );
              await signOut(auth);
              dispatch(clearAuth());
            }
          } else {
            dispatch(clearAuth());
          }
        } catch {
          dispatch(clearAuth());
        }
      } else {
        dispatch(clearAuth());
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [dispatch]);

  const logIn = async (email: string, password: string): Promise<UserCredential> => {
    return await signInWithEmailAndPassword(auth, email, password);
  };

  const logOut = async (): Promise<void> => {
    await signOut(auth);
    dispatch(clearAuth());
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        logIn,
        logOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

