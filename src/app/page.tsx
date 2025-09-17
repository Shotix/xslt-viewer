import { XsltTransformer } from "@/app/components/XsltTransformer";
import { Github, CodeXml } from "lucide-react";

export default function HomePage() {
    return (
        <div className="flex flex-col h-screen bg-background font-sans">
            <header className="flex items-center justify-between p-3 border-b border-border shadow-md bg-background/80 backdrop-blur-sm z-10">
                <div className="flex items-center gap-3">
                    <CodeXml className="w-8 h-8 text-primary" />
                    <h1 className="text-2xl font-bold text-foreground tracking-tight">
                        XSLT Transformer
                    </h1>
                </div>
                <a
                    href="https://github.com/Shotix/xslt-viewer"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-1.5 text-foreground transition-colors rounded-md hover:bg-muted/50"
                    aria-label="View source code on GitHub"
                >
                    <Github className="w-5 h-5" />
                    <span>Source</span>
                </a>
            </header>
            <main className="flex-grow">
                <XsltTransformer />
            </main>
        </div>
    );
}