import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload as UploadIcon, FileSpreadsheet, CheckCircle, AlertCircle, Download, X, ChevronDown, ChevronUp } from 'lucide-react';
import { usePortfolio } from '../context/PortfolioContext';
import { parsePortfolioFile, generateTemplate } from '../utils/fileParser';
import toast from 'react-hot-toast';

export default function Upload() {
  const { state, dispatch } = usePortfolio();
  const { monthlyUploads, members } = state;

  const [parsing, setParsing] = useState(false);
  const [parsed, setParsed] = useState(null);
  const [error, setError] = useState(null);
  const [file, setFile] = useState(null);
  const [confirmModal, setConfirmModal] = useState(false);
  const [expandedUpload, setExpandedUpload] = useState(null);

  const onDrop = useCallback(async (accepted) => {
    const f = accepted[0];
    if (!f) return;
    setFile(f);
    setError(null);
    setParsed(null);
    setParsing(true);
    try {
      const result = await parsePortfolioFile(f);
      setParsed(result);
    } catch (err) {
      setError(err.message || 'Failed to parse file');
      toast.error('Could not parse the file. Make sure it uses the correct format.');
    } finally {
      setParsing(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv'],
    },
    maxFiles: 1,
  });

  const handleImport = () => {
    if (!parsed) return;
    const existing = monthlyUploads.find((u) => u.date === parsed.uploadDate);
    if (existing) {
      setConfirmModal(true);
    } else {
      doImport(false);
    }
  };

  const doImport = (overwrite) => {
    setConfirmModal(false);

    // Map contribution member names to IDs
    const mappedContribs = parsed.contributions.map((c) => {
      const member = members.find((m) => m.name.toLowerCase() === (c.memberName || '').toLowerCase());
      return {
        ...c,
        memberId: member?.id || null,
        type: 'contribution',
        uploadDate: parsed.uploadDate,
      };
    }).filter((c) => c.memberId);

    const allEntries = [
      ...parsed.stocks,
      ...parsed.realEstate,
      ...parsed.business,
      ...mappedContribs,
    ];

    dispatch({
      type: 'APPEND_MONTHLY_DATA',
      payload: {
        uploadDate: parsed.uploadDate,
        entries: allEntries,
        overwrite,
      },
    });

    toast.success(`✓ Imported data for ${parsed.uploadDate}`);
    setParsed(null);
    setFile(null);
  };

  const clearFile = () => { setFile(null); setParsed(null); setError(null); };

  return (
    <div className="page-enter p-4 md:p-6 space-y-6">
      {/* Info banner */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
        <h3 className="text-blue-400 font-semibold text-sm mb-1">Monthly Data Upload</h3>
        <p className="text-slate-400 text-sm leading-relaxed">
          Upload an Excel file each month containing your deposits, stock purchases, real estate, and business investments.
          The system will append the new data and recalculate all ownership percentages automatically.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Drop zone */}
        <div className="space-y-4">
          <div
            {...getRootProps()}
            className={[
              'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all',
          'border-slate-700/60',
              isDragActive
                ? 'border-indigo-500 bg-indigo-500/10'
                : 'hover:border-indigo-500/40',
            ].join(' ')}
          >
            <input {...getInputProps()} />
            <UploadIcon className="w-10 h-10 text-slate-500 mx-auto mb-3" />
            {isDragActive ? (
              <p className="text-blue-400 font-medium">Drop the file here…</p>
            ) : (
              <>
                <p className="text-slate-300 font-medium mb-1">Drag & drop your Excel / CSV file</p>
                <p className="text-slate-500 text-sm">or click to browse</p>
                <p className="text-slate-600 text-xs mt-3">Supports .xlsx, .xls, .csv</p>
              </>
            )}
          </div>

          {/* Template download */}
          <button
            onClick={generateTemplate}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-slate-400 hover:text-slate-200 text-sm transition-colors"
            style={{ border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}
          >
            <Download className="w-4 h-4" />
            Download Template (.xlsx)
          </button>
        </div>

        {/* Preview panel */}
        <div className="card overflow-hidden">
          <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <h3 className="text-white font-semibold text-sm">File Preview</h3>
            {file && (
              <button onClick={clearFile} className="p-1 text-slate-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="p-5">
            {parsing && (
              <div className="flex items-center gap-3 text-slate-400 py-8 justify-center">
                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                Parsing file…
              </div>
            )}

            {error && !parsing && (
              <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-red-400 font-medium text-sm">Parse Error</p>
                  <p className="text-red-400/70 text-xs mt-0.5">{error}</p>
                </div>
              </div>
            )}

            {!file && !parsing && !error && (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <FileSpreadsheet className="w-10 h-10 text-slate-600 mb-3" />
                <p className="text-slate-500 text-sm">Upload a file to preview its contents</p>
              </div>
            )}

            {parsed && !parsing && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                  <p className="text-emerald-400 font-medium text-sm">File parsed successfully</p>
                </div>

                <div className="bg-slate-700/40 rounded-lg p-4 space-y-2">
                  <p className="text-slate-400 text-xs uppercase tracking-wider mb-3">Upload Period: <span className="text-white font-bold">{parsed.uploadDate}</span></p>
                  {[
                    { label: 'Stock Positions', count: parsed.stocks.length, color: 'text-blue-400' },
                    { label: 'Properties', count: parsed.realEstate.length, color: 'text-purple-400' },
                    { label: 'Businesses', count: parsed.business.length, color: 'text-emerald-400' },
                    { label: 'Contributions', count: parsed.contributions.length, color: 'text-amber-400' },
                  ].map(({ label, count, color }) => (
                    <div key={label} className="flex items-center justify-between">
                      <span className="text-slate-400 text-sm">{label}</span>
                      <span className={`font-bold text-sm ${count > 0 ? color : 'text-slate-600'}`}>{count}</span>
                    </div>
                  ))}
                </div>

                {parsed.contributions.length > 0 && (
                  <div className="bg-slate-700/40 rounded-lg p-3">
                    <p className="text-slate-400 text-xs uppercase tracking-wider mb-2">Member Match Check</p>
                    {parsed.contributions.map((c, i) => {
                      const matched = members.find((m) => m.name.toLowerCase() === (c.memberName || '').toLowerCase());
                      return (
                        <div key={i} className="flex items-center justify-between text-xs py-0.5">
                          <span className="text-slate-300">{c.memberName}</span>
                          {matched ? (
                            <span className="text-emerald-400 flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" /> Matched
                            </span>
                          ) : (
                            <span className="text-amber-400">Not found — add member first</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                <button
                  onClick={handleImport}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-white font-medium text-sm"
                >
                  Import Data
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Upload history */}
      {monthlyUploads.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <h3 className="text-white font-semibold text-sm">Upload History</h3>
          </div>
          <div>
            {[...monthlyUploads].sort((a, b) => b.date > a.date ? 1 : -1).map((u) => (
              <div key={u.date} style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                <button
                  className="w-full flex items-center justify-between px-5 py-3 hover:bg-white/[0.03] text-left transition-colors"
                  onClick={() => setExpandedUpload(expandedUpload === u.date ? null : u.date)}
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                      <p className="text-white text-sm font-medium">{u.date}</p>
                      <p className="text-slate-500 text-xs">Uploaded {new Date(u.uploadedAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  {expandedUpload === u.date ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                </button>
                {expandedUpload === u.date && u.entries?.length > 0 && (
                  <div className="px-5 pb-3">
                    <p className="text-slate-500 text-xs">{u.entries.length} entries in this upload</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Confirm overwrite modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setConfirmModal(false)} />
          <div
            className="relative rounded-2xl p-6 max-w-md w-full shadow-2xl"
            style={{ background: 'linear-gradient(145deg, #0d1a30, #080e20)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-8 h-8 text-amber-400 shrink-0" />
              <div>
                <h3 className="text-white font-semibold">Duplicate Upload Date</h3>
                <p className="text-slate-400 text-sm">Data for <strong className="text-white">{parsed?.uploadDate}</strong> already exists.</p>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setConfirmModal(false)} className="flex-1 px-4 py-2 bg-slate-700 rounded-lg text-slate-300 text-sm">
                Cancel
              </button>
              <button onClick={() => doImport(false)} className="flex-1 px-4 py-2 bg-slate-600 rounded-lg text-white text-sm">
                Skip (keep existing)
              </button>
              <button onClick={() => doImport(true)} className="flex-1 px-4 py-2 bg-amber-600 hover:bg-amber-500 rounded-lg text-white text-sm font-medium">
                Overwrite
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
