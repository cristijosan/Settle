export enum RequestError {
  Authentication = "authentication",
  NoCredits = "noCredits",
  NotFound = "notFound",
  Conflict = "conflict",
  FileTooLarge = "fileTooLarge",
  UnsupportedFile = "unsupportedFile",
  InvalidRequest = "invalidRequest",
  ModelUnavailable = "modelUnavailable",
  RendererUnavailable = "rendererUnavailable",
  InternalError = "internalError",
  NoNetwork = "noNetworkConnection",
  Timeout = "timeout",
  Unexpected = "unexpected",
}

export class ApiError extends Error {
  constructor(public code: RequestError, public detail: string, public status?: number) {
    super(detail);
  }
}

const codeForStatus = (status: number): RequestError => {
  switch (status) {
    case 401: return RequestError.Authentication;
    case 402: return RequestError.NoCredits;
    case 404: return RequestError.NotFound;
    case 409: return RequestError.Conflict;
    case 413: return RequestError.FileTooLarge;
    case 415: return RequestError.UnsupportedFile;
    case 422: return RequestError.InvalidRequest;
    case 502: return RequestError.ModelUnavailable;
    case 503: return RequestError.RendererUnavailable;
    default: return status >= 500 ? RequestError.InternalError : RequestError.Unexpected;
  }
};

// Every backend error is `{ detail: string }`, except request validation (422),
// which is FastAPI's list of field errors.
const readDetail = (data: any): string => {
  const detail = data?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail) && detail.length > 0) {
    return detail.map((d) => d?.msg).filter(Boolean).join("\n");
  }
  return "Something went wrong. Please try again.";
};

export const parseError = (error: any): ApiError => {
  if (error instanceof ApiError) return error;
  if (error?.code === "ECONNABORTED") {
    return new ApiError(RequestError.Timeout, "The request took too long. Please try again.");
  }
  if (!error?.response) {
    return new ApiError(RequestError.NoNetwork, "No connection. Check your internet and try again.");
  }
  const { status, data } = error.response;
  return new ApiError(codeForStatus(status), readDetail(data), status);
};
