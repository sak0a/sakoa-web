import { createServer } from 'node:net';
import { afterEach, describe, expect, it } from 'vitest';
import { sourceRcon, rconPacket } from './source-rcon.js';

const servers = [];
afterEach(async () => { for (const server of servers.splice(0)) await new Promise(resolve => server.close(resolve)); });
async function fakeServer(handler) {
  const server = createServer(socket => {
    let buffer = Buffer.alloc(0);
    socket.on('data', chunk => {
      buffer = Buffer.concat([buffer, chunk]);
      while (buffer.length >= 4 && buffer.length >= buffer.readInt32LE(0) + 4) {
        const size = buffer.readInt32LE(0), id = buffer.readInt32LE(4), type = buffer.readInt32LE(8);
        const body = buffer.subarray(12, size + 2).toString();
        buffer = buffer.subarray(size + 4);
        handler(socket, { id, type, body });
      }
    });
  });
  servers.push(server);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  return { ip: '127.0.0.1', port: server.address().port, rcon: 'test-secret' };
}
describe('Source RCON transport', () => {
  it('authenticates, joins split responses, and terminates using a response probe', async () => {
    const settings = await fakeServer((socket, packet) => {
      if (packet.type === 3) { expect(packet.body).toBe('test-secret'); socket.write(rconPacket(1, 0)); socket.write(rconPacket(1, 2)); }
      if (packet.id === 2) { const response = Buffer.concat([rconPacket(2, 0, 'first\n'), rconPacket(2, 0, 'second')]); socket.write(response.subarray(0, 7)); socket.write(response.subarray(7)); }
      if (packet.id === 3) socket.write(rconPacket(3, 0));
    });
    expect(await sourceRcon(settings, 'status')).toBe('first\nsecond');
  });
  it('fails closed on rejected authentication', async () => {
    const settings = await fakeServer(socket => socket.write(rconPacket(-1, 2)));
    await expect(sourceRcon(settings, 'status')).rejects.toThrow('authentication failed');
  });
  it('does not claim success when response is incomplete', async () => {
    const settings = await fakeServer(() => {});
    await expect(sourceRcon(settings, 'status', 40)).rejects.toThrow('timed out');
  });
});
