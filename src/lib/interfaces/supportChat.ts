export interface ErrorsState {
    max_files: string;
}

export interface ServerErrors {
    title: string;
    description: string;
    file: string;
}

export interface FilesProperties {
    name: string;
    extension: string;
    size: number;
}

export interface CreateSupportForm {
    title: string;
    description: string;
    file: File | string | null;
}

export interface Requests {
    id: string;
    title: string;
    status: boolean;
    link: string;
}