'use client';

import { Header } from "../components/header";
import { Loader } from "../components/load";
import { SupportPageComponent } from "../components/support/suppurtPage";
import { useState } from "react";

export default function SupportPage() {
    const [loading, setLoading] = useState(true);

    return (
        <div>
            <Header />
            <SupportPageComponent />
        </div>
    )
}