import {
  createContext,
  useContext,
  useState,
  useCallback,
} from "react";

import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth } from "../firebase";

import {
  api,
  setSession,
  getSession,
} from "../api";

const AuthContext = createContext(null);

// Must match the domain used when the Firebase accounts were created
// (see backend/app/scripts/backfill_firebase_users.py)
const USERNAME_EMAIL_DOMAIN = "yourdomain.com";

export function AuthProvider({ children }) {
  const [session, setSessionState] = useState(getSession());

  const login = useCallback(async (username, password, role) => {
    // ------------------------------------------------------
    // 1. Authenticate directly against Firebase
    // ------------------------------------------------------
    const email = `${username}@${USERNAME_EMAIL_DOMAIN}`;

    let userCredential;
    try {
      userCredential = await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      const message =
        err.code === "auth/invalid-credential" ||
        err.code === "auth/wrong-password" ||
        err.code === "auth/user-not-found"
          ? "Invalid username or password."
          : err.message || "Login failed.";
      throw new Error(message);
    }

    const idToken = await userCredential.user.getIdToken();

    // ------------------------------------------------------
    // 2. Fetch role/profile from the backend using the token
    // ------------------------------------------------------
    let profile;
    try {
      profile = await api.request("/auth/me", {
        method: "GET",
        token: idToken,
      });
    } catch (err) {
      await signOut(auth);
      throw new Error(
        "Signed in, but could not load your profile. Contact an administrator."
      );
    }

    // ------------------------------------------------------
    // 3. Enforce that this account matches the selected portal
    // ------------------------------------------------------
    if (role && profile.role !== role) {
      await signOut(auth);
      throw new Error(
        `This account's role (${profile.role}) does not match the ${role} portal.`
      );
    }

    // ------------------------------------------------------
    // 4. Store the session (access_token is what api.js looks for)
    // ------------------------------------------------------
    const data = {
      access_token: idToken,
      ...profile,
    };

    setSession(data);
    setSessionState(data);

    return data;
  }, []);

  const logout = useCallback(() => {
    signOut(auth).catch(() => {});
    setSession(null);
    setSessionState(null);
  }, []);

  return (
    <AuthContext.Provider value={{ session, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}