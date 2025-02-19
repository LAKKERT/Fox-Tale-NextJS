'use client';
import { Header } from "@/app/components/header";
import { CreatePostComponent } from "@/app/components/news/createPost";


export default function CreatePost() {
    return (
        <div>
            <Header />
            <CreatePostComponent />
        </div>
    )
}