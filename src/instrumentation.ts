import type { Instrumentation } from "next";

// Kutilmagan server xatolari (sahifa, API, server action) bitta JSON qatorda logga yoziladi:
// `./deploy/dc logs app | grep '"level":"error"'`. So'rov tanasi, query va cookie yozilmaydi
// (ularda shaxsiy ma'lumot bo'lishi mumkin).
export const onRequestError: Instrumentation.onRequestError = (
  error,
  request,
  context,
) => {
  const err = error as Error & { digest?: string };
  console.error(
    JSON.stringify({
      level: "error",
      time: new Date().toISOString(),
      method: request.method,
      path: request.path.split("?")[0],
      route: context.routePath,
      type: context.routeType,
      message: err.message,
      digest: err.digest,
    }),
  );
};
