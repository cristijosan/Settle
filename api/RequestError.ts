export enum RequestError {
  Authentication = "authentication",
  InternalError = "internalError",
  InvalidRequest = "invalidRequest",
  NoNetwork = "noNetworkConnection",
  Timeout = "timeout",
  DecodingError = "decodingResponseError",
  Unexpected = "unexpected"
}

export const parseError = (error: any): RequestError => {
  if (!error.response) return RequestError.NoNetwork;
  switch (error.response.status) {
    case 401: return RequestError.Authentication;
    case 422: return RequestError.InvalidRequest;
    case 500: return RequestError.InternalError;
    default: return RequestError.Unexpected;
  }
};