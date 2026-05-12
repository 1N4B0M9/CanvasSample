/**
 * @typedef {'financial_security'|'social_belonging'|'job_skills_education'|
 *   'family_caregiving'|'physical_health'|'mental_health'|
 *   'supporting_loved_ones'|'community_support'} Domain
 */

/**
 * @typedef {'professional_license_reinstatement'|'vocational_training'|
 *   'employment_search'|'sobriety_recovery'|'mental_health_counseling'|
 *   'housing_stability'|'financial_literacy'|'family_reunification'|
 *   'childcare_support'|'legal_aid'|'education_ged_college'|'peer_support'} GoalType
 */

/**
 * @typedef {Object} PathwayStep
 * @property {number} order
 * @property {string} title
 * @property {string} detail
 * @property {string} actionLabel
 * @property {string} [url]
 */

/**
 * @typedef {Object} Resource
 * @property {string} id
 * @property {string} name
 * @property {string} description
 * @property {Domain[]} domains
 * @property {GoalType[]} goalTypes
 * @property {{ phone?: string, url?: string, address?: string, hours?: string }} contact
 * @property {string} [logoUrl]
 * @property {PathwayStep[]} pathwaySteps
 * @property {string[]} tags
 * @property {'workshop'|'211pa'} source
 * @property {boolean} active
 */

export const DOMAINS = [
  'financial_security',
  'social_belonging',
  'job_skills_education',
  'family_caregiving',
  'physical_health',
  'mental_health',
  'supporting_loved_ones',
  'community_support',
];

export const GOAL_TYPES = [
  'professional_license_reinstatement',
  'vocational_training',
  'employment_search',
  'sobriety_recovery',
  'mental_health_counseling',
  'housing_stability',
  'financial_literacy',
  'family_reunification',
  'childcare_support',
  'legal_aid',
  'education_ged_college',
  'peer_support',
];
