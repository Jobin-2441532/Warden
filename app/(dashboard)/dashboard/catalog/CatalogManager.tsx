"use client";

import { useState } from "react";
import Papa from "papaparse";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { processCatalog } from "./actions";

export function CatalogManager({ initialCatalog, merchantId }: { initialCatalog: any, merchantId: string }) {
  const [catalog, setCatalog] = useState(initialCatalog);
  const [rawPreview, setRawPreview] = useState<any[] | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const structuredData = catalog?.structured_json || [];
  const needsReviewCount = structuredData.filter((i: any) => i._needsReview).length;
  const cleanCount = structuredData.length - needsReviewCount;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type === "application/json" || file.name.endsWith(".json")) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const json = JSON.parse(event.target?.result as string);
          const data = Array.isArray(json) ? json : [json];
          setRawPreview(data);
          handleProcess(data, "JSON");
        } catch (err) {
          alert("Invalid JSON file");
        }
      };
      reader.readAsText(file);
    } else {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          setRawPreview(results.data);
          handleProcess(results.data, "CSV");
        }
      });
    }
  };

  const handleProcess = async (data: any[], sourceType: string) => {
    setIsProcessing(true);
    try {
      const result = await processCatalog(merchantId, data, sourceType);
      if (result.success) {
        setCatalog(result.data);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Upload & Summary Banner */}
      <Card className="bg-background-alt border-muted/20">
        <CardContent className="flex flex-col md:flex-row items-center justify-between p-6 gap-4">
          <div>
            {structuredData.length > 0 ? (
              <div className="space-y-2">
                <h3 className="font-serif text-xl tracking-tight">Catalog Summary</h3>
                <div className="flex gap-2 items-center">
                  <Badge variant="approved">{cleanCount} Fully Structured</Badge>
                  {needsReviewCount > 0 && <Badge variant="denied">{needsReviewCount} Need Review</Badge>}
                  <span className="text-muted text-sm ml-2">Total: {structuredData.length} products</span>
                </div>
              </div>
            ) : (
              <h3 className="font-serif text-xl tracking-tight">No Catalog Uploaded</h3>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            <label className="cursor-pointer">
              <input type="file" accept=".csv,.json" className="hidden" onChange={handleFileUpload} disabled={isProcessing} />
              <div className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-xs uppercase tracking-wide font-medium transition-colors focus-visible:outline-none bg-accent text-foreground hover:bg-accent/90 shadow-sm h-9 px-4 py-2">
                {isProcessing ? "Processing..." : "Upload New CSV/JSON"}
              </div>
            </label>
            {catalog && (
              <Button variant="outline" onClick={() => handleProcess(structuredData, catalog.raw_source_type)} disabled={isProcessing}>
                Re-sync Catalog
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Before / After Split View */}
      {(rawPreview || structuredData.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Left: Raw Data */}
          <Card className="bg-background-alt border-muted/20">
            <CardHeader>
              <CardTitle>Raw Input (Messy)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[600px] overflow-auto bg-background p-4 rounded border border-muted/20 font-mono text-xs whitespace-pre">
                {rawPreview 
                  ? JSON.stringify(rawPreview, null, 2)
                  : "Upload a file to see raw preview."}
              </div>
            </CardContent>
          </Card>

          {/* Right: Structured Data */}
          <Card className="bg-background-alt border-muted/20">
            <CardHeader>
              <CardTitle>Structured Output (Clean)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[600px] overflow-auto bg-background p-4 rounded border border-muted/20 space-y-4">
                {structuredData.length > 0 ? (
                  structuredData.map((item: any, i: number) => (
                    <div key={i} className={`p-4 border rounded ${item._needsReview ? 'border-danger/50 bg-danger/5' : 'border-accent/50 bg-accent/5'}`}>
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold">{item.name}</h4>
                        {item._needsReview ? (
                          <Badge variant="denied">Needs Review</Badge>
                        ) : (
                          <Badge variant="approved">Clean</Badge>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div><span className="text-muted">Price:</span> {item.price_inr} {item.currency}</div>
                        <div><span className="text-muted">Category:</span> {item.category}</div>
                        <div><span className="text-muted">Stock:</span> {item.in_stock ? 'Yes' : 'No'} ({item.stock_quantity})</div>
                        <div><span className="text-muted">Returns:</span> {item.policy?.returns}</div>
                      </div>
                      {item._needsReview && (
                        <p className="text-xs text-danger mt-2">Missing critical fields (Name, Category, or Valid Price).</p>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-muted text-sm font-mono">Structured output will appear here.</p>
                )}
              </div>
            </CardContent>
          </Card>

        </div>
      )}
    </div>
  );
}
