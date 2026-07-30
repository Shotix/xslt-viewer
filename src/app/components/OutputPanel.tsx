import React from "react";
import { Panel } from "react-resizable-panels";
import { Download, FileText, Trash2, Files, Info, Loader2, Save } from "lucide-react";

interface OutputPanelProps {
    output: string;
    error: string | null;
    isTransforming: boolean;
    onDownload: () => void;
    onClear: () => void;
    onLoadSamples: () => void;
    onExportSession: () => void;
    onImportClick: () => void;
}

export function OutputPanel({
                                output,
                                error,
                                isTransforming,
                                onDownload,
                                onClear,
                                onLoadSamples,
                                onExportSession,
                                onImportClick,
                            }: OutputPanelProps) {
    return (
        <Panel minSize={20}>
            <div className="flex flex-col h-full bg-card rounded-md overflow-hidden border border-border relative">
                <div className="flex items-center justify-between p-2 pl-3 border-b border-border">
                    <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        <h2 className="font-semibold text-sm text-muted-foreground tracking-wider uppercase">Output</h2>
                    </div>
                    <div className="flex items-center gap-1">
                        <button onClick={onLoadSamples} className="p-2 text-muted-foreground transition-colors rounded-md hover:bg-muted/50 hover:text-foreground" title="Load Sample Data">
                            <Files className="w-4 h-4" />
                        </button>
                        <button onClick={onClear} className="p-2 text-muted-foreground transition-colors rounded-md hover:bg-muted/50 hover:text-foreground" title="Clear Inputs">
                            <Trash2 className="w-4 h-4" />
                        </button>

                        <div className="w-px h-4 bg-border mx-1" />

                        <button onClick={onImportClick} className="p-2 text-muted-foreground transition-colors rounded-md hover:bg-muted/50 hover:text-foreground" title="Import Session (.json)">
                            <Download className="w-4 h-4" />
                        </button>
                        <button onClick={onExportSession} className="p-2 text-muted-foreground transition-colors rounded-md hover:bg-muted/50 hover:text-foreground" title="Export Session (.json)">
                            <Save className="w-4 h-4" />
                        </button>

                        <div className="w-px h-4 bg-border mx-1" />

                        <button onClick={onDownload} disabled={!output || !!error} className="ml-2 px-3 py-1.5 text-sm font-semibold text-primary-foreground transition-colors bg-primary rounded-md shadow-sm hover:bg-primary/80 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed flex items-center gap-2">
                            <Download className="w-4 h-4" />
                            HTML
                        </button>
                    </div>
                </div>

                <div className="relative flex-grow h-full bg-white">
                    {isTransforming && (
                        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/40 backdrop-blur-[2px] transition-all duration-200">
                            <div className="bg-card p-4 rounded-lg shadow-lg flex flex-col items-center gap-3 border border-border">
                                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                                <span className="text-sm font-medium text-foreground tracking-wide">Transformiere...</span>
                            </div>
                        </div>
                    )}

                    {error ? (
                        <div className="p-4 text-destructive-foreground bg-destructive/20 font-mono text-sm flex items-start gap-3 h-full">
                            <Info className="w-4 h-4 mt-0.5 flex-shrink-0"/>
                            <div>{error}</div>
                        </div>
                    ) : (
                        <iframe
                            srcDoc={output}
                            title="XSLT Output"
                            className="w-full h-full border-none"
                            sandbox="allow-scripts allow-same-origin"
                        />
                    )}
                </div>
            </div>
        </Panel>
    );
}