
export interface Lead {
  id: string;
  name: string;
  role: string;
  company: string;
  qualificationScore: number; // 0-100
  reasoning: string;
  painPoints?: string[]; 
  sourceUrl?: string;
  linkedinUrl?: string;
  emailGuess?: string;
  emailStatus?: EmailStatus; 
  phone?: string; 
  techStack?: string[]; 
  outreach: {
    subjectVariants: string[]; 
    subject?: string; 
    email: string; 
    linkedin: string;
    phone: string; 
    // Follow-up Sequence
    sequence?: SequenceStep[];
    lastContactedAt?: number;
    nextFollowUpAt?: number;
  };
  auditObservation?: string; 
  seoAnalysis?: SeoAnalysis; 
  
  // Visual AI Audit
  visualAnalysis?: VisualAnalysis;
  
  // Strategic Battlecard
  battlecard?: Battlecard;

  // New: Buying Signals
  buyingSignals?: BuyingSignal[];

  // New: Organization Data
  orgChart?: OrgNode[];

  // New: Geo Data
  coordinates?: { x: number; y: number }; // For Radar View

  // CRM Sync Status
  crmSync?: {
      platform: 'HUBSPOT' | 'SALESFORCE' | 'WEBHOOK';
      syncedAt: number;
      externalId?: string;
      status: 'SUCCESS' | 'FAILED';
  };

  address?: string; 
  location?: string; 
  industry?: string; 
  rating?: number;
  status: LeadStatus; 
  valueProposition?: string; 
  senderName?: string; 
  senderWebsite?: string;
  senderEmail?: string;
  
  // Context Persistence
  strategy?: SalesStrategy; 
  landingPageUrl?: string;
  isDeepDived?: boolean; 
  
  // CRM Features
  notes?: Note[]; 
  history?: LeadLog[]; 
}

export interface BuyingSignal {
    type: 'FUNDING' | 'HIRING' | 'MANAGEMENT_CHANGE' | 'EXPANSION' | 'TECH_ADOPTION';
    description: string;
    detectedAt: number;
    scoreImpact: number; // How much it increases qualification
}

export interface OrgNode {
    id: string;
    name: string;
    role: string;
    type: 'DECISION_MAKER' | 'INFLUENCER' | 'BLOCKER' | 'USER';
    parentId?: string; // For hierarchy
}

export interface SequenceStep {
    id: string;
    day: number; // e.g., 1, 3, 7
    subject: string;
    body: string;
    intent: 'HOOK' | 'VALUE' | 'BREAKUP';
    status?: 'PENDING' | 'SENT';
}

export interface Battlecard {
    personalityType: 'DRIVER' | 'ANALYTICAL' | 'AMIABLE' | 'EXPRESSIVE';
    personalityTips: string;
    iceBreakers: string[];
    goldenQuestion: string;
    valueHook: string; // 1 sentence value prop tailored to them
    killShotObjection: {
        objection: string;
        counter: string;
    };
    winProbability: number; // 0-100 estimate
}

export interface VisualAnalysis {
    screenshot?: string; // Base64 image string
    designScore: number; // 0-100
    uxIssues: string[];
    conversionBlockers: string[];
    aiFeedback: string;
}

export interface LeadLog {
    id: string;
    timestamp: number;
    action: string; // e.g. "Status changed to CONTACTED"
    user: string;
}

export interface EmailTemplate {
    id: string;
    name: string;
    subject: string;
    body: string;
    variables?: string[]; // e.g. ['{{name}}', '{{company}}']
}

export type EmailStatus = 'VERIFIED' | 'INVALID' | 'UNKNOWN' | 'RISKY';

export interface Note {
  id: string;
  content: string;
  createdAt: number;
}

export interface SeoAnalysis {
  keywordDensity: 'Alta' | 'Media' | 'Baja';
  metaDescription: boolean; 
  readability: 'Básica' | 'Profesional' | 'Técnica';
  overallScore: number; 
  mainIssue: string; 
  metaTitlePresence: boolean;
  headingStructure: {
    h1Count: number;
    h2Count: number;
  };
  internalLinkingScore: number; 
}

export enum LeadStatus {
  NEW = 'NEW',
  CONTACTED = 'CONTACTED',
  QUALIFIED = 'QUALIFIED',
  DISQUALIFIED = 'DISQUALIFIED'
}

export type SearchType = 'WEB' | 'MAPS' | 'COMPETITORS' | 'SOCIAL';

export type SalesStrategy = 'HUNTER' | 'CONSULTANT' | 'PARTNER';

export interface SearchCriteria {
  searchType: SearchType;
  targetPersona: string;
  industry: string;
  location: string;
  valueProposition: string;
  senderName: string;
  senderWebsite: string;
  senderEmail: string; 
  landingPageUrl: string;
  strategy: SalesStrategy;
  competitorUrl?: string; 
  leadCount: number; 
}

export interface SearchHistoryItem {
  id: string;
  timestamp: number;
  criteria: SearchCriteria;
  leadCount: number;
  leads: Lead[];
}

export interface UserProfile {
  name: string;
  email: string;
  website: string;
  landingPage?: string;
  jobTitle?: string;
  apiKey?: string; 
  customInstructions?: string; 
  emailSignature?: string; 
  webhookUrl?: string; 
  
  // CRM Native Integrations
  hubspotKey?: string; // Private App Access Token
  salesforceKey?: string; // Access Token
  salesforceInstanceUrl?: string; // e.g. https://your-domain.my.salesforce.com

  // Gamification & Progress
  xp?: number;
  level?: number;
  currentStreak?: number;
  lastLoginDate?: string;
  badges?: string[]; // IDs of unlocked badges
  
  // Settings
  hasSeenOnboarding?: boolean;
  scoringWeights?: ScoringWeights;
}

export interface ScoringWeights {
    techStack: number; // 0-100 impact
    socialPresence: number;
    seoHealth: number;
}

export enum AppState {
  IDLE = 'IDLE',
  SEARCHING = 'SEARCHING',
  PROCESSING = 'PROCESSING',
  COMPLETE = 'COMPLETE',
  ERROR = 'ERROR'
}

export type SortOption = 'SCORE_DESC' | 'SCORE_ASC' | 'NAME_ASC';

export interface Notification {
  id: string;
  message: string;
  type: 'SUCCESS' | 'ERROR' | 'INFO' | 'WARNING';
}

export interface RoleplayMessage {
    id: string;
    sender: 'USER' | 'AI';
    text: string;
    feedback?: string; 
}
