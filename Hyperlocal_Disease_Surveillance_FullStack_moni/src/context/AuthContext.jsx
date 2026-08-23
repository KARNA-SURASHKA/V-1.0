import {
  createContext,
  useContext,
  useState,
  useCallback,
} from "react";

import {
  api,
  setSession,
  getSession,
} from "../api";


const AuthContext = createContext(null);


export function AuthProvider({ children }) {

  const [
    session,
    setSessionState,
  ] = useState(
    getSession()
  );


  // ==========================================================
  // LOGIN
  // ==========================================================

  const login = useCallback(
    async (
      username,
      password,
      role
    ) => {

      const data =
        await api.login(
          username,
          password,
          role
        );


      if (!data) {
        throw new Error(
          "Login failed. The server returned no session."
        );
      }


      // ------------------------------------------------------
      // Validate JWT
      // ------------------------------------------------------

      if (
        !data.access_token
      ) {

        console.error(
          "Login response does not contain access_token:",
          data
        );

        throw new Error(
          "Login succeeded but the server did not return an authentication token."
        );
      }


      // ------------------------------------------------------
      // Store session
      // ------------------------------------------------------

      setSession(data);

      setSessionState(data);


      return data;
    },
    []
  );


  // ==========================================================
  // LOGOUT
  // ==========================================================

  const logout = useCallback(
    () => {

      setSession(null);

      setSessionState(null);
    },
    []
  );


  // ==========================================================
  // PROVIDER
  // ==========================================================

  return (
    <AuthContext.Provider
      value={{
        session,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}


// ============================================================
// USE AUTH
// ============================================================

export function useAuth() {

  const ctx =
    useContext(
      AuthContext
    );


  if (!ctx) {
    throw new Error(
      "useAuth must be used within AuthProvider"
    );
  }


  return ctx;
}