import { z } from 'zod';

export const RestaurantSchema = z.object({
  id: z.number().int().nonnegative(),
  tenantId: z.string(),
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().nullish(),
  isActive: z.boolean()
});

export type RestaurantZ = z.infer<typeof RestaurantSchema>;
