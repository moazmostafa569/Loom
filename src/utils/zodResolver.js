// Minimal zod resolver for react-hook-form to avoid external dependency
// Usage: import { zodResolver } from '../utils/zodResolver';
export function zodResolver(schema) {
  return async (values, context, options) => {
    const result = schema.safeParse(values);
    if (result.success) {
      return { values: result.data, errors: {} };
    }

    const zodError = result.error;
    const { fieldErrors } = zodError.flatten();
    const errors = {};

    for (const key of Object.keys(fieldErrors)) {
      const msgs = fieldErrors[key];
      if (msgs && msgs.length) {
        errors[key] = { type: 'validation', message: msgs[0] };
      }
    }

    return { values: {}, errors };
  };
}

export default zodResolver;
