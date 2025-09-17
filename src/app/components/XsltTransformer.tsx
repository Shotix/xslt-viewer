// components/XsltTransformer.tsx
"use client";

import React, { useState, useEffect } from "react";
import AceEditor from "react-ace";
import { useDebouncedCallback } from "use-debounce";
import {
    Panel,
    PanelGroup,
    PanelResizeHandle,
} from "react-resizable-panels";
import { Download, FileText, Settings, Trash2, Files, Info } from "lucide-react";

// Import Ace editor modes and themes
import "ace-builds/src-noconflict/mode-xml";
import "ace-builds/src-noconflict/theme-tomorrow_night";

// Sample Data
const sampleXML = `<?xml version="1.0" encoding="UTF-8"?>
<catalog>
  <book id="bk101">
    <author>Gambardella, Matthew</author>
    <title>XML Developer's Guide</title>
    <genre>Computer</genre>
    <price>44.95</price>
    <publish_date>2000-10-01</publish_date>
    <description>An in-depth look at creating applications with XML.</description>
  </book>
  <book id="bk102">
    <author>Ralls, Kim</author>
    <title>Midnight Rain</title>
    <genre>Fantasy</genre>
    <price>5.95</price>
    <publish_date>2000-12-16</publish_date>
    <description>A former architect battles corporate zombies.</description>
  </book>
</catalog>
`;

const sampleXSLT = `<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
<xsl:template match="/">
  <html>
  <head>
    <style>
      body { font-family: sans-serif; margin: 2rem; background-color: #ffffff; color: #111827; }
      h1 { color: #005b96; }
      table { width: 100%; border-collapse: collapse; }
      th, td { padding: 0.5rem 0.75rem; border: 1px solid #d1d5db; text-align: left; }
      th { background-color: #0072bc; color: white; }
      tr:nth-child(even) { background-color: #f3f4f6; }
    </style>
  </head>
  <body>
    <h1>Book Catalog</h1>
    <table>
      <tr>
        <th>Author</th>
        <th>Title</th>
        <th>Genre</th>
        <th>Price</th>
      </tr>
      <xsl:for-each select="catalog/book">
      <tr>
        <td><xsl:value-of select="author"/></td>
        <td><xsl:value-of select="title"/></td>
        <td><xsl:value-of select="genre"/></td>
        <td>$<xsl:value-of select="price"/></td>
      </tr>
      </xsl:for-each>
    </table>
  </body>
  </html>
</xsl:template>
</xsl:stylesheet>
`;

// Custom hook for persisting state to localStorage (unchanged)
function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
    const [storedValue, setStoredValue] = useState<T>(() => {
        if (typeof window === "undefined") {
            return initialValue;
        }
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.error(error);
            return initialValue;
        }
    });

    const setValue = (value: T) => {
        try {
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            setStoredValue(valueToStore);
            if (typeof window !== "undefined") {
                window.localStorage.setItem(key, JSON.stringify(valueToStore));
            }
        } catch (error) {
            console.error(error);
        }
    };

    return [storedValue, setValue];
}


