"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User, signInWithPopup, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth, googleProvider, isFirebaseConfigured } from "@/lib/firebase";
import { useRouter } from "next/navigation";

interface AuthContextType {
  user: User | null;
  userData: any | null;
  loading: boolean;
  signInWithGoogle: (referralCode?: string) => Promise<void>;
  signUpWithEmail: (name: string, email: string, password: string, referralCode: string) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchUserData = async (firebaseUser: User) => {
    try {
      const idToken = await firebaseUser.getIdToken();
      const res = await fetch("/api/user/me", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ uid: firebaseUser.uid }),
      });
      const data = await res.json();
      if (data.user) {
        setUserData(data.user);
      }
    } catch (e) {
      console.error("Failed to fetch user data", e);
    }
  };

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      setUser(authUser);
      if (authUser) {
        // Sync and Fetch
        try {
          const idToken = await authUser.getIdToken();
          await fetch("/api/auth/sync", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${idToken}`,
            },
            body: JSON.stringify({
              uid: authUser.uid,
              email: authUser.email,
              name: authUser.displayName || (typeof window !== 'undefined' ? localStorage.getItem("pendingName") : null),
              photoURL: authUser.photoURL,
              // Note: On reconnect, we might not have the referral code in state, 
              // but sync handles existing user logic.
              referralCode: typeof window !== 'undefined' ? localStorage.getItem("referralCode") : null,
            }),
          });

          if (typeof window !== 'undefined') {
            localStorage.removeItem("pendingName");
          }

          await fetchUserData(authUser);
        } catch (e) {
          console.error("Auth sync error", e);
        }
      } else {
        setUserData(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async (referralCode?: string) => {
    if (!auth || !isFirebaseConfigured) {
      alert("Application is not properly configured.");
      return;
    }

    // Store referral code in localStorage before popup
    if (referralCode) {
      localStorage.setItem("referralCode", referralCode);
    }

    try {
      await signInWithPopup(auth, googleProvider);
      router.push("/dashboard");
    } catch (error) {
      console.error("Error signing in", error);
    }
  };

  const signUpWithEmail = async (name: string, email: string, password: string, referralCode: string) => {
    if (!auth || !isFirebaseConfigured) {
      alert("Application is not properly configured.");
      return;
    }

    if (referralCode) {
      localStorage.setItem("referralCode", referralCode);
    }

    localStorage.setItem("pendingName", name);

    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);

      // Update the profile with the name immediately
      await updateProfile(result.user, { displayName: name });

      // Success will trigger onAuthStateChanged
      router.push("/dashboard");
    } catch (error: any) {
      console.error("Error signing up", error);
      throw error;
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    if (!auth || !isFirebaseConfigured) {
      alert("Application is not properly configured.");
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/dashboard");
    } catch (error: any) {
      console.error("Error signing in", error);
      throw error;
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
    <AuthContext.Provider value={{
      user,
      userData,
      loading,
      signInWithGoogle,
      signUpWithEmail,
      signInWithEmail,
      logout,
      refreshUserData: () => user ? fetchUserData(user) : Promise.resolve()
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
