import { HttpGet } from "../../types/protocol-host";
import RestClient from "../../types/rest-client";

export default function createRestClient(get: HttpGet): RestClient {
  async function list() {
    const body = await get("/json/list");
    return JSON.parse(body);
  }

  async function version() {
    const body = await get("/json/version");
    return JSON.parse(body);
  }

  async function open(url?: string) {
    let path = "/json/new";
    if (url) {
      path += "?" + encodeURIComponent(url);
    }
    const body = await get(path);
    return JSON.parse(body);
  }

  async function close(id: string) {
    await get(`/json/close/${id}`);
  }

  async function activate(id: string) {
    await get(`/json/activate/${id}`);
  }

  return {
    activate,
    close,
    list,
    open,
    version,
  };
}
