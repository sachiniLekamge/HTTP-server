const net = require("net");
const fs = require("fs");
const zlib = require("zlib");

console.log("Logs from your program will appear here!");

const parseRequest = (requestData) => {
  const request = requestData.toString().split("\r\n");
  const [method, path, protocol] = request[0].split(" ");
  const headers = {};
  request.slice(1).forEach((header) => {
    const [key, ...rest] = header.split(": ");
    if (key && rest.length > 0) {
      headers[key] = rest.join(": ");
    }
  });
  return { method, path, protocol, headers };
};

const OK_RESPONSE = "HTTP/1.1 200 OK\r\n\r\n";
const ERROR_RESPONSE = "HTTP/1.1 404 Not Found\r\n\r\n";

const server = net.createServer((socket) => {
  socket.on("data", (data) => {
    const request = parseRequest(data);
    const { method, path, protocol, headers } = request;

    if (path === "/") {
      socket.write(OK_RESPONSE);
    } else if (path.startsWith("/echo")) {
      const message = path.substring(6);
      const acceptEncoding = headers["Accept-Encoding"] || "";
      const encodings = acceptEncoding.split(",").map((e) => e.trim());

      if (encodings.includes("gzip")) {
        const compressed = zlib.gzipSync(message);
        socket.write(
          `HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Encoding: gzip\r\nContent-Length: ${compressed.length}\r\n\r\n`
        );
        socket.write(compressed);
      } else {
        socket.write(
          `HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${message.length}\r\n\r\n${message}`
        );
      }
    } else if (path.startsWith("/user-agent")) {
      const agent = headers["User-Agent"] || "";
      socket.write(
        `HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${agent.length}\r\n\r\n${agent}`
      );
    } else if (path.startsWith("/files/") && method === "GET") {
      const fileName = path.replace("/files/", "").trim();
      const filePath = process.argv[3] + fileName;
      const isExist = fs
        .readdirSync(process.argv[3])
        .some((file) => file === fileName);

      if (isExist) {
        const content = fs.readFileSync(filePath, "utf-8");
        socket.write(
          `HTTP/1.1 200 OK\r\nContent-Type: application/octet-stream\r\nContent-Length: ${content.length}\r\n\r\n${content}`
        );
      } else {
        socket.write(ERROR_RESPONSE);
      }
    } else if (path.startsWith("/files/") && method === "POST") {
      const filename = process.argv[3] + "/" + path.substring(7);
      const req = data.toString().split("\r\n");
      const body = req[req.length - 1];
      fs.writeFileSync(filename, body);
      socket.write(`HTTP/1.1 201 Created\r\n\r\n`);
    } else {
      socket.write(ERROR_RESPONSE);
    }

    socket.end();
  });
});

server.listen(4221, "localhost");
