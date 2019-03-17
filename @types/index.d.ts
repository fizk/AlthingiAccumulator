export type HttpQuery = (url: string, query?: {[key: string]: string | number | Date | null}) => Promise<any>;

export type Message<T> = {body: T, id: string};

export interface Issue {
    issue_id: number;
    assembly_id: number;
    congressman_id: number | null;
    category: 'A' | 'B';
    name: string;
    sub_name: string;
    type: string;
    type_name: string;
    type_subname: string;
    status: string | null;
    question: string | null;
    goal: string | null;
    major_changes: string | null;
    changes_in_law: string | null;
    costs_and_revenues: string | null;
    deliveries: string | null;
    additional_information: string | null;
}

export interface CongressmanDocument {
    document_id: number,
    issue_id: number,
    category: 'A' | 'B',
    assembly_id: number,
    congressman_id: number | null,
    minister: string | null,
    order: number | null
}

export interface Document {
    document_id: number,
    issue_id: number,
    category: 'A' | 'B',
    assembly_id: number,
    date: string,
    url: string | null,
    type: string
}

export interface Congressman {
    congressman_id: number,
    name: string,
    birth: string,
    death: null
}

export interface Constituency {
    constituency_id: number,
    name: string,
    abbr_short: string,
    abbr_long: string,
    description: string,
    date: string
}

export interface Party {
    party_id: number,
    name: string,
    abbr_short: string,
    abbr_long: string,
    color: string | null
}

export interface Progress {
    assembly_id: number,
    issue_id: number,
    committee_id: number | null,
    speech_id: string | null,
    document_id: number | null,
    date: string,
    title: string | null,
    type: string | null,
    committee_name: string | null,
    completed: string | null,
}

export interface Assembly {
    assembly_id: number,
    from: string,
    to: string,
}

export interface IssueCategory {
    assembly_id: number;
    issue_id: number;
    category: 'A' | 'B';
    category_id: number;
}

export interface Category {
    category_id: number,
    super_category_id: number,
    title: string,
    description: string
}
