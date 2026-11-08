import { z } from 'zod';

export const EvonTraderResponseSchema = z.object({
  offer: z.number().describe('Proposed offer price in Rupees per kg'),
  trick: z
    .enum([
      'quality_nitpick',
      'false_market_drop',
      'fake_scarcity',
      'weight_cut',
      'delayed_payment',
      'friendly_pressure',
      'none',
    ])
    .default('none'),
  mood: z.enum(['idle', 'talking', 'irritated', 'impressed', 'deal']).default('talking'),
  line: z.string().min(2).max(250).describe('Spoken trader line in selected language/Hinglish'),
  farmerEvidence: z.boolean().default(false),
  farmerChallengedTrick: z.boolean().default(false),
  farmerRespectful: z.boolean().default(true),
  dealAccepted: z.boolean().default(false),
});

export type EvonTraderResponse = z.infer<typeof EvonTraderResponseSchema>;

export const EvonCoachResponseSchema = z.object({
  wentWell: z.array(z.string()).min(1).default(['Stood ground initially']),
  missed: z.array(z.string()).min(1).default(['Could have countered the mandi arrival claim earlier']),
  betterLines: z
    .array(
      z.object({
        original: z.string(),
        better: z.string(),
        why: z.string(),
      })
    )
    .min(1)
    .default([]),
  tone: z.string().default('Respectfully firm'),
});

export type EvonCoachResponse = z.infer<typeof EvonCoachResponseSchema>;
