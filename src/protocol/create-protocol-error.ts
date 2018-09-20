export type ProtocolError = Error & { code: number; data: any };

export default function createProtocolError(
  message: string,
  code: number,
  data?: string,
): ProtocolError {
  const msg = data ? `${message}:${data}` : message;
  const err = new Error(msg);
  return Object.assign(err, { code, data });
}
