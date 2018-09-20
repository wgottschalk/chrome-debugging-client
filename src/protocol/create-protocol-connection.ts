import { Connect, Connection } from "../../types/connect";
import createPendingRequests from "./create-pending-requests";
import createProtocolError from "./create-protocol-error";

export type EmitEvent = (event: string, params?: object) => void;
export type SendCommand = (method: string, params?: object) => Promise<object>;

export default async function createDebuggingProtocolConnection(
  emitEvent: EmitEvent,
  connect: Connect,
): Promise<Connection<SendCommand>> {
  const pending = createPendingRequests<Response>();

  const receive = (data: string) => {
    const message = parse(data);
    if ("id" in message) {
      pending.resolveRequest(message.id, message);
    } else {
      emitEvent(message.method, message.params);
    }
  };

  const connection = await connect(receive);

  const send = async (method: string, params: object = {}) => {
    const response = await pending.responseFor(
      id => connection.send(serialize(id, method, params)),
      connection.disconnected.then(() => {
        throw new Error(`disconnected before ${method} response`);
      }),
    );
    if ("error" in response) {
      const { message, code, data } = response.error;
      throw createProtocolError(message, code, data);
    }
    return response.result;
  };

  return {
    disconnect: connection.disconnect,
    disconnected: connection.disconnected,
    send,
  };
}

function parse(message: string): Message {
  return JSON.parse(message);
}

function serialize(id: number, method: string, params: object): string {
  return JSON.stringify({ id, method, params });
}

type Event = {
  method: string;
  params: object;
};

type SuccessResponse = {
  id: number;
  result: object;
};

type ErrorResponse = {
  id: number;
  error: ResponseError;
};

type ResponseError = {
  code: number;
  message: string;
  data?: string;
};

type Response = SuccessResponse | ErrorResponse;
type Message = Event | Response;
