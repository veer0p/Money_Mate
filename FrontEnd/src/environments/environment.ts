const getApiUrl = () => {
  const hostname = window.location.hostname;
  const port = '5000';
  return `http://${hostname}:${port}/api`;
};

export const environment = {
    production: false,
    apiUrl: getApiUrl(),
};
