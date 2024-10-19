"use client";

export function EmailChange({ userData }) {
    if (!userData) {
        return <p>Loading email data...</p>;
    }
    return (
        <div className="w-full flex flex-col lg:flex-row justify-center items-center py-3 lg:py-6  px-4 lg:px-6 gap-3 bg-[#272727] text-center text-lg lg:text-lg text-balance rounded-md lg:rounded-xl">
            <div>
                <p>If you want to change your Email, fill out the form</p>
            </div>

            <div className="w-full flex flex-col gap-3">
                <p >Your EMAIL: {userData.email}</p>
                <form className="flex flex-col gap-3">
                    <input type="email" placeholder="Email" className="w-full h-11 bg-[rgba(73,73,73,.56)] rounded text-white text-center outline-[#C67E5F] focus:outline" />
                    <p className="flex items-center justify-center w-full h-11 rounded text-white text-center">Code from: {userData.email}</p>
                    <input type="text" placeholder="Code" className="w-full h-11 bg-[rgba(73,73,73,.56)] rounded text-white text-center outline-[#C67E5F] focus:outline" />
                    <input type="submit" value="Save changes" className="w-full h-11 bg-[#C67E5F] hover:bg-[rgba(198,126,95,.80)] rounded text-white text-center cursor-pointer transition-all duration-150 ease-in-out" />
                </form>
            </div>
        </div>
    );
}