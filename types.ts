export interface DataRow {
  name: string;
  effort: number;
  originalEstimate: number;
  count: number;
  averageEffort: number;
  averageOriginalEstimate: number;
  effortEstimateRatio: number;
}

export interface GenericResponse<T> {
  count: number;
  value: T[];
}

export interface GitRepository {
  id: string;
  name: string;
}

export interface IterationWorkItems {
    _links: ReferenceLinks;
    url: string;
    workItemRelations: WorkItemLink[];
}

export interface ReferenceLinks {
  links: object;
}

export interface TeamIterationAttributes {
  finishDate: string;
  startDate: string;
  // timeFrame
}

export interface TeamSettingsIteration {
  _links: ReferenceLinks;
  attributes: TeamIterationAttributes;
  id: string;
  name: string;
  path: string;
  url: string;
}

export interface WorkItem {
  id: number;
  url: string;
  fields: any;
}

export interface WorkItemLink {
    rel: string;
    source: WorkItemReference;
    target: WorkItemReference;
}

export interface WorkItemQueryResult {
  workItems: WorkItemReference[];
}

export interface WorkItemReference {
  id: number;
  url: string;
}
