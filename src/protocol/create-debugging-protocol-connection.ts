import Message from "../../types/message";
import createPendingRequests from "./create-pending-requests";
import createProtocolError from "./create-protocol-error";

export default async function createDebuggingProtocolConnection(
  delegate: {
    emitEvent: (event: string, params?: any) => void;
  },
  connect: (
    delegate: {
      receive(message: string): void;
    },
  ) => Promise<{
    disconnected: Promise<void>;
    send: (messing: string) => Promise<void>;
    disconnect: () => Promise<void>;
  }>,
): Promise<{
  disconnected: Promise<void>;
  send(command: string, params?: any): Promise<any>;
  disconnect(): Promise<void>;
}> {
  const pending = createPendingRequests<Message.Response>();

  const receive = (data: string) => {
    const message: Message = JSON.parse(data);
    if ("id" in message) {
      pending.resolveRequest(message.id, message);
    } else {
      delegate.emitEvent(message.method, message.params);
    }
  };

  const connection = await connect({
    receive,
  });

  const send = async (method: string, params?: any) => {
    const response = await pending.responseFor(
      id => connection.send(JSON.stringify({ id, method, params })),
      connection.disconnected.then(() => {
        throw new Error(`disconnected before ${method} response`);
      }),
    );
    if ("error" in response) {
      throw createProtocolError(response.error);
    }
    return response.result;
  };

  return {
    disconnect: connection.disconnect,
    disconnected: connection.disconnected,
    send,
  };
}
