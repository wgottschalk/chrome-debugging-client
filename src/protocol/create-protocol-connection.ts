import Protocol from "devtools-protocol";
import { Connect, Connection } from "../../types/connect";
import { UsingTimeout } from "../../types/protocol-host";
import createPendingRequests from "./create-pending-requests";
import createRaceDisconnected from "./create-race-disconnected";

const DEFAULT_SEND_TIMEOUT = 5000;

export type Notify = (
  event: Event & { sessionId?: Protocol.Target.SessionID },
) => void;
export type SendRequest = (
  request: Request & { sessionId?: Protocol.Target.SessionID },
  timeout?: number,
) => Promise<Response>;

export default async function createDebuggingProtocolConnection(
  notify: Notify,
  connect: Connect,
  usingTimeout: UsingTimeout,
): Promise<Connection<SendRequest>> {
  const pending = createPendingRequests<Response>();

  const receive = (message: string) => {
    const eventOrResponse = JSON.parse(message) as Event | Response;
    if ("id" in eventOrResponse) {
      pending.resolveRequest(eventOrResponse.id, eventOrResponse);
    } else {
      notify(eventOrResponse);
    }
  };

  const { send, disconnect, disconnected, dispose } = await connect(receive);

  const raceDisconnected = createRaceDisconnected(
    disconnected,
    DEFAULT_SEND_TIMEOUT,
    usingTimeout,
  );

  const sendRequest = (
    request: Request & { id?: number },
    timeout?: number,
  ) => {
    const response = pending.responseFor(id => {
      request.id = id;
      return send(JSON.stringify(request));
    });
    return raceDisconnected(response, request.method, timeout);
  };

  return {
    disconnect,
    disconnected,
    dispose,
    send: sendRequest,
  };
}

export type Request = {
  method: string;
  params: object;
};

export type Event = {
  method: string;
  params: object;
};

export type SuccessResponse = {
  id: number;
  result: object;
};

export type ErrorResponse = {
  id: number;
  error: ResponseError;
  sessionId?: string;
};

export type ResponseError = {
  code: number;
  message: string;
  data?: string;
};

export type Response = SuccessResponse | ErrorResponse;
