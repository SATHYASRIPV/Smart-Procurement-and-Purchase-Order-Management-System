// import axios from "axios";

// const BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://smart-procurement-and-purchase-order.onrender.com";

// let isRefreshing = false;
// let failedQueue = [];

 
// const api = axios.create({
//   baseURL: BASE_URL,
//   timeout: 60000,
//   headers: {
//     "Content-Type": "application/json",
//   },
//   withCredentials: true,
// });

 
// const processQueue = (error, token = null) => {
//   failedQueue.forEach((promise) => {
//     if (error) {
//       promise.reject(error);
//     } else {
//       promise.resolve(token);
//     }
//   });

//   failedQueue = [];
// };

  
// api.interceptors.request.use(
//   (config) => {
//     const token = localStorage.getItem("accessToken");
    
//     if (token) {
//       config.headers.Authorization = `Bearer ${token}`;
//     }

//     return config;
//   },
//   (error) => Promise.reject(error)
// );

 
// api.interceptors.response.use(
//   (response) => response,

//   async (error) => {
//     const originalRequest = error.config;
 
//     if (originalRequest.url.includes("/auth/refresh")) {
//       return Promise.reject(error);
//     }

//     if (
//       error.response?.status === 401 &&
//       !originalRequest._retry
//     ) {

       
//       if (isRefreshing) {
//         return new Promise((resolve, reject) => {
//           failedQueue.push({ resolve, reject });
//         }).then((token) => {
//           originalRequest.headers.Authorization =
//             "Bearer " + token;

//           return api(originalRequest);
//         });
//       }

//       originalRequest._retry = true;
//       isRefreshing = true;

//       try {

//         const refreshToken =
//           localStorage.getItem("refreshToken");

//         if (!refreshToken) {
//           throw new Error("Refresh token missing");
//         }

       
//         const response = await axios.post(
//           `${BASE_URL}/auth/refresh`,
//           {
//             refreshToken,
//           }
//         );

//         const tokens = response.data.data;

         
//         localStorage.setItem(
//           "accessToken",
//           tokens.accessToken
//         );

//         if (tokens.refreshToken) {
//           localStorage.setItem(
//             "refreshToken",
//             tokens.refreshToken
//           );
//         }

        
//         processQueue(null, tokens.accessToken);

         
//         originalRequest.headers.Authorization =
//           "Bearer " + tokens.accessToken;

//         return api(originalRequest);

//       } catch (err) {

//         processQueue(err, null);

        
//         localStorage.removeItem("accessToken");
//         localStorage.removeItem("refreshToken");
//         localStorage.removeItem("user");

//         if (
//           !window.location.pathname.startsWith("/login") &&
//           !window.location.pathname.startsWith("/register")
//         ) {
//           window.location.href = "/login";
//         }

//         return Promise.reject(err);

//       } finally {
//         isRefreshing = false;
//       }
//     }

//     return Promise.reject(error);
//   }
// );

// export default api;

import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'https://your-app.onrender.com';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ✅ Add access token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  config.withCredentials = true;
  return config;
}, (error) => {
  return Promise.reject(error);
});

// ✅ Handle 401 and refresh token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');

        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        const response = await axios.post(
          `${API_URL}/auth/refresh-token`,
          {},
          {
            headers: {
              Authorization: `Bearer ${refreshToken}`,
            },
          }
        );

        const { accessToken, refreshToken: newRefreshToken } = response.data.data;

        // ✅ Update tokens
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', newRefreshToken);
        api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

        // ✅ Retry original request
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);

      } catch (refreshError) {
        // ✅ Token refresh failed, logout
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userId');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // ✅ Clear cache on 304
    if (error.response?.status === 304) {
      window.location.reload();
    }

    return Promise.reject(error);
  }
);

export default api;