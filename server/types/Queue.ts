import { Level } from "./Filter.ts";
import type { UserId } from "./User.ts";
import { SearchFilter } from "./Filter.ts";

export interface QueueMember{
  userId: UserId;
  filter: SearchFilter;
} 

export type Queue = Record<Level, QueueMember[]>;
