import { envSchema } from "../validation/env-schema";

export const envs = envSchema.parse(process.env);
