"use client";
import { getAllUsers } from "@/pages/api/users/usersAPI";
import { useState, useEffect } from "react";
import { useCookies } from "react-cookie";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { K2D } from "next/font/google";


export function AllProfilesTable({ placeholder }: { placeholder: string }) {
    const [usersData, setUsersData] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [sortedUsersData, setSortedUsersData] = useState<any[]>([]);
    const [cookies] = useCookies(["auth_token"]);
    const router = useRouter();

    useEffect(() => {
        const fetchAllUsers = async () => {
            if (!cookies.auth_token) {
                router.push("/");
                return;
            }
            try {
                // const users = await getAllUsers(cookies);
                const response = await fetch(`/api/users/getAllusersAPI`, {
                    method: "GET",
                    headers: {
                        'Authorization': `Bearer ${cookies.auth_token}`
                    }
                });

                const users = await response.json();
                console.log(users);

                if (response.ok) {
                    setUsersData(users.result || []);
                }else {
                    console.error("Error fetching users:", error);
                }

            } catch (error) {
                console.error("Error fetching users:", error);
            }
        };

        fetchAllUsers();
    }, [cookies, router]);

    useEffect(() => {
        if (Array.isArray(usersData)) {
            const filteredUsers = usersData.filter((user) =>
                user.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.email.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setSortedUsersData(filteredUsers);
        }
    }, [searchTerm, usersData]);
    
    return (
        <div className={`h-[90vh] w-full mt-[100px] pt-8 flex flex-col justify-top items-center gap-5 text-white `}>
            <h1 className="text-4xl">All Users</h1>
            <input
                className="peer max-w-6xl w-[1070px] h-11 block rounded-md outline-none focus:outline-none transition duration-75 ease-in-out focus:outline-2 focus:outline-white border-0 py-[9px] pl-10 text-lg tracking-wider shadow-[8px_9px_6px_0px_rgba(34,60,80,0.2)] bg-[rgba(6,6,6,.65)] placeholder:text-white"
                placeholder="Search by ID, Username, or Email"
                onChange={(e) => setSearchTerm(e.target.value)}
                value={searchTerm}
            />

            {sortedUsersData.length > 0 ? (
                <div className="max-w-6xl flex flex-col gap-5">
                    <div className="grid grid-cols-4 gap-2 p-4 min-w-5xl w-[1070px] text-center text-xl uppercase bg-[rgba(6,6,6,.65)] shadow-[8px_9px_6px_0px_rgba(34,60,80,0.2)] rounded-xl">
                        <div className="border-r-2 border-white">
                            id
                        </div>

                        <div className="border-r-2 border-white">
                            username
                        </div>

                        <div className="border-r-2 border-white">
                            email
                        </div>

                        <div>
                            Profile link
                        </div>
                    </div>

                    <div className="flex flex-col gap-5">
                        {sortedUsersData.map(data => (
                            <div key={data.id} className="grid grid-cols-4 gap-2 p-4 min-w-5xl w-[1070px] text-center text-md text-balance bg-[rgba(6,6,6,.65)] rounded-xl shadow-[8px_9px_6px_0px_rgba(34,60,80,0.2)] transition-all duration-150 ease-in-out hover:outline outline-[#f5885a]">
                                <div className="border-r-2 border-white flex justify-center items-center">
                                    {data.id}
                                </div>

                                <div className="border-r-2 border-white flex justify-center items-center">
                                    {data.username}
                                </div>

                                <div className="border-r-2 border-white flex justify-center items-center">
                                    {data.email}
                                </div>

                                <div className="flex justify-center items-center">
                                    <Link href={`/profile/[id]`} as={`/profile/${data.id}`}>Profile link</Link>
                                </div>
                            </div>
                        ))}
                    </div>

                </div>
            ) : (
                <p>No users found...</p>
            )}
        </div>
    );
}