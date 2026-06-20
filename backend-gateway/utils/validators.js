/**
 * Shared validation utilities for the Credixa backend gateway.
 *
 * Centralising regex patterns here ensures every route uses the same
 * definition and makes future changes (e.g. adding v5 UUIDs) a one-line fix.
 */

/**
 * Matches a standard RFC 4122 UUID (versions 1–5).
 * All primary keys in this project are uuid_generate_v4() (v4).
 * @example
 *   UUID_REGEX.test("550e8400-e29b-41d4-a716-446655440000") // true
 *   UUID_REGEX.test("some-arbitrary-string")                 // false
 */
export const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Returns true if the given string is a valid UUID.
 * @param {string} id
 * @returns {boolean}
 */
export const isValidUUID = (id) => UUID_REGEX.test(id);
