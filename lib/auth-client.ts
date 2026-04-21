import { createAuthClient } from "better-auth/react";
import {
  inferAdditionalFields,
  magicLinkClient,
} from "better-auth/client/plugins";
import { passkeyClient } from "@better-auth/passkey/client";

import { getAuthApiBaseUrl } from "@/lib/env/public-url";

export const authClient = createAuthClient({
  baseURL: getAuthApiBaseUrl(),
  plugins: [
    inferAdditionalFields({
      user: {
        role: { type: "string", required: false, input: false },
      },
    }),
    passkeyClient(),
    magicLinkClient(),
  ],
});
