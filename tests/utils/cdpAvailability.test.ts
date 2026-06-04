import { isCdpPortResponding } from '../../src/utils/cdpAvailability';
import * as http from 'http';

describe('cdpAvailability', () => {
    let server: http.Server;
    let port: number;

    beforeAll((done) => {
        server = http.createServer((_req, res) => {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify([{ type: 'page', title: 'Test' }]));
        });
        server.listen(0, '127.0.0.1', () => {
            const addr = server.address();
            port = typeof addr === 'object' && addr ? addr.port : 0;
            done();
        });
    });

    afterAll((done) => {
        server.close(done);
    });

    it('isCdpPortResponding returns true for a live CDP port', async () => {
        expect(await isCdpPortResponding(port)).toBe(true);
    });

    it('isCdpPortResponding returns false for a closed port', async () => {
        expect(await isCdpPortResponding(1)).toBe(false);
    });
});
