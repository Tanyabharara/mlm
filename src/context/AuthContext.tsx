"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User, signInWithPopup, signOut } from "firebase/auth";
import { auth, googleProvider, isFirebaseConfigured } from "@/lib/firebase";
import { useRouter } from "next/navigation";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!auth) {
        setLoading(false);
        return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      setLoading(false);
      if (user) {
         try {
             await fetch("/api/auth/sync", {
                 method: "POST",
                 headers: { "Content-Type": "application/json" },
                 body: JSON.stringify({
                     uid: user.uid,
                     email: user.email,
                     name: user.displayName,
                     photoURL: user.photoURL,
                     referralCode: localStorage.getItem("referralCode"),
                 }),
             });
         } catch (e) {
             console.error("Failed to sync user", e);
         }
      }
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    if (!auth || !isFirebaseConfigured) {
        console.error("Firebase is not properly configured. Check your environment variables.");
        alert("Application is not properly configured. Please contact administrator.");
        return;
    }
    try {
      await signInWithPopup(auth, googleProvider);
      router.push("/dashboard");
    } catch (error) {
      console.error("Error signing in with Google", error);
    }
  };

  const logout = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
      router.push("/");
    } catch (error) {
      console.error("Error signing out", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
