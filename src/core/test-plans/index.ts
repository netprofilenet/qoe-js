/**
 * Test Plans - Pre-built test configurations
 *
 * Export all available test plans:
 * - Quality Mode (Cloudflare-style)
 * - Speed Mode (Ookla-style)
 * - Application Mode (5 test types)
 */

export { qualityModePlan } from './quality';
export { speedModePlan } from './speed';
export {
  streamingTestPlan,
  gamingTestPlan,
  conferenceTestPlan,
  voipTestPlan,
  browsingTestPlan
} from './application';
