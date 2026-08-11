// Inline, per-field validation message shown directly beneath an input. Render
// it under any field and pass the input's aria-describedby the same id so the
// error is announced. Renders nothing when there's no message.
export function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="text-sm text-destructive">
      {message}
    </p>
  );
}
