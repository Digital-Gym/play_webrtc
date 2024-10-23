export type Level = 'A2' | 'B1' | 'B2' | 'C1';

export interface SearchFilter{
  level: Level,
  ageStart: number,
  ageFinish: number
}