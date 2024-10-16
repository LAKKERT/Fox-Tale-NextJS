"use client";
import { useState, useEffect } from "react";
import { getUserProfile } from "@/pages/api/users/usersAPI";
import { useCookies } from "react-cookie";

export default function UserProfile({params}) {
    const [userData, setUserData] = useState(null);
    const [cookies] = useCookies(['auth_token']);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const data = await getUserProfile(params.id, cookies);
                setUserData(data);
            } catch (error) {
                console.log("fetching data error", error);
            }
        };
        fetchUserData();
    }, [params.id]);

    return (
        <div>
            <h1>User Profile</h1>
            {userData? (
                <div>
                    <p>id: {userData.id}</p>
                    <p>Username: {userData.username}</p>
                    <p>Email: {userData.email}</p>
                </div>
            ) : (
                <p>Loading user data...</p>
            )}
        </div>
    )
}