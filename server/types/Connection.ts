import { UserId } from "./User.ts";

export interface Connection{
  connectionId: number;
  offerer: UserId;
  answerer: UserId;
  status: boolean;
}