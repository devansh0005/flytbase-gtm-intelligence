"use client";

import { useState } from "react";
import { FileText, Eye, X } from "lucide-react";

interface DocumentItem {
  id: string;
  fileName: string;
  title: string;
  type: string;
  date?: string | null;
  rawContent?: string | null;
}

export function DocumentViewerList({ documents }: { documents: DocumentItem[] }) {
  const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(null);

  return (
    <div>
      <div className="divide-y divide-border/60">
        {documents.map((doc) => (
          <div
            key={doc.id}
            className="py-2.5 px-3 flex items-center justify-between hover:bg-secondary/30 rounded transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-secondary text-zinc-400 rounded border border-border">
                <FileText className="w-3.5 h-3.5 text-zinc-400" />
              </div>
              <div>
                <div className="text-xs font-semibold text-white">{doc.title}</div>
                <div className="flex items-center gap-2 text-[11px] text-zinc-400 mt-0.5 font-mono">
                  <span>{doc.fileName}</span>
                  <span>•</span>
                  <span className="capitalize px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-300 text-[10px]">
                    {doc.type}
                  </span>
                  {doc.date && (
                    <>
                      <span>•</span>
                      <span>{doc.date}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={() => setSelectedDoc(doc)}
              className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded border border-border bg-secondary hover:bg-zinc-800 text-zinc-200 hover:text-white transition-colors font-mono"
            >
              <Eye className="w-3 h-3 text-zinc-400" />
              <span>Inspect</span>
            </button>
          </div>
        ))}
      </div>

      {/* Document Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-lg w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-secondary/40">
              <div>
                <h3 className="font-semibold text-sm text-white">{selectedDoc.title}</h3>
                <p className="text-xs font-mono text-zinc-400">{selectedDoc.fileName}</p>
              </div>
              <button
                onClick={() => setSelectedDoc(null)}
                className="p-1 rounded hover:bg-secondary text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 overflow-y-auto font-mono text-xs whitespace-pre-wrap leading-relaxed text-zinc-300 bg-background/80">
              {selectedDoc.rawContent || "No raw content loaded for this document."}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
