/**
 * Unit tests for change request summary generator
 */

import { describe, it, expect } from 'vitest';
import { summarizeChangeRequest } from './change-request-summary';
import type { ChangeRequest } from '@/lib/api/admin';

// Helper to create a mock change request
function mockChangeRequest(
  resourceType: string,
  action: string,
  requestBody: Record<string, unknown>
): ChangeRequest {
  return {
    id: 'test-id',
    resourceType,
    action,
    httpMethod: 'POST',
    resourcePath: '/test',
    pathParams: null,
    requestBody: JSON.stringify(requestBody),
    hasFile: false,
    proposedByEmail: 'test@example.com',
    proposedByRoles: 'ADMIN',
    financial: false,
    status: 'PENDING',
    reviewedByEmail: null,
    reviewedAt: null,
    approvalNote: null,
    rejectionReason: null,
    resultSummary: null,
    createdAt: new Date().toISOString(),
  };
}

describe('summarizeChangeRequest', () => {
  describe('trivia questions', () => {
    it('should summarize trivia question creation with full text', () => {
      const request = mockChangeRequest('triviaQuestion', 'CREATE', {
        questionText: 'Who directed The Dark Knight?',
        correctOption: 'A',
      });
      
      expect(summarizeChangeRequest(request)).toBe(
        'Create Trivia Question: "Who directed The Dark Knight?"'
      );
    });

    it('should truncate long question text', () => {
      const longQuestion = 'A'.repeat(60);
      const request = mockChangeRequest('triviaQuestion', 'CREATE', {
        questionText: longQuestion,
      });
      
      const summary = summarizeChangeRequest(request);
      expect(summary).toContain('...');
      expect(summary.length).toBeLessThan(100);
    });

    it('should handle trivia question without text', () => {
      const request = mockChangeRequest('triviaQuestion', 'CREATE', {
        correctOption: 'A',
      });
      
      expect(summarizeChangeRequest(request)).toBe('Create Trivia Question');
    });
  });

  describe('trivia categories', () => {
    it('should summarize category creation', () => {
      const request = mockChangeRequest('triviaCategory', 'CREATE', {
        name: 'Nollywood Classics',
        active: true,
      });
      
      expect(summarizeChangeRequest(request)).toBe(
        'Create Trivia Category: Nollywood Classics'
      );
    });

    it('should summarize category update', () => {
      const request = mockChangeRequest('triviaCategory', 'UPDATE', {
        name: 'Modern Cinema',
      });
      
      expect(summarizeChangeRequest(request)).toBe(
        'Update Trivia Category: Modern Cinema'
      );
    });
  });

  describe('trivia stages', () => {
    it('should summarize stage creation', () => {
      const request = mockChangeRequest('triviaStage', 'CREATE', {
        name: 'Beginner',
        sortOrder: 1,
        difficultyLabel: 'Easy',
      });
      
      expect(summarizeChangeRequest(request)).toBe(
        'Create Trivia Stage: Beginner'
      );
    });
  });

  describe('trivia prizes', () => {
    it('should summarize prize with stage and description', () => {
      const request = mockChangeRequest('triviaPrize', 'CREATE', {
        stageName: 'Expert',
        period: 'MONTHLY',
        description: 'Top performer prize',
      });
      
      expect(summarizeChangeRequest(request)).toBe(
        'Create Trivia Prize: Expert - Top performer prize'
      );
    });

    it('should summarize prize with stage only', () => {
      const request = mockChangeRequest('triviaPrize', 'CREATE', {
        stageName: 'Beginner',
      });
      
      expect(summarizeChangeRequest(request)).toBe(
        'Create Trivia Prize: Beginner'
      );
    });
  });

  describe('subscription packages', () => {
    it('should summarize package with name and fee', () => {
      const request = mockChangeRequest('subscriptionPackage', 'CREATE', {
        name: 'Daily Plan',
        fee: 500,
        durationDays: 1,
      });
      
      expect(summarizeChangeRequest(request)).toBe(
        'Create Subscription Package: Daily Plan (₦500)'
      );
    });

    it('should format large fees with commas', () => {
      const request = mockChangeRequest('package', 'UPDATE', {
        name: 'Monthly Plan',
        fee: 5000,
      });
      
      expect(summarizeChangeRequest(request)).toBe(
        'Update Package: Monthly Plan (₦5,000)'
      );
    });

    it('should handle package without fee', () => {
      const request = mockChangeRequest('subscriptionPackage', 'CREATE', {
        name: 'Weekly Plan',
      });
      
      expect(summarizeChangeRequest(request)).toBe(
        'Create Subscription Package: Weekly Plan'
      );
    });
  });

  describe('token exchange rate', () => {
    it('should summarize rate in naira per token', () => {
      const request = mockChangeRequest('tokenExchangeRate', 'UPDATE', {
        koboPerToken: 100,
      });
      
      expect(summarizeChangeRequest(request)).toBe(
        'Update Token Exchange Rate: ₦1.00 per token'
      );
    });

    it('should format fractional rates', () => {
      const request = mockChangeRequest('tokenExchangeRate', 'UPDATE', {
        koboPerToken: 151,
      });
      
      expect(summarizeChangeRequest(request)).toBe(
        'Update Token Exchange Rate: ₦1.51 per token'
      );
    });
  });

  describe('game settings', () => {
    it('should summarize time per question setting', () => {
      const request = mockChangeRequest('gameSetting', 'UPDATE', {
        timePerQuestionSeconds: 30,
      });
      
      expect(summarizeChangeRequest(request)).toBe(
        'Update Game Setting: 30s per question'
      );
    });
  });

  describe('generic resources', () => {
    it('should use generic name field as fallback', () => {
      const request = mockChangeRequest('customResource', 'CREATE', {
        name: 'Custom Item',
        otherField: 'value',
      });
      
      expect(summarizeChangeRequest(request)).toBe(
        'Create Custom Resource: Custom Item'
      );
    });

    it('should use title field as fallback', () => {
      const request = mockChangeRequest('article', 'CREATE', {
        title: 'Important Article',
      });
      
      expect(summarizeChangeRequest(request)).toBe(
        'Create Article: Important Article'
      );
    });

    it('should handle unknown resource without identifying fields', () => {
      const request = mockChangeRequest('unknownResource', 'DELETE', {
        id: 'some-id',
      });
      
      expect(summarizeChangeRequest(request)).toBe('Delete Unknown Resource');
    });
  });

  describe('action humanization', () => {
    it('should handle all action types', () => {
      const actions = ['CREATE', 'UPDATE', 'DELETE', 'CLOSE', 'APPROVE'];
      const expected = ['Create', 'Update', 'Delete', 'Close', 'Approve'];
      
      actions.forEach((action, i) => {
        const request = mockChangeRequest('test', action, {});
        expect(summarizeChangeRequest(request)).toContain(expected[i]);
      });
    });

    it('should handle lowercase actions', () => {
      const request = mockChangeRequest('test', 'custom', {});
      expect(summarizeChangeRequest(request)).toContain('Custom');
    });
  });

  describe('resource type humanization', () => {
    it('should convert camelCase to Title Case', () => {
      const request = mockChangeRequest('triviaQuestion', 'CREATE', {});
      expect(summarizeChangeRequest(request)).toContain('Trivia Question');
    });

    it('should handle single-word resources', () => {
      const request = mockChangeRequest('user', 'CREATE', {});
      expect(summarizeChangeRequest(request)).toContain('User');
    });

    it('should handle multi-word camelCase', () => {
      const request = mockChangeRequest('subscriptionPackagePricing', 'UPDATE', {});
      expect(summarizeChangeRequest(request)).toContain('Subscription Package Pricing');
    });
  });

  describe('malformed input', () => {
    it('should handle invalid JSON in requestBody', () => {
      const request: ChangeRequest = {
        id: 'test-id',
        resourceType: 'test',
        action: 'CREATE',
        httpMethod: 'POST',
        resourcePath: '/test',
        pathParams: null,
        requestBody: 'not valid json{',
        hasFile: false,
        proposedByEmail: 'test@example.com',
        proposedByRoles: 'ADMIN',
        financial: false,
        status: 'PENDING',
        reviewedByEmail: null,
        reviewedAt: null,
        approvalNote: null,
        rejectionReason: null,
        resultSummary: null,
        createdAt: new Date().toISOString(),
      };
      
      expect(summarizeChangeRequest(request)).toBe('Create Test');
    });

    it('should handle empty requestBody', () => {
      const request: ChangeRequest = {
        ...mockChangeRequest('test', 'CREATE', {}),
        requestBody: '',
      };
      
      expect(summarizeChangeRequest(request)).toBe('Create Test');
    });
  });
});
