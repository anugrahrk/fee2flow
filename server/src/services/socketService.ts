import { Server as SocketIOServer } from 'socket.io';
import { Server } from 'http';

let io: SocketIOServer;

export const initSocket = (server: Server) => {
    io = new SocketIOServer(server, {
        cors: {
            origin: "*", // Allow all for dev
            methods: ["GET", "POST"]
        }
    });

    io.on('connection', (socket) => {
        console.log(`Socket connected: ${socket.id}`);

        socket.on('join_org', (orgId: string) => {
            socket.join(`org_${orgId}`);
            console.log(`Socket ${socket.id} joined room org_${orgId}`);
        });

        socket.on('disconnect', () => {
            console.log(`Socket disconnected: ${socket.id}`);
        });
    });

    return io;
};

export const emitPaymentSuccess = (orgId: string, notification: any) => {
    if (io) {
        io.to(`org_${orgId}`).emit('payment_success', notification);
    }
};
