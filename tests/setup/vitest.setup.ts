import "dotenv/config";

// Safety-net for CI: if a test accidentally imports the real auth module
// without mocking it, provide a dummy secret so the file can load.
// Unit tests never invoke auth methods, so this is harmless.
if (!process.env.BETTER_AUTH_SECRET) {
  process.env.BETTER_AUTH_SECRET =
    "dummy-secret-must-be-at-least-32-characters-long";
}
