const BASE_URL =
  process.env.REACT_APP_ENV === "qa"
    ? process.env.REACT_APP_API_BASE_URL_QA
    : process.env.REACT_APP_API_BASE_URL_PROD;

export default BASE_URL;