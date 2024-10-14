import { useEffect } from "react";
import { useCookies } from "react-cookie";

export function ProfileComponent() {
    const [cookies] = useCookies(["auth_token"]);

    const token = cookies.auth_token;
    console.log(token);
    if (!token) {
        console.log("Unauthorized");
    }


    return (
        <div>
            <h1>Profile Component</h1>
            <p>This is the profile component.</p>
        </div>
    );
}