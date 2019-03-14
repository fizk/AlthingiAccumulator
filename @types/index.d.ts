export type HttpQuery = (url: string, query?: {[key: string]: string | number | Date | null}) => Promise<any>;
export type QueueMessage = {body: any, id: string};


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
