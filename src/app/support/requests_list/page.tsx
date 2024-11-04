'use client';

import { GetAllRequests } from '@/pages/api/support/getRequestsAPI';
import { useState, useEffect } from "react";
import { useCookies } from "react-cookie";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AllSupporRequests() {
    
    const [requests, setRequests] = useState<any[]>([]);
    const [cookies] = useCookies(['auth_token']);
    const router = useRouter();

    useEffect(() => {
        const fetchAllRequests = async () => {
            if (!cookies.auth_token) {
                router.push("/");
                return;
            }

            try {
                const data = await GetAllRequests(cookies);
                setRequests(data || []);
                console.log(data);
            }catch (error) {
                console.error("Error fetching requests:", error);
            }
        };
        
        fetchAllRequests();
    }, [cookies]);

    return (
        <div>
            {requests.map((request) => (
                <div key={request.id}>
                    <Link href={`/support/${request.id}`}>{request.title}</Link>
                </div>
            ))}
        </div>
    );
}