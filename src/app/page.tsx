import Image from "next/image";
import { Header } from "./components/header";
import { Main } from "./components/home/homePage";
import { Footer } from "./components/footer";

export default function Home() {
  return (
    <div className="bg-black">
        <Header />
        <Main />
        <Footer />
    </div>
  );
}
