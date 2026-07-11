import fs from "fs";
import path from "path";

function buildHTML() {
  console.log("Iniciando compilación de HTML Autónomo...");

  const distDir = path.join(process.cwd(), "dist");
  const assetsDir = path.join(distDir, "assets");

  if (!fs.existsSync(assetsDir)) {
    console.error("ERROR: No se encontró la carpeta 'dist/assets'. Primero debes ejecutar 'vite build'.");
    process.exit(1);
  }

  // Find JS and CSS files in dist/assets
  const files = fs.readdirSync(assetsDir);
  const jsFile = files.find(f => f.startsWith("index-") && f.endsWith(".js"));
  const cssFile = files.find(f => f.startsWith("index-") && f.endsWith(".css"));

  if (!jsFile || !cssFile) {
    console.error("ERROR: No se encontraron los archivos index-*.js o index-*.css compilados por Vite.");
    process.exit(1);
  }

  console.log(`Archivos de producción de Vite encontrados:\nJS: ${jsFile}\nCSS: ${cssFile}`);

  const jsContent = fs.readFileSync(path.join(assetsDir, jsFile), "utf-8");
  const cssContent = fs.readFileSync(path.join(assetsDir, cssFile), "utf-8");

  // Create the completely self-contained, offline-compatible HTML
  const htmlTemplate = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sistema Integrado de Planillas CAS</title>
  <style>
${cssContent}
  </style>
</head>
<body class="bg-gray-50/50 text-gray-900 antialiased min-h-screen">

  <div id="root"></div>

  <script type="module">
${jsContent}
  </script>
</body>
</html>`;

  // Write output
  const publicDir = path.join(process.cwd(), "public");
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  const outputPath = path.join(publicDir, "UGEL_Bellavista_Sistema_Local.html");
  fs.writeFileSync(outputPath, htmlTemplate, "utf-8");
  console.log(`Standalone HTML guardado con éxito en: ${outputPath}`);

  // Also write to root for backwards compatibility
  const rootPath = path.join(process.cwd(), "UGEL_Bellavista_Sistema_Local.html");
  fs.writeFileSync(rootPath, htmlTemplate, "utf-8");

  // Also write to dist/ for production build serving if dist already exists
  if (fs.existsSync(distDir)) {
    const distPath = path.join(distDir, "UGEL_Bellavista_Sistema_Local.html");
    fs.writeFileSync(distPath, htmlTemplate, "utf-8");
    console.log(`Standalone HTML copiado a dist para producción en: ${distPath}`);
  }
}

buildHTML();
