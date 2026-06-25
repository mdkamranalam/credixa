import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "https://credixa-backend-7r4k.onrender.com/api",
    withCredentials: true,
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");
        if (token) {
            config.headers["Authorization"] = `Bearer ${token}`;
        }
        return config;
    }, (error) => {
        Promise.reject(error);
    }
);

api.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        if (
            error.response && 
            error.response.status === 401 &&
            !originalRequest.url.includes('/auth/login') &&
            !originalRequest.url.includes('/auth/register') &&
            !originalRequest.url.includes('/auth/refresh')
        ) {
            if (!originalRequest._retry) {
                if (isRefreshing) {
                    return new Promise(function(resolve, reject) {
                        failedQueue.push({ resolve, reject });
                    }).then(token => {
                        originalRequest.headers['Authorization'] = 'Bearer ' + token;
                        return api(originalRequest);
                    }).catch(err => {
                        return Promise.reject(err);
                    });
                }

                originalRequest._retry = true;
                isRefreshing = true;

                try {
                    const { data } = await api.post('/auth/refresh');
                    localStorage.setItem('token', data.token);
                    
                    api.defaults.headers.common['Authorization'] = 'Bearer ' + data.token;
                    originalRequest.headers['Authorization'] = 'Bearer ' + data.token;
                    
                    processQueue(null, data.token);
                    return api(originalRequest);
                } catch (err) {
                    processQueue(err, null);
                    // Refresh token is invalid/expired
                    console.warn("Authentication failed. Wiping stale session and redirecting to login.");
                    localStorage.removeItem("token");
                    localStorage.removeItem("user");
                    window.location.href = "/login";
                    return Promise.reject(err);
                } finally {
                    isRefreshing = false;
                }
            }
        }
        
        // Handle 403 or non-refreshable 401s
        if (error.response && error.response.status === 403) {
            console.warn("Access forbidden.");
        }

        return Promise.reject(error);
    }
);

export default api;