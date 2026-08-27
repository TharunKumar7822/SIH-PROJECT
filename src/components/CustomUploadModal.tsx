import React, { useState } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertTriangle, X } from 'lucide-react';
import { parseCsvDataset } from '../data/rawDataset';
import { RawComponentRecord } from '../types';

interface CustomUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDatasetLoaded: (records: RawComponentRecord[]) => void;
}

export const CustomUploadModal: React.FC<CustomUploadModalProps> = ({
  isOpen,
  onClose,
  onDatasetLoaded
}) => {
  const [dragOver, setDragOver] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [previewCount, setPreviewCount] = useState<number | null>(null);

  if (!isOpen) return null;

  const handleFileProcess = (file: File) => {
    if (!file.name.endsWith('.csv')) {
      setErrorMsg('Please upload a valid .csv file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const records = parseCsvDataset(text);
        if (records.length === 0) {
          setErrorMsg('CSV file is empty or missing required columns (Component_ID, Lot_ID, Value_0h, Value_24h, Value_96h, Value_168h).');
          return;
        }

        setErrorMsg(null);
        setPreviewCount(records.length);
        onDatasetLoaded(records);
        onClose();
      } catch (err) {
        setErrorMsg('Failed to parse CSV dataset. Please check file format.');
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4 text-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-base text-slate-900">
              Upload Custom Screening Dataset
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-500 leading-relaxed">
          Upload telemetry CSV records containing burn-in hours: <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800 border border-slate-200">Component_ID, Lot_ID, Value_0h, Value_24h, Value_96h, Value_168h, Label</code>. Negative measurements and tester offsets are preserved per aerospace domain specifications.
        </p>

        {/* Drop Zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
            dragOver
              ? 'border-blue-500 bg-blue-50/50'
              : 'border-slate-300 hover:border-slate-400 bg-slate-50/50'
          }`}
        >
          <UploadCloud className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <p className="text-xs font-semibold text-slate-800 mb-1">
            Drag and drop your CSV dataset here
          </p>
          <p className="text-[11px] text-slate-500 mb-4">
            Supports standardized screening formats up to 50,000 units
          </p>

          <label className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-md cursor-pointer transition-colors shadow-sm inline-block">
            Browse File
            <input
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileProcess(e.target.files[0]);
                }
              }}
            />
          </label>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-md transition-colors cursor-pointer border border-slate-200"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
