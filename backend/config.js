/**
 * Backend configuration
 * Values are controlled via environment variables.
 * Safe defaults are provided for local development.
 */

const CORS_ORIGIN = process.env.CORS_ORIGIN || "*";

module.exports = {
  CORS_ORIGIN
};
