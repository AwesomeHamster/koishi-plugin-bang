import { Context, Schema } from 'koishi'

export interface Config {}

export const Config: Schema<Config> = Schema.object({})

export const name = 'koishi-template'

export async function apply(ctx: Context): Promise<void> {
  // ...
}
