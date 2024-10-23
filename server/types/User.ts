import type { UUID } from "node:crypto";

export type UserId = UUID;

export interface User{
  userId: UserId,
  socket: WebSocket
}