import Header from "../components/Header";
import Footer from "../components/Footer";
import ConnectivityTest from "../components/ConnectivityTest";

export default function ConnectivityTestPage() {
    return (
        <div className="min-h-screen bg-slate-950 text-white flex flex-col pt-16">
            <Header />
            <ConnectivityTest />
            <Footer />
        </div>
    );
}