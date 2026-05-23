import Header from "../../components/layouts/Header";
import Footer from "../../components/layouts/Footer";
import ConnectivityTest from "../dev/ConnectivityTest";

export default function ConnectivityTestPage() {
    return (
        <div className="min-h-screen bg-white text-white flex flex-col pt-16">
            <Header />
            <ConnectivityTest />
            <Footer />
        </div>
    );
}