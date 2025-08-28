import { getRedisClient } from '@/config/redis';
import { logger } from '@/utils/logger';
import { Server, Socket } from 'socket.io';

export function socketHandler(io: Server): void {
  io.on('connection', (socket: Socket) => {
    logger.info('Client connected', { socketId: socket.id });

    socket.on('join-room', async (roomId: string) => {
      try {
        socket.join(roomId);
        logger.info('Client joined room', { socketId: socket.id, roomId });

        // Store user in Redis
        const redis = getRedisClient();
        await redis.sadd(`room:${roomId}:users`, socket.id);

        socket.emit('room-joined', { roomId });
      } catch (error) {
        logger.error('Error joining room', {
          error,
          socketId: socket.id,
          roomId,
        });
        socket.emit('error', { message: 'Failed to join room' });
      }
    });

    socket.on('leave-room', async (roomId: string) => {
      try {
        socket.leave(roomId);
        logger.info('Client left room', { socketId: socket.id, roomId });

        // Remove user from Redis
        const redis = getRedisClient();
        await redis.srem(`room:${roomId}:users`, socket.id);

        socket.emit('room-left', { roomId });
      } catch (error) {
        logger.error('Error leaving room', {
          error,
          socketId: socket.id,
          roomId,
        });
        socket.emit('error', { message: 'Failed to leave room' });
      }
    });

    socket.on(
      'send-message',
      async (data: {
        roomId: string;
        content: string;
        userId: string;
        username: string;
      }) => {
        try {
          const { roomId, content, userId, username } = data;

          const messageData = {
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            content,
            userId,
            username,
            roomId,
            timestamp: new Date().toISOString(),
          };

          // Store message in Redis
          const redis = getRedisClient();
          const messageKey = `room:${roomId}:messages`;
          await redis.lpush(messageKey, JSON.stringify(messageData));
          await redis.ltrim(messageKey, 0, 99); // Keep only last 100 messages

          // Broadcast to room
          io.to(roomId).emit('new-message', messageData);

          logger.info('Message sent', {
            roomId,
            userId,
            messageId: messageData.id,
          });
        } catch (error) {
          logger.error('Error sending message', { error, socketId: socket.id });
          socket.emit('error', { message: 'Failed to send message' });
        }
      }
    );

    socket.on('disconnect', async () => {
      try {
        logger.info('Client disconnected', { socketId: socket.id });

        // Remove user from all rooms in Redis
        const redis = getRedisClient();
        const rooms = await redis.keys('room:*:users');

        for (const roomKey of rooms) {
          await redis.srem(roomKey, socket.id);
        }
      } catch (error) {
        logger.error('Error handling disconnect', {
          error,
          socketId: socket.id,
        });
      }
    });
  });
}
