export type SendMessage = (message: string) => Promise<void>;
export type ReceiveMessage = (message: string) => void;

export type Connect<T> = (
  receiveMessage: ReceiveMessage,
  using: (sendMessage: SendMessage) => Promise<T>,
) => Promise<T>;

export default Connect;
