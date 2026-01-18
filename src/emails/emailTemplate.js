export function createWelcomeEmailTemplate(name, clientURL) {
    return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Welcome to myChat</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.5; color: #111;">
        <p>Welcome, <strong>${name}</strong>!</p>
        <p>Click the link below to start messaging:</p>
        <p>
          <a href="${clientURL}" style="color: #1a73e8; text-decoration: none;">Open myChat</a>
        </p>
      </body>
    </html>
    `
}
