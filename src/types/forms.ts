// ── Nexus Forms — Type Definitions ──

export type FormStatus = "draft" | "active" | "paused" | "completed";
export type FormType = "link" | "app" | "quiz";

export type BlockType =
  | "welcome_card"
  | "ending_card"
  | "open_text"
  | "multiple_choice_single"
  | "multiple_choice_multi"
  | "rating"
  | "nps"
  | "date"
  | "matrix"
  | "ranking"
  | "picture_selection"
  | "consent"
  | "cta"
  | "file_upload"
  | "contact_info"
  | "address";

export type OpenTextInputType = "text" | "email" | "url" | "number" | "phone";
export type RatingStyle = "number" | "star" | "smiley";
export type CardArrangement = "casual" | "straight" | "simple";
export type BackgroundType = "color" | "gradient" | "image";

// ── Logic ──
export type LogicOperator =
  | "equals" | "not_equals" | "contains" | "not_contains"
  | "starts_with" | "ends_with" | "is_filled" | "is_empty"
  | "greater_than" | "less_than" | "gte" | "lte"
  | "includes" | "not_includes" | "includes_all" | "includes_any"
  | "before" | "after" | "was_answered" | "was_skipped";

export type LogicAction = "go_to" | "skip_to_end" | "calc_variable" | "show_hide";
export type LogicJoin = "and" | "or";

export interface LogicCondition {
  field: string; // block id or variable name
  operator: LogicOperator;
  value?: string | number | string[];
}

export interface LogicRule {
  id: string;
  conditions: LogicCondition[];
  join: LogicJoin;
  action: LogicAction;
  actionTarget?: string; // block id, variable name, etc.
  calcOp?: "add" | "subtract" | "multiply" | "divide" | "assign";
  calcValue?: number;
}

// ── Blocks ──
export interface FormBlockBase {
  id: string;
  type: BlockType;
  headline: string;
  subheader?: string;
  imageUrl?: string;
  required: boolean;
  logic?: LogicRule[];
}

export interface WelcomeCardBlock extends FormBlockBase {
  type: "welcome_card";
  buttonLabel: string;
  videoUrl?: string;
}

export interface EndingCardBlock extends FormBlockBase {
  type: "ending_card";
  buttonLabel?: string;
  redirectUrl?: string;
}

export interface OpenTextBlock extends FormBlockBase {
  type: "open_text";
  inputType: OpenTextInputType;
  longAnswer: boolean;
  placeholder?: string;
}

export interface ChoiceOption {
  id: string;
  label: string;
  imageUrl?: string;
}

export interface MultipleChoiceSingleBlock extends FormBlockBase {
  type: "multiple_choice_single";
  options: ChoiceOption[];
  allowOther: boolean;
  shuffleOptions: boolean;
  displayAs: "list" | "dropdown";
}

export interface MultipleChoiceMultiBlock extends FormBlockBase {
  type: "multiple_choice_multi";
  options: ChoiceOption[];
  allowOther: boolean;
  shuffleOptions: boolean;
  maxSelections?: number;
}

export interface RatingBlock extends FormBlockBase {
  type: "rating";
  scale: 3 | 4 | 5 | 7 | 10;
  style: RatingStyle;
  lowLabel?: string;
  highLabel?: string;
}

export interface NpsBlock extends FormBlockBase {
  type: "nps";
  lowLabel: string;
  highLabel: string;
}

export interface DateBlock extends FormBlockBase {
  type: "date";
}

export interface MatrixRow { id: string; label: string; }
export interface MatrixColumn { id: string; label: string; }
export interface MatrixBlock extends FormBlockBase {
  type: "matrix";
  rows: MatrixRow[];
  columns: MatrixColumn[];
}

export interface RankingBlock extends FormBlockBase {
  type: "ranking";
  options: ChoiceOption[];
}

export interface PictureSelectionBlock extends FormBlockBase {
  type: "picture_selection";
  options: ChoiceOption[];
  multiSelect: boolean;
}

export interface ConsentBlock extends FormBlockBase {
  type: "consent";
  consentText: string;
  checkboxLabel: string;
}

export interface CtaBlock extends FormBlockBase {
  type: "cta";
  buttonLabel: string;
  buttonUrl?: string;
  dismissible: boolean;
}

export interface FileUploadBlock extends FormBlockBase {
  type: "file_upload";
  allowedExtensions: string[];
  maxFileSizeMb: number;
}

export interface ContactInfoField {
  key: "firstName" | "lastName" | "email" | "phone" | "company";
  enabled: boolean;
  required: boolean;
}
export interface ContactInfoBlock extends FormBlockBase {
  type: "contact_info";
  fields: ContactInfoField[];
}

export interface AddressBlock extends FormBlockBase {
  type: "address";
}

export type FormBlock =
  | WelcomeCardBlock | EndingCardBlock | OpenTextBlock
  | MultipleChoiceSingleBlock | MultipleChoiceMultiBlock
  | RatingBlock | NpsBlock | DateBlock | MatrixBlock
  | RankingBlock | PictureSelectionBlock | ConsentBlock
  | CtaBlock | FileUploadBlock | ContactInfoBlock | AddressBlock;

// ── Form Variable ──
export interface FormVariable {
  id: string;
  name: string;
  type: "text" | "number";
  defaultValue: string | number;
}

// ── Styling ──
export interface FormStyling {
  brandColor: string;
  accentColor: string;
  backgroundColor: string;
  cardColor: string;
  textColor: string;
  fontFamily: string;
  borderRadius: number;
  cardArrangement: CardArrangement;
  backgroundType: BackgroundType;
  backgroundImage?: string;
  backgroundGradient?: string;
  logo?: string;
}

// ── Settings ──
export interface FormSettings {
  responseLimit?: number;
  closeOnDate?: string;
  allowMultipleResponses: boolean;
  requireEmail: boolean;
  isPublic: boolean;
  password?: string;
  redirectUrl?: string;
  progressBar: boolean;
  backButton: boolean;
}

// ── Form ──
export interface NexusForm {
  id: string;
  name: string;
  status: FormStatus;
  type: FormType;
  blocks: FormBlock[];
  variables: FormVariable[];
  styling: FormStyling;
  settings: FormSettings;
  responseCount: number;
  completionRate: number;
  avgResponseTime: number; // seconds
  createdAt: string;
  updatedAt: string;
}

// ── Response ──
export interface FormResponse {
  id: string;
  formId: string;
  data: Record<string, unknown>;
  finished: boolean;
  startedAt: string;
  completedAt?: string;
  userAgent?: string;
}

// ── Template ──
export interface FormTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  blocks: FormBlock[];
}
