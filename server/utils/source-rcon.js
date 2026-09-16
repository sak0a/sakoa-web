import { createConnection } from 'node:net';

export function rconPacket(id, type, body = '') {
  const text = Buffer.from(body, 'utf8');
  const packet = Buffer.alloc(text.length + 14);
  packet.writeInt32LE(text.length + 10, 0);
  packet.writeInt32LE(id, 4);
  packet.writeInt32LE(type, 8);
  text.copy(packet, 12);
  return packet;
}

// Source RCON end-of-response probe handles split packets without a timing guess.
export function sourceRcon({ ip, port, rcon }, command, timeout = 6000) {
  if (!rcon) return Promise.reject(new Error('RCON is not configured for this server'));
  if (Buffer.byteLength(command) > 3500 || command.includes('\0')) return Promise.reject(new Error('Invalid RCON command'));
  return new Promise((resolve, reject) => {
    const socket = createConnection({ host: ip, port: Number(port) });
    let buffer = Buffer.alloc(0), authenticated = false, done = false, output = '';
    const timer = setTimeout(() => finish(new Error('RCON timed out; command delivery may be unknown')), timeout);
    function finish(error) {
      if (done) return;
      done = true;
      clearTimeout(timer);
      socket.destroy();
      if (error) reject(error); else resolve(output);
    }
    socket.on('error', () => finish(new Error('Could not connect to the game server')));
    socket.on('close', () => { if (!done) finish(new Error('RCON disconnected before confirming the response')); });
    socket.on('connect', () => socket.write(rconPacket(1, 3, rcon)));
    socket.on('data', chunk => {
      buffer = Buffer.concat([buffer, chunk]);
      while (buffer.length >= 4) {
        const size = buffer.readInt32LE(0);
        if (size < 10 || size > 4096) return finish(new Error('Invalid RCON response'));
        if (buffer.length < size + 4) return;
        const id = buffer.readInt32LE(4), type = buffer.readInt32LE(8);
        const body = buffer.subarray(12, size + 2).toString('utf8');
        buffer = buffer.subarray(size + 4);
        if (id === -1) return finish(new Error('RCON authentication failed'));
        if (!authenticated && id === 1 && type === 2) {
          authenticated = true;
          socket.write(Buffer.concat([rconPacket(2, 2, command), rconPacket(3, 0)]));
        } else if (authenticated && id === 2) {
          output += body;
          if (output.length > 512000) return finish(new Error('RCON response is too large'));
        } else if (authenticated && id === 3) return finish();
      }
    });
  });
}
