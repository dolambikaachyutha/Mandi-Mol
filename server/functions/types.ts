export interface FunctionEvent {
  httpMethod: string;
  path: string;
  headers: Record<string, string>;
  queryStringParameters: Record<string, string> | null;
  body: string | null;
  isBase64Encoded: boolean;
  rawUrl: string;
  rawQuery: string;
}

export interface FunctionResponse {
  statusCode?: number;
  headers?: Record<string, string | number | boolean | undefined>;
  body?: string;
  isBase64Encoded?: boolean;
}

export type Handler = (event: FunctionEvent) => FunctionResponse | Promise<FunctionResponse>;
