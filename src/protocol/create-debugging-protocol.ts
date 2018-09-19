import Message from "../../types/message";
import createPendingRequests from "./create-pending-requests";
import createProtocolError from "./create-protocol-error";

export type EmitEvent = (event: string, params?: any) => void;
export type CreateConnection<T> = (
  receiveMessage: ReceiveMessage,
  createSendCommand: CreateSendCommand<T>,
) => Promise<T>;
export type ReceiveMessage = (message: string) => void;
export type CreateSendCommand<T> = (
  sendMessage: SendMessage,
  usingSendCommand: (client: SendCommand) => Promise<T>,
) => Promise<T>;
export type SendMessage = (message: string) => Promise<void>;
export type SendCommand = (params?: any) => Promise<any>;

export default async function createDebuggingProtocol<T>(
  emitEvent: EmitEvent,
  connect: CreateConnection<T>,
): Promise<T> {
  return await createPendingRequests<T, Message.Response>(
    async (responseFor, resolveRequest) => {
      const receiveMessage = (data: string) => {
        const message: Message = JSON.parse(data);
        if ("id" in message) {
          resolveRequest(message.id, message);
        } else {
          emitEvent(message.method, message.params);
        }
      };
      return await connect(
        receiveMessage,
        async (sendMessage, using) => {
          const sendCommand = async (method: string, params?: any) => {
            const sendRequest = (id: number) =>
              sendMessage(JSON.stringify({ id, method, params }));
            const response = await responseFor(sendRequest);
            if ("error" in response) {
              throw createProtocolError(response.error);
            }
            return response.result;
          };
          return await using(sendCommand);
        },
      );
    },
  );
}
