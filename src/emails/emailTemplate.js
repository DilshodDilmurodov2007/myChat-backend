export function createWelcomeEmailTemplate(name, clientURL) {
    return `
    <!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>frontend</title>
    <script type="module" crossorigin src="/assets/index-BaBB40Qq.js"></script>
    <link rel="stylesheet" crossorigin href="/assets/index-COcDBgFa.css">
  </head>
  <body>
    <p>Welcome, dear <strong>${name}</strong></p>
    <p>Click on the link, and start messaging!</p>
    <a href=${clientURL}>CLick Here!</a>
  </body>
</html>
    `
}