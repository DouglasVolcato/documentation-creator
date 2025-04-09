const http = require("http");
const fs = require("fs");
const path = require("path");
const url = require("url");

const srcDirectory = path.join(__dirname, "src");
const filesDirectory = path.join(__dirname, "files");

// Formata nomes como 'plantões-teste' => 'Plantões teste'
function formatName(filename) {
  const noExtension = filename.replace(/\.html$/, "");
  const noHyphens = noExtension.replace(/-/g, " ");
  const words = noHyphens.split(" ");
  if (words.length === 0) return "";

  const capitalized =
    words[0].charAt(0).toUpperCase() + words[0].slice(1).toLowerCase();

  return [capitalized, ...words.slice(1)].join(" ");
}

// Lê HTMLs recursivamente e gera estrutura em árvore
function getHtmlFiles(dir, base = "") {
  const structure = [];
  const items = fs.readdirSync(dir, { withFileTypes: true });

  for (const item of items) {
    const relativePath = path.join(base, item.name);
    const fullPath = path.join(dir, item.name);

    if (item.isDirectory()) {
      structure.push({
        name: formatName(item.name),
        type: "folder",
        children: getHtmlFiles(fullPath, relativePath),
      });
    } else if (item.isFile() && item.name.endsWith(".html")) {
      structure.push({
        name: formatName(item.name),
        type: "file",
        path: relativePath.replace(/\\/g, "/"),
        rawName: item.name,
      });
    }
  }

  return structure;
}

// Gera navbar HTML
function generateNavbar(structure, level = 0) {
  let html = `<ul class="${level === 0 ? "navbar" : "dropdown"}">`;

  for (const item of structure) {
    if (item.type === "folder") {
      html += `
        <li class="dropdown-item">
          <span class="dropdown-toggle" onclick="toggleDropdown(this)">⚫ ${item.name}</span>
          ${generateNavbar(item.children, level + 1)}
        </li>`;
    } else {
      html += `
        <li class="file-item">
          <a href="/${item.path}" data-path="${item.path}">${item.name}</a>
        </li>`;
    }
  }

  html += `</ul>`;
  return html;
}

// Injeta navbar no HTML
function injectNavbarIntoHtml(originalHtml, navbarHtml, currentPath) {
  const formattedPath = decodeURIComponent(currentPath)
    .replace(/^\//, "")
    .replace(/\.html$/, "")
    .split("/")
    .map(part => formatName(part))
    .join(" / ");

  const fullHtml = `
    <html>
      <head>
        <meta charset="UTF-8" />
        <title>${formattedPath}</title>
        <style>
          * { box-sizing: border-box; }
          body {
            margin: 0;
            font-family: Arial, sans-serif;
            display: flex;
            min-height: 100vh;
          }
          nav {
            background-color: #2c3e50;
            width: 250px;
            min-height: 100vh;
            padding-top: 20px;
            position: fixed;
            left: 0;
            top: 0;
            overflow-y: auto;
          }
          .navbar, .dropdown {
            list-style: none;
            padding: 0;
            margin: 0;
          }
          .navbar li, .dropdown li {
            position: relative;
          }
          .navbar a, .dropdown-toggle {
            color: white;
            text-decoration: none;
            display: block;
            padding: 10px 20px;
            cursor: pointer;
          }
          .navbar a:hover, .dropdown-toggle:hover {
            background-color: #1abc9c;
          }
          .dropdown {
            display: none;
            background-color: #34495e;
          }
          .dropdown-item.open > .dropdown {
            display: block;
          }
          .search-container {
            padding: 10px;
          }
          .search-container input {
            width: 90%;
            padding: 5px;
            margin: 10px;
          }
          main {
            margin-left: 250px;
            padding: 20px;
            flex: 1;
          }
          .breadcrumb {
            background: #f0f0f0;
            padding: 10px;
            font-size: 14px;
            border-bottom: 1px solid #ddd;
            margin-bottom: 20px;
          }
        </style>
      </head>
      <body>
        <nav>
          <div class="search-container">
            <input type="text" id="searchInput" placeholder="Buscar" />
          </div>
          ${navbarHtml}
        </nav>
        <main>
          <div class="breadcrumb">${formattedPath}</div>
          ${originalHtml}
        </main>
        <script>
          function toggleDropdown(el) {
            const parent = el.parentElement;
            parent.classList.toggle('open');
          }

          document.getElementById('searchInput').addEventListener('input', function () {
            const term = this.value.toLowerCase();
            const links = document.querySelectorAll("nav a");
            links.forEach(link => {
              const text = link.textContent.toLowerCase();
              link.parentElement.style.display = text.includes(term) ? "block" : "none";
            });
          });

          document.querySelectorAll("nav a").forEach(link => {
            link.addEventListener("click", function (e) {
              const path = decodeURIComponent(this.dataset.path)
                .replace(/\.html$/, "")
                .split("/")
                .map(part => formatName(part))
                .join(" / ");
              document.querySelector(".breadcrumb").textContent = path;
            });
          });
        </script>
      </body>
    </html>
  `;

  return fullHtml;
}

// Gera navbar baseada nos arquivos HTML
const htmlStructure = getHtmlFiles(srcDirectory);
const navbarHtml = generateNavbar(htmlStructure);

// Cria servidor
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url);
  let requestedPath = parsedUrl.pathname === "/" ? "/index.html" : parsedUrl.pathname;

  let filePath;
  let isHtml = false;

  if (requestedPath.startsWith("/files/")) {
    filePath = path.join(filesDirectory, decodeURIComponent(requestedPath.replace("/files/", "")));
    if (!filePath.startsWith(filesDirectory)) {
      res.writeHead(403);
      return res.end("Forbidden");
    }
  } else {
    filePath = path.join(srcDirectory, decodeURIComponent(requestedPath));
    if (!filePath.startsWith(srcDirectory)) {
      res.writeHead(403);
      return res.end("Forbidden");
    }
    isHtml = filePath.endsWith(".html");
  }

  fs.readFile(filePath, isHtml ? "utf-8" : null, (err, data) => {
    if (err) {
      res.writeHead(404);
      return res.end("Not Found");
    }

    if (isHtml) {
      const finalHtml = injectNavbarIntoHtml(data, navbarHtml, requestedPath);
      res.writeHead(200, { "Content-Type": "text/html" });
      return res.end(finalHtml);
    } else {
      const ext = path.extname(filePath).toLowerCase();
      const mimeTypes = {
        ".pdf": "application/pdf",
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".gif": "image/gif",
        ".mp4": "video/mp4",
        ".mp3": "audio/mpeg",
        ".txt": "text/plain",
        ".json": "application/json",
        ".zip": "application/zip",
      };
      const contentType = mimeTypes[ext] || "application/octet-stream";
      res.writeHead(200, { "Content-Type": contentType });
      return res.end(data);
    }
  });
});

server.listen(3000, () => {
  console.log("🌐 Server running at http://localhost:3000");
});
