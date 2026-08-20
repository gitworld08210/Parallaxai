import type { FieldErrors, FieldValues, ResolverResult } from "react-hook-form";
import type { z } from "zod";

/**
 * Custom zodResolver compatible with Zod v4.
 * The official @hookform/resolvers zodResolver expects ZodError.errors (v3),
 * but Zod v4 uses ZodError.issues instead.
 *
 * This resolver builds a nested FieldErrors structure that react-hook-form
 * expects for both flat and nested object schemas.
 */
export function zodResolver<T extends z.ZodType>(schema: T) {
  return async (values: FieldValues): Promise<ResolverResult<z.infer<T>>> => {
    const result = schema.safeParse(values);

    if (result.success) {
      return { values: result.data, errors: {} };
    }

    const fieldErrors: FieldErrors = {};
    for (const issue of result.error.issues) {
      const path = issue.path;

      if (path.length === 0) {
        // Root-level error - assign to root
        if (!fieldErrors.root) {
          fieldErrors.root = {
            type: issue.code,
            message: issue.message,
          };
        }
        continue;
      }

      // Build nested structure for react-hook-form
      // e.g., path ["address", "city"] -> errors.address.city = { type, message }
      let current: Record<string, any> = fieldErrors;
      for (let i = 0; i < path.length; i++) {
        const key = String(path[i]);
        if (i === path.length - 1) {
          // Leaf - assign the error if not already set (first error wins)
          if (!current[key]) {
            current[key] = {
              type: issue.code,
              message: issue.message,
            };
          }
        } else {
          // Intermediate path segment - ensure nested object exists
          if (!current[key]) {
            current[key] = {};
          }
          current = current[key];
        }
      }
    }

    return { values: {}, errors: fieldErrors };
  };
}
