const net = require("net");
const fs = require("fs");
const zlib = require("zlib");
const path = require("path");

const PORT = 4221;
const HOST = "localhost";
const FILE_DIR = process.argv[3] || "./";

const parseRequest = (data) => {
  const lines = data.toString().split("\r\n");
  const [method, url, protocol] = lines[0].split(" ");
  const headers = Object.fromEntries(
    lines
      .slice(1)
      .filter(Boolean)
      .map((line) => line.split(": "))
      .filter(([key, val]) => key && val)
  );
  return { method, url, protocol, headers };
};

const writeResponse = (socket, status, headers = {}, body = "") => {
  const headerLines = Object.entries(headers)
    .map(([k, v]) => `${k}: ${v}`)
    .join("\r\n");
  const response = `HTTP/1.1 ${status}\r\n${headerLines}\r\n\r\n`;
  socket.write(response);
  if (body) socket.write(body);
};

const respond404 = (socket) => {
  writeResponse(socket, "404 Not Found");
};

const server = net.createServer((socket) => {
  socket.on("data", (data) => {
    const { method, url, headers } = parseRequest(data);

    if (url === "/") {
      writeResponse(socket, "200 OK");
    } else if (url.startsWith("/echo")) {
      const message = url.slice(6);
      const encodings = (headers["Accept-Encoding"] || "")
        .split(",")
        .map((e) => e.trim());

      if (encodings.includes("gzip")) {
        const compressed = zlib.gzipSync(message);
        writeResponse(
          socket,
          "200 OK",
          {
            "Content-Type": "text/plain",
            "Content-Encoding": "gzip",
            "Content-Length": compressed.length,
          },
          compressed
        );
      } else {
        writeResponse(
          socket,
          "200 OK",
          {
            "Content-Type": "text/plain",
            "Content-Length": message.length,
          },
          message
        );
      }
    } else if (url === "/user-agent") {
      const agent = headers["User-Agent"] || "";
      writeResponse(
        socket,
        "200 OK",
        {
          "Content-Type": "text/plain",
          "Content-Length": agent.length,
        },
        agent
      );
    } else if (url.startsWith("/files/")) {
      const fileName = url.replace("/files/", "").trim();
      const filePath = path.join(FILE_DIR, fileName);

      if (method === "GET") {
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath);
          writeResponse(
            socket,
            "200 OK",
            {
              "Content-Type": "application/octet-stream",
              "Content-Length": content.length,
            },
            content
          );
        } else {
          respond404(socket);
        }
      } else if (method === "POST") {
        const body = data.toString().split("\r\n").pop();
        fs.writeFileSync(filePath, body);
        writeResponse(socket, "201 Created");
      } else {
        respond404(socket);
      }
    } else {
      respond404(socket);
    }

    socket.end();
  });
});

server.listen(PORT, HOST, () => {
  console.log(`Server listening at ${HOST}:${PORT}`);
});

// Sachini
