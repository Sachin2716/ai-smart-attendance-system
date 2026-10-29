'use client';

import React, { useState } from 'react';
import { useAttendance } from '@/context/AttendanceContext';
import { CourseClass, Semester, Section, ExcelImportPreview } from '@/types';
import { parseExcelStudentFile, downloadSampleStudentExcelTemplate } from '@/utils/excelImporter';
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, X, Download, ShieldCheck, ArrowRight, Cpu } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({ isOpen, onClose }) => {
  const { students, importStudentsFromExcel } = useAttendance();

  const [selectedCourse, setSelectedCourse] = useState<CourseClass>('BCA AIML');
  const [selectedSem, setSelectedSem] = useState<Semester>(3);
  const [selectedSec, setSelectedSec] = useState<Section>('B');

  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<ExcelImportPreview | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importSuccessMsg, setImportSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setIsProcessing(true);
    setImportSuccessMsg(null);

    try {
      const preview = await parseExcelStudentFile(
        uploadedFile,
        selectedCourse,
        selectedSem,
        selectedSec,
        students
      );
      setPreviewData(preview);
    } catch (err) {
      console.error('Failed to parse Excel file:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExecuteImport = () => {
    if (!previewData) return;

    const validRows = previewData.rows.filter(r => r.isValid);
    if (validRows.length === 0) return;

    importStudentsFromExcel(validRows);
    setImportSuccessMsg(`${validRows.length} students imported successfully into ${selectedCourse} Sem ${selectedSem} Sec ${selectedSec}!`);

    setTimeout(() => {
      setImportSuccessMsg(null);
      setPreviewData(null);
      setFile(null);
      onClose();
    }, 2000);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="relative w-full max-w-3xl p-6 rounded-3xl glass-panel border border-indigo-500/40 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all z-10"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 border-b border-slate-800 pb-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 rounded-2xl bg-emerald-600/10 text-emerald-400 border border-emerald-500/30">
                <FileSpreadsheet className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-white">
                  Import Student Roster from BCAAIMLB Excel (.xlsx / .csv)
                </h2>
                <p className="text-xs text-slate-400">
                  Supports Sl No, UUCMS No, Student Name, Class, Section, Card UID (e.g. A7:B2:91:4C)
                </p>
              </div>
            </div>

            <button
              onClick={downloadSampleStudentExcelTemplate}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-emerald-400 font-bold text-xs flex items-center space-x-1.5 whitespace-nowrap"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Download Excel Template</span>
            </button>
          </div>

          {/* Step 1: Target Selection */}
          <div className="grid grid-cols-3 gap-3 p-3 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs mb-4">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Target Class / Course</label>
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value as CourseClass)}
                className="w-full px-3 py-2 rounded-xl glass-input text-slate-200 bg-slate-900"
              >
                <option value="BCA AIML">BCA AIML</option>
                <option value="B.Tech CSE">B.Tech CSE</option>
                <option value="B.Tech ECE">B.Tech ECE</option>
                <option value="B.Tech ME">B.Tech ME</option>
                <option value="B.Sc Data Science">B.Sc Data Science</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Semester</label>
              <select
                value={selectedSem}
                onChange={(e) => setSelectedSem(Number(e.target.value) as Semester)}
                className="w-full px-3 py-2 rounded-xl glass-input text-slate-200 bg-slate-900"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                  <option key={s} value={s}>Semester {s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Section</label>
              <select
                value={selectedSec}
                onChange={(e) => setSelectedSec(e.target.value as Section)}
                className="w-full px-3 py-2 rounded-xl glass-input text-slate-200 bg-slate-900"
              >
                {['A', 'B', 'C', 'D'].map(s => (
                  <option key={s} value={s}>Section {s}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Step 2: Upload Dropzone */}
          <div className="border-2 border-dashed border-indigo-500/40 rounded-2xl p-6 text-center bg-slate-900/40 hover:bg-slate-900/70 transition-all relative">
            <input
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={handleFileChange}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
            <Upload className="w-8 h-8 text-indigo-400 mx-auto mb-2 animate-pulse" />
            <p className="text-xs font-bold text-white">Click or Drag BCAAIMLB Excel File to Upload</p>
            <p className="text-[10px] text-slate-400 mt-1">
              Auto-detects UUCMS No, Student Name, Class, Section, Card UID (A7:B2:91:4C).
            </p>
          </div>

          {/* Import Success Banner */}
          {importSuccessMsg && (
            <div className="mt-4 p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold text-xs flex items-center justify-center space-x-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span>{importSuccessMsg}</span>
            </div>
          )}

          {/* Step 3: Pre-Import Preview Table */}
          {previewData && !importSuccessMsg && (
            <div className="mt-5 space-y-4">
              
              {/* Validation Summary Metrics Cards */}
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                  <p className="text-[10px] text-slate-400 font-bold">Total Rows</p>
                  <p className="text-lg font-bold font-mono text-white mt-0.5">{previewData.totalRows}</p>
                </div>

                <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40">
                  <p className="text-[10px] text-emerald-400 font-bold">Valid Students</p>
                  <p className="text-lg font-bold font-mono text-emerald-300 mt-0.5">{previewData.validRowsCount}</p>
                </div>

                <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/40">
                  <p className="text-[10px] text-amber-400 font-bold">Duplicates</p>
                  <p className="text-lg font-bold font-mono text-amber-300 mt-0.5">{previewData.duplicateCount}</p>
                </div>

                <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-500/40">
                  <p className="text-[10px] text-rose-400 font-bold">Invalid Rows</p>
                  <p className="text-lg font-bold font-mono text-rose-300 mt-0.5">{previewData.invalidCount}</p>
                </div>
              </div>

              {/* Preview Table */}
              <div className="rounded-2xl border border-slate-800 overflow-hidden max-h-48 overflow-y-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-900 font-bold text-[10px] uppercase text-slate-400">
                    <tr>
                      <th className="p-2.5">Student Name</th>
                      <th className="p-2.5">UUCMS Register No</th>
                      <th className="p-2.5">Card UID</th>
                      <th className="p-2.5">Class & Sec</th>
                      <th className="p-2.5 text-right">Validation Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {previewData.rows.map((row, idx) => (
                      <tr key={idx} className={row.isValid ? 'hover:bg-slate-900/40' : 'bg-rose-950/20'}>
                        <td className="p-2.5 font-bold text-white">{row.name}</td>
                        <td className="p-2.5 font-mono text-indigo-300">{row.uucmsNo}</td>
                        <td className="p-2.5 font-mono text-emerald-400">{row.cardUid}</td>
                        <td className="p-2.5">{row.course} (Sec {row.section})</td>
                        <td className="p-2.5 text-right">
                          {row.isValid ? (
                            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                              VALID ✓
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[10px] font-bold">
                              {row.validationError || 'INVALID'}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Action */}
              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white text-xs font-semibold"
                >
                  Cancel
                </button>

                <button
                  onClick={handleExecuteImport}
                  disabled={previewData.validRowsCount === 0}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 flex items-center space-x-2 transition-all disabled:opacity-50"
                >
                  <span>IMPORT {previewData.validRowsCount} VALID STUDENTS</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

            </div>
          )}

        </motion.div>
      </div>
    </AnimatePresence>
  );
};
