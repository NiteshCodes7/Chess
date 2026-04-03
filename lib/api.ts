import axios from "axios";
import { updateAllSocketAuth } from "./socketManager";

let accessToken: string | null = null;

export function setAccessToken(t: string | null) {
  accessToken = t;
}

export function getAccessToken() {
  return accessToken;
}

export const api = axios.create({
  baseURL: "http://localhost:3001",
  withCredentials: true,
});

api.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

api.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalRequest = err.config;
     if (originalRequest.url?.includes("/auth/refresh")) {
      setAccessToken(null);
      localStorage.setItem("wsToken", "");
      return Promise.reject(err); ;
    }

    if (err.response?.status === 401 && !err.config._retry) {
      err.config._retry = true;
      try {
        const { data } = await api.post("/auth/refresh");
        setAccessToken(data.accessToken);
        localStorage.setItem("wsToken", data.wsToken);
        updateAllSocketAuth(data.wsToken)
        return api(err.config);
      } catch {
        setAccessToken(null);
        window.location.href = "/auth/login";
      }
    }
    throw err;
  }
);


/* 🔐 AUTH FLOW — QUICK MEMORY GUIDE

1. LOGIN
   User sends email + password → backend verifies
   → returns:

* accessToken (response body)
* refreshToken (httpOnly cookie)

Frontend:

* stores accessToken in memory
* browser stores refreshToken automatically (cookie)

---

2. NORMAL REQUEST
   Frontend calls API → interceptor adds:
   Authorization: Bearer accessToken

Backend:

* verifies token
* extracts userId
* returns data

---

3. TOKEN EXPIRES
   Request fails with:
   401 Unauthorized

---

4. AUTO REFRESH
   Frontend interceptor triggers:
   POST /auth/refresh

Browser automatically sends:
refreshToken (cookie)

Backend:

* validates refresh token
* issues new accessToken (+ new refreshToken)

Frontend:

* updates accessToken in memory

---

5. RETRY REQUEST
   Frontend retries original request

Interceptor adds:
Authorization: Bearer NEW accessToken

Backend:

* validates new token
* request succeeds

---

6. LOGOUT / FAILURE
   If refresh fails:

* clear tokens
* redirect to login

---

🧠 CORE IDEA:

accessToken → short-lived → used for every request
refreshToken → long-lived → used only to get new access token

---

⚡ ONE-LINE FLOW:

Login → Store → Send → Expire → Refresh → Retry → Success

 */