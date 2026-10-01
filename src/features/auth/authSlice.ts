import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import api from "@/lib/axios";

export interface User {
  id: number;
  name: string;
  email: string;
  role: "acheteur" | "vendeur" | "admin";
  telephone?: string | null;
  adresse?: string | null;
  ville?: string | null;
  created_at?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  status: "idle" | "loading" | "failed";
  error: string | null;
}

// Relit le token sauvegardé : sans ça, un rafraîchissement de la page (F5)
// remettait token à null et renvoyait l'utilisateur vers /login.
// (Côté serveur Next.js, window n'existe pas : on renvoie null.)
const readStoredToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
};

const initialState: AuthState = {
  user: null,
  token: readStoredToken(),
  status: "idle",
  error: null,
};

export const login = createAsyncThunk(
  "auth/login",
  async (credentials: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await api.post("/login", credentials);
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Erreur de connexion");
    }
  }
);

export const register = createAsyncThunk(
  "auth/register",
  async (
    data: {
      name: string;
      email: string;
      password: string;
      password_confirmation: string;
      role: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await api.post("/register", data);
      return response.data;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message ||
          err.response?.data?.errors ||
          "Erreur d'inscription"
      );
    }
  }
);

export const fetchMe = createAsyncThunk("auth/me", async (_, { rejectWithValue }) => {
  try {
    const response = await api.get("/me");
    return response.data;
  } catch (err: any) {
    return rejectWithValue("Session expirée");
  }
});

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
      }
    },
    setToken: (state, action: PayloadAction<string>) => {
      state.token = action.payload;
      if (typeof window !== "undefined") {
        localStorage.setItem("token", action.payload);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.status = "idle";
        state.user = action.payload.user;
        state.token = action.payload.token;
        if (typeof window !== "undefined") {
          localStorage.setItem("token", action.payload.token);
        }
      })
      .addCase(login.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      })
      .addCase(register.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.status = "idle";
        state.user = action.payload.user;
        state.token = action.payload.token;
        if (typeof window !== "undefined") {
          localStorage.setItem("token", action.payload.token);
        }
      })
      .addCase(register.rejected, (state, action) => {
        state.status = "failed";
        const payload = action.payload as unknown;

        if (typeof payload === "string") {
          state.error = payload;
        } else if (payload && typeof payload === "object") {
          // Erreurs de validation Laravel : { champ: ["message", ...] }
          const first = Object.values(payload as Record<string, string[] | string>)[0];
          state.error = (Array.isArray(first) ? first[0] : first) || "Erreur lors de l'inscription";
        } else {
          state.error = "Erreur lors de l'inscription";
        }
      })
      .addCase(fetchMe.fulfilled, (state, action) => {
        state.user = action.payload;
      })
      .addCase(fetchMe.rejected, (state) => {
        state.user = null;
        state.token = null;
        if (typeof window !== "undefined") {
          localStorage.removeItem("token");
        }
      });
  },
});

export const { logout, setToken } = authSlice.actions;
export default authSlice.reducer;