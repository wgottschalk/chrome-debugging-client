import { HttpClient } from "../../types/host";
import HttpProtocolClient from "../../types/http-protocol-client";

export default function createAPIClient(
  httpClient: HttpClient,
): HttpProtocolClient {
  async function list() {
    const body = await httpClient.get("/json/list");
    return JSON.parse(body);
  }

  async function version() {
    const body = await httpClient.get("/json/version");
    return JSON.parse(body);
  }

  async function open(url?: string) {
    let path = "/json/new";
    if (url) {
      path += "?" + encodeURIComponent(url);
    }
    const body = await httpClient.get(path);
    return JSON.parse(body);
  }

  async function close(id: string) {
    await httpClient.get(`/json/close/${id}`);
  }

  async function activate(id: string) {
    await httpClient.get(`/json/activate/${id}`);
  }

  return {
    activate,
    close,
    list,
    open,
    version,
  };
}
