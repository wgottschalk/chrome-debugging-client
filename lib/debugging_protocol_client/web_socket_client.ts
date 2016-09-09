import { WebSocketDelegate, WebSocketConnection } from "../host";
import { Protocol, Domain } from "../debugging_protocol/json_interface";

/**
 * Delagate for a web socket that handles the debugging protocol
 */
export class WebSocketDebuggingProtocolClient implements WebSocketDelegate {
  private seq = 0;
  private pendingRequests = new Map<number, Request>();
  private domains = new Map<string, {
    [event: string]: (params: any) => void;
  }>();
  private defs = new Map<string, Domain>();
  private connection: WebSocketConnection;
  private protocol: Protocol;

  constructor(connection: WebSocketConnection) {
    this.connection = connection;
    connection.setDelegate(this);
  }

  public setProtocol(protocol: Protocol) {
    this.protocol = protocol;
    protocol.domains.forEach(domain => this.defineDomain(domain));
  }

  public defineDomain(def: Domain) {
    this.defs.set(def.domain, def);
  }

  public domain(id: string): any {
    let domain: any = this.domains.get(id);
    if (domain) return domain;

    let def = this.defs.get(id);
    if (!def) throw new Error(`no domain defined for ${id}`);

    domain = Object.create(null);
    this.domains.set(id, domain);

    def.commands.forEach(command => {
      let method = qualify(id, command.name);
      domain[command.name] = (params: any) => this.sendRequest(method, params);
    });

    if (def.events) {
      def.events.forEach(event => {
        domain[event.name] = undefined;
      });
    }

    return domain;
  }

  onMessage(data: string) {
    try {
      this.dispatchMessage(JSON.parse(data));
    } catch (err) {
      this.onError(err);
    }
  }

  onClose() {
    this.rejectPending(new Error("socket disconnect"));
  }

  onError(err: Error) {
    this.rejectPending(err);
    this.connection.close();
  }

  private dispatchMessage(message: Message) {
    if (isEvent(message)) {
      this.dispatchEvent(message);
    } else {
      this.dispatchResponse(message);
    }
  }

  private dispatchEvent(event: EventMessage) {
    let parts = event.method.split(".");
    let domainName = parts[0];
    let eventName = parts[1];
    let domain = this.domains.get(domainName);
    let handler = domain && domain[eventName];
    if (handler) {
      handler(event.params);
    }
  }

  private dispatchResponse(response: ResponseMessage) {
    let request = this.pendingRequests.get(response.id);
    this.pendingRequests.delete(response.id);
    if (request) request.resolve(response);
  }

  private rejectPending(err: Error) {
    if (this.pendingRequests.size) {
      this.pendingRequests.forEach((req) => {
        req.reject(err);
      });
      this.pendingRequests.clear();
    }
  }

  sendRequest(method: string, params?: any): Promise<any> {
    return new Promise<ResponseMessage>((resolve, reject) => {
      let id = ++this.seq;
      let data = JSON.stringify({ id, method, params });
      let request = { id, method, params, resolve, reject };
      this.pendingRequests.set(id, request);
      this.connection.send(data);
    }).then((response: ResponseMessage) => {
      if (isError(response)) {
        throw new ProtocolError(response.error);
      } else {
        return response.result;
      }
    });
  }
}

class ProtocolError extends Error {
  code: number;
  constructor(err: {
    code: number;
    message: string;
  }) {
    super(err.message);
    this.code = err.code;
  }
}

interface Request {
  id: number;
  method: string;
  params: string;
  resolve: (response: ResponseMessage) => void;
  reject: (reason: any) => void;
}

interface EventMessage {
  method: string;
  params: any;
}

interface SuccessResponseMessage {
  id: number;
  result: any;
}

interface ErrorResponseMessage {
  id: number;
  error: {
    code: number;
    message: string;
  };
}

type Message = EventMessage | ResponseMessage;
function isEvent(message: Message): message is EventMessage {
  return typeof (<EventMessage>message).method === "string";
}

function isError(response: ResponseMessage): response is ErrorResponseMessage {
  return typeof (<ErrorResponseMessage>response).error === "object";
}

type ResponseMessage = SuccessResponseMessage | ErrorResponseMessage;

function qualify(id: string, name: string) {
  return id + "." + name;
}