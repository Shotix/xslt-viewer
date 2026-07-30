"use client";

import React, { useState, useEffect, useRef } from "react";
import { useDebouncedCallback } from "use-debounce";
import { PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import xmlFormat from "xml-formatter";

import { useLocalStorage } from "@/app/hooks/useLocalStorage";
import {AceAnnotation, CodeEditorPanel} from "./CodeEditorPanel";
import { OutputPanel } from "./OutputPanel";

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

function extractErrorAnnotation(errorMessage: string): AceAnnotation {
    let row = 0;
    let column = 0;

    const lineMatch = errorMessage.match(/(?:line|zeile)\s*(\d+)/i);
    if (lineMatch && lineMatch[1]) {
        row = Math.max(0, parseInt(lineMatch[1], 10) - 1);
    }

    const columnMatch = errorMessage.match(/(?:column|spalte)\s*(\d+)/i);
    if (columnMatch && columnMatch[1]) {
        column = Math.max(0, parseInt(columnMatch[1], 10) - 1);
    }

    return {
        row,
        column,
        text: errorMessage.split('\n')[0].replace(/<[^>]+>/g, ''),
        type: "error"
    };
}

export function XsltTransformer() {
    const [xmlCode, setXmlCode] = useLocalStorage<string>("xmlCode", sampleXML);
    const [xsltCode, setXsltCode] = useLocalStorage<string>("xsltCode", sampleXSLT);
    const [output, setOutput] = useState<string>("");
    const [error, setError] = useState<string | null>(null);
    const [xmlAnnotations, setXmlAnnotations] = useState<AceAnnotation[]>([]);
    const [xsltAnnotations, setXsltAnnotations] = useState<AceAnnotation[]>([]);
    const [isTransforming, setIsTransforming] = useState<boolean>(false);

    const handleXmlChange = (val: string) => {
        setIsTransforming(true);
        setXmlCode(val);
    };

    const handleXsltChange = (val: string) => {
        setIsTransforming(true);
        setXsltCode(val);
    };

    const sessionInputRef = useRef<HTMLInputElement>(null);

    const performTransformation = useDebouncedCallback(() => {
        if (!xmlCode || !xsltCode) {
            setOutput("");
            setError(null);
            setXmlAnnotations([]);
            setXsltAnnotations([]);
            setIsTransforming(false);
            return;
        }

        try {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlCode, "application/xml");
            const xsltDoc = parser.parseFromString(xsltCode, "application/xml");

            const xmlErrors = xmlDoc.getElementsByTagName("parsererror");
            if (xmlErrors.length > 0) {
                const errorMsg = xmlErrors[0].textContent || "Unbekannter XML Fehler";
                setXmlAnnotations([extractErrorAnnotation(errorMsg)]);
                setXsltAnnotations([]);
                throw new Error("Invalid XML: " + errorMsg);
            }

            const xsltErrors = xsltDoc.getElementsByTagName("parsererror");
            if (xsltErrors.length > 0) {
                const errorMsg = xsltErrors[0].textContent || "Unbekannter XSLT Fehler";
                setXsltAnnotations([extractErrorAnnotation(errorMsg)]);
                setXmlAnnotations([]);
                throw new Error("Invalid XSLT: " + errorMsg);
            }

            const processor = new XSLTProcessor();
            processor.importStylesheet(xsltDoc);
            const resultDoc = processor.transformToDocument(xmlDoc);

            if (!resultDoc) {
                throw new Error("Transformation failed. The result document is null.");
            }

            const serializer = new XMLSerializer();
            const resultString = serializer.serializeToString(resultDoc);

            setOutput(resultString);
            setError(null);
            setXmlAnnotations([]);
            setXsltAnnotations([]);

        } catch (e: unknown) {
            // @ts-expect-error unknown
            setError(`Transformation Error: ${e.message}`);
            setOutput("");
        } finally {
            setIsTransforming(false);
        }
    }, 300);

    useEffect(() => {
        performTransformation();
    }, [xmlCode, xsltCode, performTransformation]);

    const handleExportSession = () => {
        const sessionData = {
            version: "1.0",
            timestamp: new Date().toISOString(),
            xml: xmlCode,
            xslt: xsltCode
        };

        const blob = new Blob([JSON.stringify(sessionData, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `xslt-session-${new Date().getTime()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleImportSession = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target?.result as string;
                const data = JSON.parse(content);

                if (data.xml !== undefined && data.xslt !== undefined) {
                    handleXmlChange(data.xml);
                    handleXsltChange(data.xslt);
                } else {
                    setError("Fehler: Die importierte JSON-Datei enthält nicht die erwartete Session-Struktur.");
                }
            } catch (err) {
                console.error(err);
                setError("Fehler: Die Datei konnte nicht als gültiges JSON gelesen werden.");
            }
        };
        reader.readAsText(file);

        // Input zurücksetzen
        event.target.value = '';
    };

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
        setIsTransforming(true);
        setXsltCode("");
    };

    const handleLoadSamples = () => {
        setXmlCode(sampleXML);
        setIsTransforming(true);
        setXsltCode(sampleXSLT);
    };

    const handlePrettyPrintXML = () => {
        if (!xmlCode) return;
        try {
            const formattedXml = xmlFormat(xmlCode, {
                indentation: '  ',
                collapseContent: true,
                lineSeparator: '\n'
            });
            setXmlCode(formattedXml);
            setError(null);
        } catch (e: unknown) {
            // @ts-expect-error unknown
            setError(`XML Formatierungsfehler: Das XML scheint nicht valide zu sein. (${e.message})`);
        }
    };

    const handlePrettyPrintXSLT = () => {
        if (!xsltCode) return;
        try {
            const formattedXslt = xmlFormat(xsltCode, {
                indentation: '  ',
                collapseContent: true,
                lineSeparator: '\n'
            });
            setXsltCode(formattedXslt);
            setError(null);
        } catch (e: unknown) {
            // @ts-expect-error unknown
            setError(`XSLT Formatierungsfehler: Das XSLT scheint nicht valide zu sein. (${e.message})`);
        }
    };

    return (
        <>
            <input
                type="file"
                accept=".json"
                ref={sessionInputRef}
                className="hidden"
                onChange={handleImportSession}
            />

        <PanelGroup direction="horizontal" className="p-4 gap-4 h-[calc(100vh-65px)]">
            <CodeEditorPanel
                title="XML Source"
                value={xmlCode}
                onChange={handleXmlChange}
                onFormat={handlePrettyPrintXML}
                acceptFileType=".xml"
                annotations={xmlAnnotations}
            />

            <PanelResizeHandle className="panel-handle" />

            <CodeEditorPanel
                title="XSLT Template"
                value={xsltCode}
                onChange={handleXsltChange}
                onFormat={handlePrettyPrintXSLT}
                acceptFileType=".xsl,.xslt"
                annotations={xsltAnnotations}
            />

            <PanelResizeHandle className="panel-handle" />

            <OutputPanel
                output={output}
                error={error}
                isTransforming={isTransforming}
                onDownload={handleDownload}
                onClear={handleClear}
                onLoadSamples={handleLoadSamples}
                onExportSession={handleExportSession}
                onImportClick={() => sessionInputRef.current?.click()}
            />
        </PanelGroup>
        </>
    );
}