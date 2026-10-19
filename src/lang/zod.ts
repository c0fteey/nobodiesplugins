import { z } from "zod";

// Turkish default messages for every schema (too short, invalid email, wrong type…).
// Imported by the schema modules so it applies on both the client and the server.
z.config(z.locales.tr());
