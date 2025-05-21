export type FormData = {
    password1?: string | null;
    password2: string;
    repeatPassword2: string;
};

export type ServerErrors = {
    password1?: string;
    password2?: string;
    repeatPassword2?: string;
};