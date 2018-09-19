import { ClientRequest, get, IncomingMessage } from "http";
import { HttpClient } from "../../types/protocol-host";

export default function createHttpClient(
  host: string,
  port: number,
): HttpClient {
  return {
    async get(path: string): Promise<string> {
      const request = get({ host, port, path });
      const response = await getResponse(request);
      const statusCode = response.statusCode;
      const body = await readResponseBody(response);
      if (typeof statusCode === "number" && statusCode !== 200) {
        throw new ResponseError(body, statusCode);
      }
      return body;
    },
  };
}

function getResponse(request: ClientRequest): Promise<IncomingMessage> {
  return new Promise<IncomingMessage>((resolve, reject) => {
    request.once("response", resolve);
    request.once("error", reject);
  });
}

async function readResponseBody(response: IncomingMessage): Promise<string> {
  let body = "";
  response.setEncoding("utf8");
  response.on("data", chunk => {
    body += chunk;
  });
  await new Promise<IncomingMessage>((resolve, reject) => {
    response.once("end", resolve);
    response.once("error", reject);
  });
  return body;
}

/* tslint:disable:max-classes-per-file */
class ResponseError extends Error {
  public statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
  }
}
