// Sumber kebenaran kunci pesan API. Locale lain wajib memiliki kunci yang sama (dicek oleh tipe).
export const en = {
  "common.ok": "OK",

  "error.bad_request": "Bad request",
  "error.invalid_json": "Request body must be valid JSON",
  "error.validation_failed": "Invalid data",
  "error.unauthorized": "Unauthorized",
  "error.forbidden": "Forbidden",
  "error.not_found": "Resource not found",
  "error.conflict": "Conflict",
  "error.already_exists": "Resource already exists",
  "error.locked": "Locked",
  "error.too_many_requests": "Too many requests, please try again in {retryAfterSeconds} seconds",
  "error.internal": "Internal server error",
  "error.unavailable": "Service temporarily unavailable",
  "error.origin_mismatch": "Cross-origin request rejected",

  "validation.date": "Use the date format YYYY-MM-DD",

  "health.ok": "Service is healthy",
  "health.db_unavailable": "Database is unavailable",

  "auth.authentication_required": "Authentication required",
  "auth.invalid_credentials": "Invalid email or password",
  "auth.account_locked": "Account is temporarily locked. Try again in {minutes} minutes",
  "auth.password_change_required": "You must change your password before continuing",
  "auth.login_success": "Logged in",
  "auth.logout_success": "Logged out",
  "auth.session_active": "Active session",
  "auth.session_refreshed": "Session refreshed",
  "auth.password_changed": "Password changed",
  "auth.current_password_incorrect": "Current password is incorrect",
  "auth.password_reused": "New password must be different from the current password",
  "auth.admin_required": "Only admins can do this",

  "me.profile": "Profile",
  "me.updated": "Profile updated",

  "users.list": "Users",
  "users.created": "User account created",
  "users.updated": "User updated",
  "users.password_reset": "Password reset; every session of this user was signed out",
  "users.not_found": "User not found",
  "users.email_taken": "This email is already registered",
  "users.cannot_modify_self": "You cannot change your own role, status, or password here",
  "users.last_admin": "At least one active admin must remain",
} as const;

export type MessageKey = keyof typeof en;
