"use client";
import { getAllUsers } from "@/pages/api/users/usersAPI";
import { useState, useEffect } from "react";
import { useCookies } from "react-cookie";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AllUsers({ placeholder }: { placeholder: string }) {
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
                const users = await getAllUsers(cookies);
                setUsersData(users || []);
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
        <div>
            <h1>All Users</h1>
            <input
                className="peer block w-full rounded-md border border-gray-200 py-[9px] pl-10 text-sm outline-2 placeholder:text-gray-500"
                placeholder={placeholder}
                onChange={(e) => setSearchTerm(e.target.value)}
                value={searchTerm}
            />

            {sortedUsersData.length > 0 ? (
                <table className="min-w-full table-auto mt-4 border-collapse">
                    <thead>
                        <tr>
                            <th className="border px-4 py-2">Username</th>
                            <th className="border px-4 py-2">Email</th>
                            <th className="border px-4 py-2">Profile Link</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedUsersData.map((data) => (
                            <tr key={data.id}>
                                <td className="border px-4 py-2">{data.username}</td>
                                <td className="border px-4 py-2">{data.email}</td>
                                <td className="border px-4 py-2">
                                    <Link href={`/profile/${data.id}`}>
                                        View Profile
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                <p>No users found...</p>
            )}
        </div>
    );
}
