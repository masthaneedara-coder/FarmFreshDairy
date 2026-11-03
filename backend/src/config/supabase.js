
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !anonKey) {
  throw new Error("Missing Supabase URL or ANON KEY");
}

// Diagnostic fetch: identifies which Supabase endpoint fails.
const diagnosticFetch = async (input, init) => {
  const requestUrl =
    input instanceof Request ? input.url : String(input);

  const safeUrl = requestUrl.split("?")[0];

  try {
    const response = await fetch(input, init);

    console.log(
      `[SUPABASE HTTP] ${response.status} ${safeUrl}`
    );

    return response;
  } catch (error) {
    console.error("[SUPABASE FETCH FAILED]", safeUrl);
    console.error("Error:", error);
    console.error("Cause:", error?.cause);

    throw error;
  }
};

// Public client
export const supabase = createClient(
  supabaseUrl,
  anonKey,
  {
    global: {
      fetch: diagnosticFetch,
    },
  }
);

// Admin client
export const supabaseAdmin = serviceRoleKey
  ? createClient(
      supabaseUrl,
      serviceRoleKey,
      {
        global: {
          fetch: diagnosticFetch,
        },
      }
    )
  : null;
