export type OnboardingStep = 1 | 2 | 3 | 4 | 5;

export interface OnboardingFormState {
  companyName: string;
  industry: string;
  companySize: string;
  employeeCount: string;
  location: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  esgFamiliarity: string;
  esgObjectives: string[];
}

export const FAMILIARITY_OPTIONS = [
  {
    id: 'getting_started',
    title: 'We are just getting started',
    description: 'Beginning our ESG journey and looking for practical first steps.',
    icon: 'Search'
  },
  {
    id: 'several_activities',
    title: 'We have done several ESG activities',
    description: 'We have taken initial eco or social actions without a single overarching framework.',
    icon: 'CheckCircle2'
  },
  {
    id: 'structured_programs',
    title: 'We already have structured ESG programs',
    description: 'Established internal policies and ongoing sustainability initiatives.',
    icon: 'GitFork'
  },
  {
    id: 'publish_reports',
    title: 'We already publish ESG / sustainability reports',
    description: 'Regularly measure and publicly report ESG metrics and disclosures.',
    icon: 'BookOpen'
  }
];

export const OBJECTIVE_OPTIONS = [
  {
    id: 'env_impact',
    title: 'Reduce environmental impact',
    description: 'Lower carbon emissions, energy usage, and operational waste.',
    icon: 'Leaf'
  },
  {
    id: 'employee_wellbeing',
    title: 'Improve employee wellbeing',
    description: 'Enhance workplace health, safety, and team satisfaction.',
    icon: 'Heart'
  },
  {
    id: 'community_support',
    title: 'Support local communities',
    description: 'Engage in local social programs, volunteering, and giving back.',
    icon: 'Users'
  },
  {
    id: 'governance',
    title: 'Improve company governance',
    description: 'Strengthen business ethics, codes of conduct, and data privacy.',
    icon: 'Scale'
  },
  {
    id: 'customer_reqs',
    title: 'Meet customer requirements',
    description: 'Satisfy buyer compliance and supply chain ESG expectations.',
    icon: 'Handshake'
  },
  {
    id: 'capability_building',
    title: "Build our company's ESG capability",
    description: 'Educate leadership and staff on sustainable practices.',
    icon: 'GraduationCap'
  },
  {
    id: 'esg_report',
    title: 'Create an ESG report',
    description: 'Generate clear sustainability summaries for stakeholders and buyers.',
    icon: 'FileText'
  }
];

