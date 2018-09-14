export namespace Message {
  export type Event = {
    method: string;
    params: any;
  };

  export type SuccessResponse = {
    id: number;
    result: any;
  };

  export type ErrorResponse = {
    id: number;
    error: ResponseError;
  };

  export type ResponseError = {
    code: number;
    message: string;
    data?: string;
  };

  export type Response = SuccessResponse | ErrorResponse;
}

export type Message = Message.Event | Message.Response;

export default Message;
