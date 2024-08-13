export interface IUseFetch {
  get: (endpoint: string, options?: Record<string, any>) => Promise<any>;
  post: (endpoint: string, options?: Record<string, any>) => Promise<any>;
  put: (endpoint: string, options?: Record<string, any>) => Promise<any>;
  del: (endpoint: string, options?: Record<string, any>) => Promise<any>;
}

export const Api = (): IUseFetch => {
  const customFetch = (endpoint: string, options: Record<string, any> = {}): Promise<any> => {
    const defaultHeader = {
      // accept: "application/json",
      'Content-Type': 'application/json',
    };

    const controller = new AbortController();
    options.signal = controller.signal;

    options.method = options.method || 'GET';
    options.headers = options.headers ? { ...defaultHeader, ...options.headers } : defaultHeader;

    setTimeout(() => controller.abort(), 8000);

    return fetch(endpoint, options)
      .then((res) => {
        return res.json().then((responseJSON) => {
          if (!responseJSON) {
            return Promise.reject({
              err: true,
              status: res.status || '00',
              statusText: res.statusText,
            });
          }

          return responseJSON;
        });
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const get = (url: string, options: Record<string, any> = {}): Promise<any> => customFetch(url, options);

  const post = (url: string, options: Record<string, any> = {}): Promise<any> => {
    options.method = 'POST';
    return customFetch(url, options);
  };

  const put = (url: string, options: Record<string, any> = {}): Promise<any> => {
    options.method = 'PUT';
    return customFetch(url, options);
  };

  const del = (url: string, options: Record<string, any> = {}): Promise<any> => {
    options.method = 'DELETE';
    return customFetch(url, options);
  };

  return {
    get,
    post,
    put,
    del,
  };
};
