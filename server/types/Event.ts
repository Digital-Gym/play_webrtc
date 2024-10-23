import type { UUID } from "node:crypto";
import { SearchFilter } from "./Filter.ts";

export type EventType = 
'set-id' |
'users-count' |
'search-peer' |
'search-process' | 
'make-offer' |
'offer' |
'answer' |
'ice-candidate' |
'peer-connection';

export interface Event{
  type: EventType;
}

// server -> client
export interface SetId extends Event{
  type: 'set-id';
  id: UUID;
}

// server -> client
export interface UsersCount extends Event{
  type: 'users-count';
  waiting: number;
  talking: number;
}

// client -> server
export interface  SearchPeer extends Event{
  type: 'search-peer';
  userId: UUID;
  filter: SearchFilter;
}

// server -> client
export interface SearchProcess extends Event{
  type: 'search-process';
  success: boolean;
}

// server -> client
export interface MakeOffer extends Event{
  type: 'make-offer';
  connectionId: number;
}

// client1 <- server -> client2
export interface Offer extends Event{
  type: "offer";
  connectionId: number;
  offer: string;
}

// client2 <- server -> client1
export interface Answer extends Event{
  type: "answer";
  connectionId: number;
  answer: string;
}

// client <- server -> client
export interface IceCandidate extends Event{
  type: "ice-candidate";
  from: "offer" | "answer";
  connectionId: number;
  candidate: string;
}

export interface PeerConnection extends Event{
  type: 'peer-connection';
  connectionId: number;
  status: boolean;
}