export function XsltTransformer() {
    const [xmlCode, setXmlCode] = useLocalStorage<string>("xmlCode", sampleXML);
    const [xsltCode, setXsltCode] = useLocalStorage<string>("xsltCode", sampleXSLT);
    const [output, setOutput] = useState<string>("");
    const [error, setError] = useState<string | null>(null);

    const performTransformation = useDebouncedCallback(() => {
        if (!xmlCode || !xsltCode) {
            setOutput("");
            setError(null);
            return;
        }

        try {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlCode, "application/xml");
            const xsltDoc = parser.parseFromString(xsltCode, "application/xml");

            // Check for parsing errors
            if (xmlDoc.getElementsByTagName("parsererror").length > 0) {
                throw new Error("Invalid XML: " + xmlDoc.getElementsByTagName("parsererror")[0].textContent);
            }
            if (xsltDoc.getElementsByTagName("parsererror").length > 0) {
                throw new Error("Invalid XSLT: " + xsltDoc.getElementsByTagName("parsererror")[0].textContent);
            }

            const processor = new XSLTProcessor();
            processor.importStylesheet(xsltDoc);
            const resultDoc = processor.transformToDocument(xmlDoc);

            if (!resultDoc) {
                throw new Error("Transformation failed. The result document is null. Check XSLT for errors.");
            }

            const serializer = new XMLSerializer();
            const resultString = serializer.serializeToString(resultDoc);

            setOutput(resultString);
            setError(null);
        } catch (e: unknown) {
            // @ts-expect-error unknown
            setError(`Transformation Error: ${e.message}`);
            setOutput("");
        }
    }, 300);

    useEffect(() => {
        performTransformation();
    }, [xmlCode, xsltCode, performTransformation]);

    const handleDownload = () => {
        const blob = new Blob([output], { type: "text/html" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "output.html";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleClear = () => {
        setXmlCode("");
        setXsltCode("");
    }

    const handleLoadSamples = () => {
        setXmlCode(sampleXML);
        setXsltCode(sampleXSLT);
    }

    const editorOptions = {
        enableBasicAutocompletion: true,
        enableLiveAutocompletion: true,
        enableSnippets: true,
        showLineNumbers: true,
        tabSize: 2,
    };

    const PanelHeader = ({ title, icon }: { title: string, icon: React.ReactNode }) => (
        <div className="flex items-center gap-2 p-3 border-b border-border">
            {icon}
            <h2 className="font-semibold text-sm text-muted-foreground tracking-wider uppercase">{title}</h2>
        </div>
    );

    const ActionButton = ({ onClick, title, children }: { onClick: () => void, title: string, children: React.ReactNode }) => (
        <button
            onClick={onClick}
            className="p-2 text-muted-foreground transition-colors rounded-md hover:bg-muted/50 hover:text-foreground"
            title={title}
        >
            {children}
        </button>
    );

    return (
        <PanelGroup direction="horizontal" className="p-4 gap-4 h-[calc(100vh-65px)]">
            {/* XML Panel */}
            <Panel defaultSize={33} minSize={20}>
                <div className="flex flex-col h-full bg-card rounded-md overflow-hidden border border-border">
                    <PanelHeader title="XML Source" icon={<FileText className="w-4 h-4 text-muted-foreground" />} />
                    <AceEditor
                        mode="xml"
                        theme="tomorrow_night"
                        onChange={setXmlCode}
                        value={xmlCode}
                        name="XML_EDITOR"
                        editorProps={{ $blockScrolling: true }}
                        setOptions={editorOptions}
                        width="100%"
                        height="100%"
                        fontSize={14}
                        showPrintMargin={false}
                        style={{ backgroundColor: 'hsl(var(--card))' }}
                    />
                </div>
            </Panel>
            <PanelResizeHandle className="panel-handle" />

            {/* XSLT Panel */}
            <Panel defaultSize={33} minSize={20}>
                <div className="flex flex-col h-full bg-card rounded-md overflow-hidden border border-border">
                    <PanelHeader title="XSLT Template" icon={<Settings className="w-4 h-4 text-muted-foreground" />} />
                    <AceEditor
                        mode="xml"
                        theme="tomorrow_night"
                        onChange={setXsltCode}
                        value={xsltCode}
                        name="XSLT_EDITOR"
                        editorProps={{ $blockScrolling: true }}
                        setOptions={editorOptions}
                        width="100%"
                        height="100%"
                        fontSize={14}
                        showPrintMargin={false}
                        style={{ backgroundColor: 'hsl(var(--card))' }}
                    />
                </div>
            </Panel>
            <PanelResizeHandle className="panel-handle" />

            {/* Output Panel */}
            <Panel minSize={20}>
                <div className="flex flex-col h-full bg-card rounded-md overflow-hidden border border-border">
                    <div className="flex items-center justify-between p-2 pl-3 border-b border-border">
                        <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-muted-foreground" />
                            <h2 className="font-semibold text-sm text-muted-foreground tracking-wider uppercase">Output</h2>
                        </div>
                        <div className="flex items-center gap-1">
                            <ActionButton onClick={handleLoadSamples} title="Load Sample Data">
                                <Files className="w-4 h-4" />
                            </ActionButton>
                            <ActionButton onClick={handleClear} title="Clear Inputs">
                                <Trash2 className="w-4 h-4" />
                            </ActionButton>
                            <button
                                onClick={handleDownload}
                                disabled={!output || !!error}
                                className="ml-2 px-3 py-1.5 text-sm font-semibold text-primary-foreground transition-colors bg-primary rounded-md shadow-sm hover:bg-primary/80 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                <Download className="w-4 h-4" />
                                Download
                            </button>
                        </div>
                    </div>
                    {error ? (
                        <div className="p-4 text-destructive-foreground bg-destructive/20 font-mono text-sm flex items-start gap-3">
                            <Info className="w-4 h-4 mt-0.5 flex-shrink-0"/>
                            <div>{error}</div>
                        </div>
                    ) : (
                        <iframe
                            srcDoc={output}
                            title="XSLT Output"
                            className="w-full h-full bg-white"
                            sandbox="allow-scripts allow-same-origin"
                        />
                    )}
                </div>
            </Panel>
        </PanelGroup>
    );
}