export type SendMessage = (message: string) => Promise<void>;
export type ReceiveMessage = (message: string) => void;

export type Connection<Send> = {
  send: Send;
  dispose: () => Promise<void>;
  disconnect: () => Promise<void>;
  disconnected: Promise<void>;
};

export type Connect = (
  receive: ReceiveMessage,
) => Promise<Connection<SendMessage>>;

export default Connect;
