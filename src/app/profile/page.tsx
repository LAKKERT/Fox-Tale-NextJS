"use client";
import { getAllUsers } from "@/pages/api/users/usersAPI";
import { useState, useEffect } from "react";
import { useCookies } from "react-cookie";
import Link from "next/link";

export default function AllUsers() {
    const [usersData, setUsersData] = useState([]);
    const [cookies] = useCookies(["auth_token"]);

    useEffect(() => {
        const fetchAllUsers = async () => {
            try {
                const users = await getAllUsers(cookies);
                await setUsersData(users);
            }catch(error) {
                console.error('Error fetching users:', error);
            }
        };
        fetchAllUsers();
    }, [cookies]);

    return (
        <div>
            <h1>All Users</h1>
            
            {usersData ? (
                usersData.map((data) => (
                    <Link href={`/profile/[id]`} as={`/profile/${data.id}`} key={data.id}>
                        <li key={data.id}>
                            {data.username} - {data.email}
                        </li>
                    </Link>
                ))
            ) : (
                <p>Loading users data...</p>
            )}
        </div>
    );
}