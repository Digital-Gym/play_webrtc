import { Event } from "../types/Event.ts";

export function jsend(obj: object): string{
  return JSON.stringify(obj);
}

export function jget(str: string): Event{
  return JSON.parse(str) as Event;
}
