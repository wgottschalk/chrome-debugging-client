export interface ConnectionDelegate {
  onMessage(message: string): void;
  onDisconnect(): void;
}

export interface Connection {
  send(message: string): Promise<void>;
}

export default Connection;
