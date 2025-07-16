// Domain-Specific Loggers for Enhanced Monitoring
import { MonitoringService, LogLevel, LogContext } from '../monitoringService';

// Base logger with common functionality
class BaseLogger {
  constructor(protected context: LogContext) {}

  async debug(message: string, metadata?: Record<string, unknown>) {
    return MonitoringService.logDebug(message, this.context, metadata);
  }

  async info(message: string, metadata?: Record<string, unknown>) {
    return MonitoringService.logEvent({
      event_type: 'info',
      message,
      level: 'info',
      context: this.context,
      metadata
    });
  }

  async warning(message: string, metadata?: Record<string, unknown>) {
    return MonitoringService.logEvent({
      event_type: 'warning',
      message,
      level: 'warning',
      context: this.context,
      metadata
    });
  }

  async error(error: Error, metadata?: Record<string, unknown>) {
    return MonitoringService.reportError(error, this.context, { showToast: false }, metadata);
  }

  async success(message: string, showToast = false, metadata?: Record<string, unknown>) {
    return MonitoringService.logSuccess(message, this.context, showToast, metadata);
  }

  async userAction(action: string, resource?: string, metadata?: Record<string, unknown>) {
    return MonitoringService.logUserAction(action, this.context, resource, metadata);
  }

  async performance(metric: string, value: number, metadata?: Record<string, unknown>) {
    return MonitoringService.logPerformance(metric, value, this.context, metadata);
  }
}

// Authentication Logger
class AuthLogger extends BaseLogger {
  constructor() {
    super('auth');
  }

  async loginStart(email: string) {
    return this.userAction('login_start', 'auth', { email });
  }

  async loginSuccess(userId: string) {
    return this.success('Login successful', false, { userId });
  }

  async loginFailure(error: Error, email: string) {
    return this.error(error, { email, action: 'login' });
  }

  async signupStart(email: string) {
    return this.userAction('signup_start', 'auth', { email });
  }

  async signupSuccess(userId: string) {
    return this.success('Signup successful', false, { userId });
  }

  async signupFailure(error: Error, email: string) {
    return this.error(error, { email, action: 'signup' });
  }

  async passwordResetRequest(email: string) {
    return this.userAction('password_reset_request', 'auth', { email });
  }

  async passwordResetSuccess(email: string) {
    return this.success('Password reset successful', false, { email });
  }

  async signoutSuccess() {
    return this.success('Signout successful', false);
  }

  async sessionValidation(isValid: boolean, userId?: string) {
    return this.info(`Session validation: ${isValid ? 'valid' : 'invalid'}`, { isValid, userId });
  }
}

// Teams Logger
class TeamsLogger extends BaseLogger {
  constructor() {
    super('teams');
  }

  async teamCreated(teamId: string, teamName: string) {
    return this.success('Team created successfully', true, { teamId, teamName });
  }

  async teamJoined(teamId: string, teamName: string, role: string) {
    return this.success('Joined team successfully', true, { teamId, teamName, role });
  }

  async invitationSent(teamId: string, email: string, role: string) {
    return this.userAction('invitation_sent', 'team', { teamId, email, role });
  }

  async invitationAccepted(teamId: string, email: string) {
    return this.success('Invitation accepted', false, { teamId, email });
  }

  async memberRoleChanged(teamId: string, memberId: string, oldRole: string, newRole: string) {
    return this.userAction('member_role_changed', 'team', { teamId, memberId, oldRole, newRole });
  }

  async memberRemoved(teamId: string, memberId: string) {
    return this.userAction('member_removed', 'team', { teamId, memberId });
  }

  async teamDeleted(teamId: string, teamName: string) {
    return this.userAction('team_deleted', 'team', { teamId, teamName });
  }

  async permissionDenied(action: string, requiredRole: string, currentRole: string) {
    return this.warning('Permission denied', { action, requiredRole, currentRole });
  }
}

// Content Logger
class ContentLogger extends BaseLogger {
  constructor() {
    super('content');
  }

  async contentGenerated(contentType: string, contentId: string, tokensUsed?: number) {
    return this.success('Content generated successfully', true, { contentType, contentId, tokensUsed });
  }

  async contentDeleted(contentType: string, contentId: string) {
    return this.userAction('content_deleted', 'content', { contentType, contentId });
  }

  async contentExported(contentType: string, contentId: string, format: string) {
    return this.userAction('content_exported', 'content', { contentType, contentId, format });
  }

  async contentFavorited(contentId: string, favorited: boolean) {
    return this.userAction('content_favorited', 'content', { contentId, favorited });
  }

  async bulkExport(contentCount: number, format: string) {
    return this.userAction('bulk_export', 'content', { contentCount, format });
  }

  async generationError(contentType: string, error: Error) {
    return this.error(error, { contentType, action: 'generation' });
  }

  async templateUsed(templateId: string, templateName: string) {
    return this.userAction('template_used', 'content', { templateId, templateName });
  }
}

// Admin Logger
class AdminLogger extends BaseLogger {
  constructor() {
    super('admin');
  }

  async adminActionStart(action: string, targetId?: string) {
    return this.userAction('admin_action_start', 'admin', { action, targetId });
  }

  async adminActionSuccess(action: string, targetId?: string) {
    return this.success('Admin action completed', false, { action, targetId });
  }

  async adminActionFailure(action: string, error: Error, targetId?: string) {
    return this.error(error, { action, targetId });
  }

  async userRoleChanged(targetUserId: string, oldRole: string, newRole: string) {
    return this.userAction('user_role_changed', 'admin', { targetUserId, oldRole, newRole });
  }

  async planUpgraded(userId: string, oldPlan: string, newPlan: string) {
    return this.userAction('plan_upgraded', 'admin', { userId, oldPlan, newPlan });
  }

  async creditsReset(userId: string, oldCredits: number, newCredits: number) {
    return this.userAction('credits_reset', 'admin', { userId, oldCredits, newCredits });
  }

  async securityEvent(event: string, details: Record<string, unknown>) {
    return this.warning('Security event detected', { event, ...details });
  }
}

// Performance Logger
class PerformanceLogger extends BaseLogger {
  constructor() {
    super('performance');
  }

  async pageLoad(pageName: string, loadTime: number) {
    return this.performance('page_load', loadTime, { pageName });
  }

  async apiCall(endpoint: string, duration: number, success: boolean) {
    return this.performance('api_call', duration, { endpoint, success });
  }

  async componentRender(componentName: string, renderTime: number) {
    return this.performance('component_render', renderTime, { componentName });
  }

  async databaseQuery(query: string, duration: number) {
    return this.performance('database_query', duration, { query });
  }

  async userInteraction(interaction: string, responseTime: number) {
    return this.performance('user_interaction', responseTime, { interaction });
  }
}

// Export singleton instances
export const authLogger = new AuthLogger();
export const teamsLogger = new TeamsLogger();
export const contentLogger = new ContentLogger();
export const adminLogger = new AdminLogger();
export const performanceLogger = new PerformanceLogger();

// Export classes for custom instances if needed
export { AuthLogger, TeamsLogger, ContentLogger, AdminLogger, PerformanceLogger };