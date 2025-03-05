// Mock crypto.randomUUID
global.crypto = {
  ...global.crypto,
  randomUUID: () => '123e4567-e89b-12d3-a456-426614174000'
};