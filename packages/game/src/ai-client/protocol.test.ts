import { describe, it, expect } from 'vitest';
import { isAIResponse, type AIRequest, type AIResponse } from './protocol';

describe('AI protocol', () => {
  it('AIRequest has {id, fen, millis}', () => {
    const req: AIRequest = { id: 1, fen: 'rnb w - - 0 1', millis: 1000 };
    expect(req.id).toBe(1);
  });

  it('isAIResponse accepts {id, mv}', () => {
    const resp: AIResponse = { id: 1, mv: 0x1234 };
    expect(isAIResponse(resp)).toBe(true);
  });

  it('isAIResponse accepts {id, error}', () => {
    expect(isAIResponse({ id: 1, error: 'boom' })).toBe(true);
  });

  it('isAIResponse rejects missing id', () => {
    expect(isAIResponse({ mv: 1 })).toBe(false);
    expect(isAIResponse({})).toBe(false);
    expect(isAIResponse(null)).toBe(false);
  });
});
