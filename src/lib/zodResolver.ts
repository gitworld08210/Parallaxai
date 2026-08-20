import type { FieldErrors, FieldValues, ResolverResult } from "react-hook-form";
import type { z } from "zod";

/**
 * Custom zodResolver compatible with Zod v4.
 * The official @hookform/resolvers zodResolver expects ZodError.errors (v3),
 * but Zod v4 uses ZodError.issues instead.
 */
export function zodResolver<T extends z.ZodType>(schema: T) {
  return async (values: FieldValues): Promise<ResolverResult<z.infer<T>>> => {
    const result = schema.safeParse(values);

    if (result.success) {
      return { values: result.data, errors: {} };
    }

    const fieldErrors: FieldErrors = {};
    for (const issue of result.error.issues) {
      const path = issue.path.join(".");
      if (!fieldErrors[path]) {
        fieldErrors[path] = {
          type: issue.code,
          message: issue.message,
        };
      }
    }

    return { values: {}, errors: fieldErrors };
  };
}
