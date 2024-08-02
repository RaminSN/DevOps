export interface GitRepository {
    id: string;
    name: string;
}

export interface WorkItemResponse {
    count: number;
    value: WorkItem[];
}

export interface WorkItem {
    id: number;
    url: string;
    fields: any;
}

export interface WorkItemQueryResult {
    workItems: WorkItemReference[];
}

export interface WorkItemReference {
    id: number;
    url: string;
}

export interface DataRow {
    name: string;
    effort: number;
    originalEstimate: number;
    count: number;
    averageEffort: number;
}