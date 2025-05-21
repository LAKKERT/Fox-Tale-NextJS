export type UsersData = {
    user_id: string,
    username: string,
}

export type UserData = {
    id: string;
    username: string;
    email: string;
} | null;

export type ChatData = {
    id: string,
    title: string,
    created_at: string,
    description: string
    status: boolean,
    files: string[],
};

export type Message = {
    content: string;
    message: string;
    user_id: string;
    file_url: string[];
    sent_at: string;
    unreaded: boolean;
};