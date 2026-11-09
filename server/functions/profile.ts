import type { Handler } from './types';
import { repository } from '../db/repository';

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json',
};

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  }

  // DELETE: "Delete My Data" - Full DPDP cascading purge
  if (event.httpMethod === 'DELETE') {
    const userId = event.queryStringParameters?.userId;
    if (!userId) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: 'MISSING_USER_ID', message: 'userId query parameter required' }),
      };
    }

    const result = repository.deleteUserData(userId);
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        success: true,
        message: 'All profile records, consents, bargain sessions, transcripts, and trade deals permanently purged.',
        purgedRecords: result.purgedRecords,
        dpdpCompliance: 'Notice, Consent, and Permanent Deletion honored under DPDP principles.',
      }),
    };
  }

  // GET: Retrieve Profile
  if (event.httpMethod === 'GET') {
    const userId = event.queryStringParameters?.userId;
    const profile = repository.getOrCreateProfile(userId);
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({ profile }),
    };
  }

  // POST: Update Profile
  if (event.httpMethod === 'POST') {
    try {
      const payload = JSON.parse(event.body || '{}');
      const { userId, ...updates } = payload;
      const profile = repository.updateProfile(userId, updates);
      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify({ profile }),
      };
    } catch (err) {
      return {
        statusCode: 500,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: 'PROFILE_UPDATE_FAILED', message: (err as Error).message }),
      };
    }
  }

  return { statusCode: 405, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Method not allowed' }) };
};

