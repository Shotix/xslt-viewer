import React, { useRef } from "react";
import { Panel } from "react-resizable-panels";
import AceEditor from "react-ace";
import { FileText, Upload } from "lucide-react";

import "ace-builds/src-noconflict/mode-xml";
import "ace-builds/src-noconflict/theme-tomorrow_night";

export interface AceAnnotation {
    row: number;
    column: number;
    text: string;
    type: "error" | "warning" | "info";
}

interface CodeEditorPanelProps {
    title: string;
    value: string;
    onChange: (value: string) => void;
    onFormat: () => void;
    defaultSize?: number;
    acceptFileType?: string;
    annotations?: AceAnnotation[];
}

export function CodeEditorPanel({
                                    title,
                                    value,
                                    onChange,
                                    onFormat,
                                    defaultSize = 33,
                                    acceptFileType = ".xml,.xsl,.xslt",
                                    annotations = []
                                }: CodeEditorPanelProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target?.result as string;
            if (content) onChange(content);
        };
        reader.readAsText(file);

        event.target.value = '';
    };

    return (
        <Panel defaultSize={defaultSize} minSize={20}>
            <div className="flex flex-col h-full bg-card rounded-md overflow-hidden border border-border">
                <div className="flex items-center justify-between p-3 border-b border-border">
                    <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        <h2 className="font-semibold text-sm text-muted-foreground tracking-wider uppercase">{title}</h2>
                    </div>
                    <div className="flex items-center gap-1">
                        <input
                            type="file"
                            accept={acceptFileType}
                            ref={fileInputRef}
                            className="hidden"
                            onChange={handleFileUpload}
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="p-2 text-muted-foreground transition-colors rounded-md hover:bg-muted/50 hover:text-foreground"
                            title="Upload File"
                        >
                            <Upload className="w-4 h-4" />
                        </button>
                        <button
                            onClick={onFormat}
                            className="p-2 text-muted-foreground transition-colors rounded-md hover:bg-muted/50 hover:text-foreground"
                            title="Pretty Print Code"
                        >
                            <FileText className="w-4 h-4" />
                        </button>
                    </div>
                </div>
                <AceEditor
                    mode="xml"
                    theme="tomorrow_night"
                    onChange={onChange}
                    value={value}
                    name={`${title.replace(/\s+/g, '_').toUpperCase()}_EDITOR`}
                    editorProps={{ $blockScrolling: true }}
                    annotations={annotations}
                    setOptions={{
                        enableBasicAutocompletion: true,
                        enableLiveAutocompletion: true,
                        enableSnippets: true,
                        showLineNumbers: true,
                        tabSize: 2,
                        useWorker: true,
                    }}
                    width="100%"
                    height="100%"
                    fontSize={14}
                    showPrintMargin={false}
                    style={{ backgroundColor: 'hsl(var(--card))' }}
                />
            </div>
        </Panel>
    );
}