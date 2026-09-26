export function FieldError({
  name,
  message,
}: {
  name: string;
  message?: string;
}) {
  return message ? (
    <p id={`${name}-error`} role="alert" className="mt-2 text-sm text-red-600">
      {message}
    </p>
  ) : null;
}
