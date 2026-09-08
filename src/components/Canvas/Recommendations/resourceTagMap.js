// Static keyword → { goalType, domain } mapping for client-side goal detection.
// All keys are lowercase. Longer phrases are matched before shorter ones via includes().

const TAG_MAP = {
  // professional_license_reinstatement
  'nursing degree':   { goalType: 'professional_license_reinstatement', domain: 'job_skills_education' },
  'nursing license':  { goalType: 'professional_license_reinstatement', domain: 'job_skills_education' },
  'get my nursing':   { goalType: 'professional_license_reinstatement', domain: 'job_skills_education' },
  'become a nurse':   { goalType: 'professional_license_reinstatement', domain: 'job_skills_education' },
  'board of nursing': { goalType: 'professional_license_reinstatement', domain: 'job_skills_education' },
  'professional license': { goalType: 'professional_license_reinstatement', domain: 'job_skills_education' },
  reinstatement: { goalType: 'professional_license_reinstatement', domain: 'job_skills_education' },
  reinstate:    { goalType: 'professional_license_reinstatement', domain: 'job_skills_education' },
  cosmetologist:{ goalType: 'professional_license_reinstatement', domain: 'job_skills_education' },
  cosmetology:  { goalType: 'professional_license_reinstatement', domain: 'job_skills_education' },
  revoked:      { goalType: 'professional_license_reinstatement', domain: 'job_skills_education' },
  nursing:      { goalType: 'professional_license_reinstatement', domain: 'job_skills_education' },
  nurse:        { goalType: 'professional_license_reinstatement', domain: 'job_skills_education' },
  license:      { goalType: 'professional_license_reinstatement', domain: 'job_skills_education' },
  licensed:     { goalType: 'professional_license_reinstatement', domain: 'job_skills_education' },
  lpn:          { goalType: 'professional_license_reinstatement', domain: 'job_skills_education' },
  rn:           { goalType: 'professional_license_reinstatement', domain: 'job_skills_education' },

  // vocational_training
  apprenticeship: { goalType: 'vocational_training', domain: 'job_skills_education' },
  certification:{ goalType: 'vocational_training', domain: 'job_skills_education' },
  apprentice:   { goalType: 'vocational_training', domain: 'job_skills_education' },
  vocational:   { goalType: 'vocational_training', domain: 'job_skills_education' },
  workforce:    { goalType: 'vocational_training', domain: 'job_skills_education' },
  goodwill:     { goalType: 'vocational_training', domain: 'job_skills_education' },
  training:     { goalType: 'vocational_training', domain: 'job_skills_education' },
  trades:       { goalType: 'vocational_training', domain: 'job_skills_education' },
  trade:        { goalType: 'vocational_training', domain: 'job_skills_education' },

  // employment_search
  'get a job':  { goalType: 'employment_search', domain: 'job_skills_education' },
  'find work':  { goalType: 'employment_search', domain: 'job_skills_education' },
  employment:   { goalType: 'employment_search', domain: 'job_skills_education' },
  interview:    { goalType: 'employment_search', domain: 'job_skills_education' },
  employer:     { goalType: 'employment_search', domain: 'job_skills_education' },
  career:       { goalType: 'employment_search', domain: 'job_skills_education' },
  resume:       { goalType: 'employment_search', domain: 'job_skills_education' },
  hired:        { goalType: 'employment_search', domain: 'job_skills_education' },
  hire:         { goalType: 'employment_search', domain: 'job_skills_education' },
  work:         { goalType: 'employment_search', domain: 'job_skills_education' },
  jobs:         { goalType: 'employment_search', domain: 'job_skills_education' },
  job:          { goalType: 'employment_search', domain: 'job_skills_education' },

  // sobriety_recovery
  alcoholism:   { goalType: 'sobriety_recovery', domain: 'mental_health' },
  substance:    { goalType: 'sobriety_recovery', domain: 'mental_health' },
  addiction:    { goalType: 'sobriety_recovery', domain: 'mental_health' },
  recovering:   { goalType: 'sobriety_recovery', domain: 'mental_health' },
  recovery:     { goalType: 'sobriety_recovery', domain: 'mental_health' },
  sobriety:     { goalType: 'sobriety_recovery', domain: 'mental_health' },
  alcohol:      { goalType: 'sobriety_recovery', domain: 'mental_health' },
  sober:        { goalType: 'sobriety_recovery', domain: 'mental_health' },
  drugs:        { goalType: 'sobriety_recovery', domain: 'mental_health' },
  clean:        { goalType: 'sobriety_recovery', domain: 'mental_health' },
  na:           { goalType: 'sobriety_recovery', domain: 'mental_health' },
  aa:           { goalType: 'sobriety_recovery', domain: 'mental_health' },

  // mental_health_counseling
  'mental health': { goalType: 'mental_health_counseling', domain: 'mental_health' },
  psychiatric:  { goalType: 'mental_health_counseling', domain: 'mental_health' },
  counseling:   { goalType: 'mental_health_counseling', domain: 'mental_health' },
  counselor:    { goalType: 'mental_health_counseling', domain: 'mental_health' },
  therapist:    { goalType: 'mental_health_counseling', domain: 'mental_health' },
  therapy:      { goalType: 'mental_health_counseling', domain: 'mental_health' },
  depression:   { goalType: 'mental_health_counseling', domain: 'mental_health' },
  anxiety:      { goalType: 'mental_health_counseling', domain: 'mental_health' },
  trauma:       { goalType: 'mental_health_counseling', domain: 'mental_health' },
  ptsd:         { goalType: 'mental_health_counseling', domain: 'mental_health' },

  // housing_stability
  'place to stay': { goalType: 'housing_stability', domain: 'financial_security' },
  'safe place': { goalType: 'housing_stability', domain: 'financial_security' },
  transitional: { goalType: 'housing_stability', domain: 'financial_security' },
  apartment:    { goalType: 'housing_stability', domain: 'financial_security' },
  homeless:     { goalType: 'housing_stability', domain: 'financial_security' },
  shelter:      { goalType: 'housing_stability', domain: 'financial_security' },
  housing:      { goalType: 'housing_stability', domain: 'financial_security' },
  house:        { goalType: 'housing_stability', domain: 'financial_security' },
  home:         { goalType: 'housing_stability', domain: 'financial_security' },
  rent:         { goalType: 'housing_stability', domain: 'financial_security' },

  // financial_literacy
  'credit score':  { goalType: 'financial_literacy', domain: 'financial_security' },
  'credit repair': { goalType: 'financial_literacy', domain: 'financial_security' },
  financial:    { goalType: 'financial_literacy', domain: 'financial_security' },
  finance:      { goalType: 'financial_literacy', domain: 'financial_security' },
  savings:      { goalType: 'financial_literacy', domain: 'financial_security' },
  banking:      { goalType: 'financial_literacy', domain: 'financial_security' },
  budget:       { goalType: 'financial_literacy', domain: 'financial_security' },
  credit:       { goalType: 'financial_literacy', domain: 'financial_security' },
  money:        { goalType: 'financial_literacy', domain: 'financial_security' },
  debt:         { goalType: 'financial_literacy', domain: 'financial_security' },
  bank:         { goalType: 'financial_literacy', domain: 'financial_security' },

  // family_reunification
  'get my kids':      { goalType: 'family_reunification', domain: 'family_caregiving' },
  'see my children':  { goalType: 'family_reunification', domain: 'family_caregiving' },
  reunification:      { goalType: 'family_reunification', domain: 'family_caregiving' },
  reunite:      { goalType: 'family_reunification', domain: 'family_caregiving' },
  custody:      { goalType: 'family_reunification', domain: 'family_caregiving' },
  children:     { goalType: 'family_reunification', domain: 'family_caregiving' },
  family:       { goalType: 'family_reunification', domain: 'family_caregiving' },

  // childcare_support
  'child care': { goalType: 'childcare_support', domain: 'family_caregiving' },
  babysitting:  { goalType: 'childcare_support', domain: 'family_caregiving' },
  babysitter:   { goalType: 'childcare_support', domain: 'family_caregiving' },
  childcare:    { goalType: 'childcare_support', domain: 'family_caregiving' },
  daycare:      { goalType: 'childcare_support', domain: 'family_caregiving' },

  // legal_aid
  'criminal record': { goalType: 'legal_aid', domain: 'community_support' },
  expungement:  { goalType: 'legal_aid', domain: 'community_support' },
  probation:    { goalType: 'legal_aid', domain: 'community_support' },
  attorney:     { goalType: 'legal_aid', domain: 'community_support' },
  expunge:      { goalType: 'legal_aid', domain: 'community_support' },
  lawyer:       { goalType: 'legal_aid', domain: 'community_support' },
  parole:       { goalType: 'legal_aid', domain: 'community_support' },
  record:       { goalType: 'legal_aid', domain: 'community_support' },
  rights:       { goalType: 'legal_aid', domain: 'community_support' },
  court:        { goalType: 'legal_aid', domain: 'community_support' },
  legal:        { goalType: 'legal_aid', domain: 'community_support' },

  // education_ged_college
  'community college': { goalType: 'education_ged_college', domain: 'job_skills_education' },
  university:   { goalType: 'education_ged_college', domain: 'job_skills_education' },
  education:    { goalType: 'education_ged_college', domain: 'job_skills_education' },
  graduate:     { goalType: 'education_ged_college', domain: 'job_skills_education' },
  diploma:      { goalType: 'education_ged_college', domain: 'job_skills_education' },
  college:      { goalType: 'education_ged_college', domain: 'job_skills_education' },
  school:       { goalType: 'education_ged_college', domain: 'job_skills_education' },
  degree:       { goalType: 'education_ged_college', domain: 'job_skills_education' },
  study:        { goalType: 'education_ged_college', domain: 'job_skills_education' },
  ccac:         { goalType: 'education_ged_college', domain: 'job_skills_education' },
  ged:          { goalType: 'education_ged_college', domain: 'job_skills_education' },

  // peer_support
  'peer support': { goalType: 'peer_support', domain: 'social_belonging' },
  'support group': { goalType: 'peer_support', domain: 'social_belonging' },
  sisterhood:   { goalType: 'peer_support', domain: 'social_belonging' },
  brotherhood:  { goalType: 'peer_support', domain: 'social_belonging' },
  mentoring:    { goalType: 'peer_support', domain: 'social_belonging' },
  community:    { goalType: 'peer_support', domain: 'social_belonging' },
  network:      { goalType: 'peer_support', domain: 'social_belonging' },
  mentor:       { goalType: 'peer_support', domain: 'social_belonging' },
  peer:         { goalType: 'peer_support', domain: 'social_belonging' },
};

export default TAG_MAP;
