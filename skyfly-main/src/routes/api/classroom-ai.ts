import { createFileRoute } from "@tanstack/react-router";
import { askClassroomAI } from "@/lib/classroom-ai.server";

export const Route = createFileRoute("/api/classroom-ai")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as {
            question?: string;
            language?: "en" | "hi";
            clientId?: string;
          };

          const question = (body?.question || "").trim();
          if (!question) {
            return new Response(
              JSON.stringify({ success: false, error: "Question is required." }),
              { status: 400, headers: { "Content-Type": "application/json" } }
            );
          }

          // Extract client identifier for sliding window rate limiting
          const clientIp =
            request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
            request.headers.get("x-real-ip") ||
            body.clientId ||
            "anonymous-student";

          const lang = body.language === "hi" ? "hi" : "en";
          const result = await askClassroomAI(question, lang, clientIp);

          const statusCode = result.success ? 200 : 200; // Return 200 with structured pacing response so frontend renders polite teacher pause

          return new Response(JSON.stringify(result), {
            status: statusCode,
            headers: {
              "Content-Type": "application/json",
              "Cache-Control": "public, max-age=30",
            },
          });
        } catch (err: any) {
          console.error("[/api/classroom-ai] Error:", err);
          return new Response(
            JSON.stringify({
              success: false,
              error: err?.message || "Internal server error occurred.",
            }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }
      },
    },
  },
});
