import Image from "next/image";
import { K2D } from "next/font/google";
import styles from "@/app/styles/home/variables.module.scss";

const MainFont = K2D({
    style: "normal",
    subsets: ["latin"],
    weight: "400",
});

export function Main() {
    return (
        <div className={`lg:max-w-8xl mx-auto mt-[100px] ${MainFont.className}`}>
            <video width={1280} height={902} controls-none="false" autoPlay muted className="w-full h-auto lg:h-[555px]">
                <source src="home/introduction_logo.mp4" type="video/mp4" />
            </video>

            <div className="w-full bg-[#f5885a]">
                <div className="uppercase text-3xl py-2 text-white text-center">- MAIN NEWS -</div>
                <div className={`flex flex-col items-center md:flex-row gap-8 sm:mx-auto md:w-[732px] xl:w-auto xl:justify-center overflow-x-auto ${styles.custom_scroll}`}>

                    <div className="relative py-2 px-4 sm:p-4 w-[320px] h-[190px] sm:w-[350px] sm:h-[220px]">
                        <Image src="/home/outline_card.svg" alt="outline" width={100} height={100} className="absolute inset-0 w-full h-full pointer-events-none z-[1]" />
                        <div className="relative bg-[#d8b5a3] h-full z-[0] rounded">
                            <div className="text-center uppercase py-2 text-lg font-light">Title</div>
                            <div className="text-base p-2 h-auto truncate">
                                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut et massa mi. Aliquam in hendrerit urna.
                                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut et massa mi. Aliquam in hendrerit urna.
                                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut et massa mi. Aliquam in hendrerit urna.
                                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut et massa mi. Aliquam in hendrerit urna.
                            </div>
                        </div>
                    </div>

                    <div className="relative py-2 px-4 sm:p-4 w-[320px] h-[190px] sm:w-[350px] sm:h-[220px]">
                        <Image src="/home/outline_card.svg" alt="outline" width={100} height={100} className="absolute inset-0 w-full h-full pointer-events-none z-[1]" />
                        <div className="relative bg-[#d8b5a3] h-full z-[0] rounded">
                            <div className="text-center uppercase py-2 text-lg font-light">Title</div>
                            <div className="text-base p-2 h-auto truncate">
                                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut et massa mi. Aliquam in hendrerit urna.
                                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut et massa mi. Aliquam in hendrerit urna.
                                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut et massa mi. Aliquam in hendrerit urna.
                                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut et massa mi. Aliquam in hendrerit urna.
                            </div>
                        </div>
                    </div>

                    <div className="relative py-2 px-4 sm:p-4 w-[320px] h-[190px] sm:w-[350px] sm:h-[220px]">
                        <Image src="/home/outline_card.svg" alt="outline" width={100} height={100} className="absolute inset-0 w-full h-full pointer-events-none z-[1]" />
                        <div className="relative bg-[#d8b5a3] h-full z-[0] rounded">
                            <div className="text-center uppercase py-2 text-lg font-light">Title</div>
                            <div className="text-base p-2 h-auto truncate">
                                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut et massa mi. Aliquam in hendrerit urna.
                                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut et massa mi. Aliquam in hendrerit urna.
                                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut et massa mi. Aliquam in hendrerit urna.
                                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut et massa mi. Aliquam in hendrerit urna.
                            </div>
                        </div>
                    </div>

                </div>
                <div className="flex flex-row items-center justify-end">
                    <a href="#" className="flex flex-row items-center justify-end gap-2 uppercase text-xl py-2 px-4 mr-4 mt-4 mb-4 text-white text-center rounded hover:bg-[#C2724F] transition duration-150 ease-in-out">
                        All news •
                        <Image src="home/Arrow.svg" alt="arrow" width={25} height={25} />
                    </a>
                </div>
            </div>

            <div className={`relative`}>

                <video width={1280} controls-none="false" autoPlay loop muted className="w-full relative hidden md:block opacity-50 xl:opacity-100">
                    <source src="home/leaves.mp4" type="video/mp4" />
                </video>

                <div className={`${styles.gradient} absolute inset-0 z-10`} />

                <div className="relative md:absolute h-full top-0 gap-5 py-6 px-10 flex flex-col items-center justify-center text-[#F5DEB3] z-20">
                    <h2 className="text-2xl sm:text-5xl">THE FOX TEMPLE</h2>
                    <div className="flex flex-col justify-center items-center md:my-auto xl:justify-between xl:items-center xl:flex-row text-base md:text-3xl text-balance ">
                        <div className="text-center xl:text-left xl:w-1/4">
                            <p>Fox Tale immerses you in the world of foxes and their exploits. You will assume the role of a lone little fox living in a fantastical setting.
                                Your main objectives are to travel the world in search of food, to stay safe, and to learn more about your ancestors.</p>
                        </div>

                        <div className="text-center xl:text-right xl:w-1/4">
                            <p>Numerous different animals can be encountered in the game. Each animal has distinctive qualities all its own. They can either facilitate or impede your adventures.
                                There are also quests and puzzles in the world, to overcome which you must have the necessary skills and knowledge about the world around you.</p>
                        </div>
                    </div>
                </div>

            </div>


            <div className="relative flex flex-col-reverse items-center md:flex-row justify-between p-10 gap-5 bg-black">
                <div className="relative top-[-100px] sm:top-[0] w-full uppercase text-center flex flex-col gap-4 text-[#F5DEB3]">
                    <h2 className="text-4xl">UNIVERSE</h2>
                    <p className="text-lg">Lorem ipsum dolor sit amet, consectetur adipisicing elit. Velit eum itaque sit, aut ducimus ea nulla molestiae maxime animi ratione incidunt sapiente officiis provident facilis doloribus ullam harum soluta fuga!</p>
                </div>

                <div className="relative top-[-80px] sm:top-0 md:transform scale-50 smx:scale-[65%] sm:scale-100">
                    <svg width="538" height="583">
                        <defs>
                            <pattern id="ImgAnimation" width='1' height='1'>
                                <image
                                    href="/home/runningFox.jpg"
                                    width="600"
                                    height="585"
                                    preserveAspectRatio="xMidYMid slice"
                                >
                                    <animateTransform
                                        attributeName="transform"
                                        type="translate"
                                        values="0; -62 0; 0 0"
                                        dur="8s"
                                        repeatCount="indefinite"
                                        keyTimes="0; 0.5; 1"
                                        keySplines="0.42 0 0.58 1; 0.42 0 0.58 1"
                                        calcMode="spline"
                                    />
                                </image>
                            </pattern>
                        </defs>
                        <path
                            d="M80.3072 1.2888L160.114 82.0156V430.033L0.5 274.064L0.500018 82.016L80.3072 1.2888ZM457.693 1.28885L537.5 82.016L537.5 274.064L377.886 430.033V82.0156L457.693 1.28885ZM348.805 105.418L348.805 454.806L269.34 533.041L189.532 454.806L189.532 105.422L269.339 184.514L348.805 105.418ZM0.720283 299.067L160.334 454.537V481.683L0.720283 326.213V299.067ZM537.043 299.067V326.213L377.429 481.683V454.537L537.043 299.067ZM189.074 479.313L268.882 557.049L349.184 479.318V506.46L268.88 583.695L189.074 506.459V479.313Z"
                            stroke="transparent"
                            fill="url(#ImgAnimation)"
                            className="object-fill"
                        />
                    </svg>
                </div>
            </div>
        </div>
    );
}