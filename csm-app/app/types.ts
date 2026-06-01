export interface JiraIssue {
  type: "Bug" | "Story" | "Task";
  title: string;
  description: string;
}

export interface AhaIdea {
  category: string;
  title: string;
  description: string;
}

export interface ActionItems {
  day0: string[];
  day1: string[];
  day2to3: string[];
  day5to7: string[];
}

export interface FollowUpEmail {
  subject: string;
  body: string;
}

export interface AnalysisResult {
  catalyst: {
    notes: string;
    healthScore: "Green" | "Amber" | "Red";
  };
  jiraIssues: JiraIssue[];
  ahaIdeas: AhaIdea[];
  actionItems: ActionItems;
  followUpEmail: FollowUpEmail;
}

export interface ChecklistState {
  jiraIssues: boolean[];
  ahaIdeas: boolean[];
  actionItems: {
    day0: boolean[];
    day1: boolean[];
    day2to3: boolean[];
    day5to7: boolean[];
  };
  catalystDone: boolean;
  emailDone: boolean;
}
