"use client";
import { useEffect } from "react";
import {useCookies} from "react-cookie";
import { ProfileComponent } from "../components/profile/profile";

export default function UserProfile() {
    return (
        <div>
            <h1>User Profile</h1>
            <ProfileComponent />
        </div>
    );
}