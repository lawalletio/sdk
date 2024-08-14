export interface Api {
  get: (endpoint: string, options?: Record<string, any>) => Promise<any>;
  post: (endpoint: string, options?: Record<string, any>, formatJSONResponse?: boolean) => Promise<any>;
  put: (endpoint: string, options?: Record<string, any>, formatJSONResponse?: boolean) => Promise<any>;
  del: (endpoint: string, options?: Record<string, any>, formatJSONResponse?: boolean) => Promise<any>;
}

export const Api = () => {
  const customFetch = (
    endpoint: string,
    options: Record<string, any> = {},
    formatJSONResponse: boolean = true,
  ): Promise<any> => {
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
        if (!formatJSONResponse) return res;

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

  const post = (url: string, options: Record<string, any> = {}, formatJSONResponse: boolean = true): Promise<any> => {
    options.method = 'POST';
    return customFetch(url, options, formatJSONResponse);
  };

  const put = (url: string, options: Record<string, any> = {}, formatJSONResponse: boolean = true): Promise<any> => {
    options.method = 'PUT';
    return customFetch(url, options, formatJSONResponse);
  };

  const del = (url: string, options: Record<string, any> = {}, formatJSONResponse: boolean = true): Promise<any> => {
    options.method = 'DELETE';
    return customFetch(url, options, formatJSONResponse);
  };

  return {
    get,
    post,
    put,
    del,
  };
};
