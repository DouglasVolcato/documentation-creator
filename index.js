const http = require("http");
const fs = require("fs");
const path = require("path");

const srcDirectory = path.join(__dirname, "src");

function getHtmlFiles(dir, base = "") {
  const structure = [];
  const items = fs.readdirSync(dir, { withFileTypes: true });

  for (const item of items) {
    const relativePath = path.join(base, item.name);
    const fullPath = path.join(dir, item.name);

    if (item.isDirectory()) {
      structure.push({
        name: item.name,
        type: "folder",
        children: getHtmlFiles(fullPath, relativePath),
      });
    } else if (item.isFile() && item.name.endsWith(".html")) {
      structure.push({
        name: item.name,
        type: "file",
        path: relativePath.replace(/\\/g, "/"),
      });
    }
  }

  return structure;
}

function generateNavbar(structure, level = 0) {
  let html = `<ul class="${level === 0 ? "navbar" : "dropdown"}">`;

  for (const item of structure) {
    if (item.type === "folder") {
      html += `
        <li class="dropdown-item">
          <span class="dropdown-toggle">${item.name} ▶</span>
          ${generateNavbar(item.children, level + 1)}
        </li>`;
    } else {
      html += `<li><a href="/${item.path}">${item.name}</a></li>`;
    }
  }

  html += `</ul>`;
  return html;
}

function injectNavbarIntoHtml(originalHtml, navbarHtml) {
  const fullHtml = `
    <html>
      <head>
        <meta charset="UTF-8" />
        <title>Site</title>
        <style>
            * {
                box-sizing: border-box;
            }

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
                transition: transform 0.3s ease;
            }

            nav.closed {
                transform: translateX(-100%);
            }

            .toggle-btn {
                background-color: #1abc9c;
                color: white;
                border: none;
                padding: 10px 15px;
                cursor: pointer;
                font-size: 18px;
                position: fixed;
                top: 15px;
                right: 15px;
                z-index: 1000;
                border-radius: 7px;
                display: none;
            }

            .navbar, .dropdown {
                list-style: none;
                padding: 0;
                margin: 0;
            }

            .navbar li {
                position: relative;
            }

            .navbar a, .dropdown-toggle {
                color: white;
                text-decoration: none;
                display: block;
                padding: 10px 20px;
            }

            .navbar a:hover, .dropdown-toggle:hover {
                background-color: #1abc9c;
            }

            .dropdown {
                display: none;
                background-color: #34495e;
            }

            li:hover > .dropdown {
                display: block;
            }

            .dropdown li .dropdown {
                margin-left: 10px;
            }

            main {
                margin-left: 250px;
                padding: 20px;
                flex: 1;
            }

            @media (max-width: 768px) {
                nav {
                transform: translateX(-100%);
                }

                nav.open {
                transform: translateX(0);
                }

                main {
                margin-left: 0;
                padding-top: 60px;
                }

                .toggle-btn {
                display: block;
                }
            }
        </style>
      </head>
      <body>
        <button id="toggleSidebar" class="toggle-btn">☰</button>
        <nav>${navbarHtml}</nav>
        <main>${originalHtml}</main>
        <script>
        document.addEventListener("DOMContentLoaded", () => {
            const nav = document.querySelector("nav");
            const toggle = document.querySelector("#toggleSidebar");

            toggle.addEventListener("click", () => {
            nav.classList.toggle("open");
            });
        });
        </script>
      </body>
    </html>
  `;

  return fullHtml;
}

const htmlStructure = getHtmlFiles(srcDirectory);
const navbarHtml = generateNavbar(htmlStructure);

const server = http.createServer((req, res) => {
  let requestedPath = req.url === "/" ? "/index.html" : req.url;
  const filePath = path.join(srcDirectory, requestedPath);

  if (!filePath.startsWith(srcDirectory)) {
    res.writeHead(403);
    return res.end("Forbidden");
  }

  fs.readFile(filePath, "utf-8", (err, data) => {
    if (err || !filePath.endsWith(".html")) {
      res.writeHead(404);
      return res.end("Not Found");
    }

    const finalHtml = injectNavbarIntoHtml(data, navbarHtml);
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(finalHtml);
  });
});

server.listen(3000, () => {
  console.log("🌐 Server running at http://localhost:3000");
});
