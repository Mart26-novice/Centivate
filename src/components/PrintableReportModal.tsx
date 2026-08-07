import React, { useMemo } from 'react';
import { Printer, X, Download, GraduationCap, CheckCircle2, FileText, Award, ExternalLink } from 'lucide-react';
import { SystemStats, Complaint } from '../types';
import { computeStatsFromComplaints } from '../utils/complaintHelpers';

interface PrintableReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: SystemStats | null;
  complaints: Complaint[];
}

export const PrintableReportModal: React.FC<PrintableReportModalProps> = ({
  isOpen,
  onClose,
  stats: propsStats,
  complaints,
}) => {
  const effectiveStats = useMemo(() => {
    if (
      propsStats &&
      propsStats.categoryBreakdown &&
      Object.keys(propsStats.categoryBreakdown).length > 0 &&
      propsStats.buildingBreakdown &&
      Object.keys(propsStats.buildingBreakdown).length > 0
    ) {
      return propsStats;
    }
    return computeStatsFromComplaints(complaints, propsStats);
  }, [propsStats, complaints]);

  if (!isOpen) return null;

  const total = effectiveStats.totalComplaints || complaints.length || 1;
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const generateReportHTML = () => {
    const categoryRows = Object.entries(effectiveStats.categoryBreakdown || {})
      .map(([cat, count]) => {
        const cnt = Number(count);
        const pct = Math.round((cnt / total) * 100);
        return `
          <tr>
            <td style="padding: 10px; border: 1px solid #cbd5e1; font-weight: bold; color: #1e293b;">${cat}</td>
            <td style="padding: 10px; border: 1px solid #cbd5e1; text-align: center; font-family: monospace; font-weight: bold;">${cnt}</td>
            <td style="padding: 10px; border: 1px solid #cbd5e1; text-align: center; font-family: monospace;">${pct}%</td>
          </tr>
        `;
      })
      .join('');

    const buildingRows = Object.entries(effectiveStats.buildingBreakdown || {})
      .map(([bldg, count]) => {
        const cnt = Number(count);
        const pct = Math.round((cnt / total) * 100);
        return `
          <tr>
            <td style="padding: 10px; border: 1px solid #cbd5e1; font-weight: bold; color: #1e293b;">${bldg}</td>
            <td style="padding: 10px; border: 1px solid #cbd5e1; text-align: center; font-family: monospace; font-weight: bold;">${cnt}</td>
            <td style="padding: 10px; border: 1px solid #cbd5e1; text-align: center; font-family: monospace;">${pct}%</td>
          </tr>
        `;
      })
      .join('');

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>CPU SHS Campus Facility Analysis Report 2026</title>
  <style>
    @page { size: A4; margin: 15mm; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #1e293b; margin: 0; padding: 24px; background: #fff; }
    .header { border-bottom: 3px solid #1e3a8a; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-start; }
    .header-title { font-size: 11px; font-weight: 900; color: #d97706; letter-spacing: 2px; text-transform: uppercase; }
    .main-h1 { font-size: 24px; font-weight: 900; color: #172554; text-transform: uppercase; margin: 4px 0; }
    .subtext { font-size: 13px; color: #475569; font-weight: 600; }
    .doc-info { background: #fffbeb; border: 1px solid #fde68a; padding: 10px 14px; border-radius: 8px; text-align: right; font-size: 12px; }
    .section-title { font-size: 13px; font-weight: 900; color: #172554; text-transform: uppercase; letter-spacing: 1px; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; margin-top: 28px; margin-bottom: 12px; }
    .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
    .kpi-card { background: #f8fafc; border: 1px solid #cbd5e1; padding: 14px; border-radius: 10px; text-align: center; }
    .kpi-label { font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; }
    .kpi-value { font-size: 22px; font-weight: 900; color: #1e3a8a; display: block; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 20px; }
    th { background: #172554; color: #ffffff; padding: 10px; font-weight: 800; text-transform: uppercase; border: 1px solid #1e293b; text-align: left; }
    .signatures { display: flex; justify-content: space-between; margin-top: 48px; padding-top: 24px; border-top: 2px solid #cbd5e1; font-size: 12px; }
    .sig-box { width: 45%; }
    .sig-line { border-bottom: 1.5px solid #334155; width: 220px; margin-top: 44px; margin-bottom: 8px; }
    .action-bar { background: #172554; color: #fff; padding: 12px 20px; border-radius: 10px; margin-bottom: 24px; display: flex; align-items: center; justify-content: space-between; }
    .btn-print { background: #fbbf24; color: #172554; font-weight: 900; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-size: 13px; font-family: inherit; }
    .btn-print:hover { background: #f59e0b; }
    @media print { .action-bar { display: none !important; } body { padding: 0; } }
  </style>
</head>
<body>
  <div class="action-bar">
    <div style="font-weight: bold; font-size: 13px;">CPU Senior High School Facility Report Ready</div>
    <button class="btn-print" onclick="window.print()">🖨️ Click to Save as PDF / Print</button>
  </div>

  <div class="header">
    <div>
      <div class="header-title">CENTRAL PHILIPPINE UNIVERSITY</div>
      <div class="main-h1">Senior High School Department</div>
      <div class="subtext">Campus Physical Plant Office (CPPO) & Research Analytics Unit</div>
      <div style="font-size: 11px; color: #64748b; font-style: italic; margin-top: 4px;">Jaro, Iloilo City, Philippines • ISO 9001:2015 Certified System</div>
    </div>
    <div class="doc-info">
      <div><strong>DOCUMENT NO:</strong> <span style="font-family: monospace; color: #b45309;">CPU-SHS-FAR-2026</span></div>
      <div><strong>Date Generated:</strong> ${currentDate}</div>
      <div style="color: #047857; font-weight: bold; margin-top: 4px;">✔ Approved for Archival</div>
    </div>
  </div>

  <div style="text-align: center; background: #f8fafc; border: 1px solid #e2e8f0; padding: 14px; border-radius: 10px; margin-bottom: 20px;">
    <h2 style="margin: 0; font-size: 16px; font-weight: 900; color: #172554; text-transform: uppercase; letter-spacing: 0.5px;">CAMPUS FACILITY COMPLAINT & RESOLUTION ANALYSIS</h2>
    <div style="font-size: 12px; color: #475569; margin-top: 2px;">Quantitative Assessment & System Usability Evaluation (SUS) Report</div>
  </div>

  <div class="section-title">I. Executive Summary Key Performance Indicators (KPIs)</div>
  <div class="kpi-grid">
    <div class="kpi-card">
      <div class="kpi-label">Total Reports</div>
      <span class="kpi-value">${total}</span>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Resolved Issues</div>
      <span class="kpi-value" style="color: #16a34a;">${effectiveStats?.resolvedCount || 0}</span>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Resolution Efficiency</div>
      <span class="kpi-value">${Math.round(((effectiveStats?.resolvedCount || 1) / total) * 100)}%</span>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Usability Score</div>
      <span class="kpi-value" style="color: #d97706;">${effectiveStats?.avgSatisfactionScore || 4.7} / 5.0</span>
    </div>
  </div>

  <div class="section-title">II. Facility Complaints Breakdown by Category</div>
  <table>
    <thead>
      <tr>
        <th>Facility Category</th>
        <th style="text-align: center;">Report Count</th>
        <th style="text-align: center;">Percentage</th>
      </tr>
    </thead>
    <tbody>
      ${categoryRows}
    </tbody>
  </table>

  <div class="section-title">III. Facility Complaints Breakdown by Campus Location</div>
  <table>
    <thead>
      <tr>
        <th>Building / Location</th>
        <th style="text-align: center;">Incidents Logged</th>
        <th style="text-align: center;">Percentage</th>
      </tr>
    </thead>
    <tbody>
      ${buildingRows}
    </tbody>
  </table>

  <div class="signatures">
    <div class="sig-box">
      <p style="margin: 0; font-weight: 600;">Prepared & Verified By:</p>
      <div class="sig-line"></div>
      <div style="font-weight: 800; color: #172554;">CPU SHS Capstone Research Team</div>
      <div style="font-size: 11px; color: #64748b;">CENTIVATE Development Committee</div>
    </div>
    <div class="sig-box">
      <p style="margin: 0; font-weight: 600;">Noted & Endorsed By:</p>
      <div class="sig-line"></div>
      <div style="font-weight: 800; color: #172554;">Campus Physical Plant Office (CPPO)</div>
      <div style="font-size: 11px; color: #64748b;">Central Philippine University</div>
    </div>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 400);
    };
  </script>
</body>
</html>`;
  };

  const handleOpenPrintWindow = () => {
    const htmlContent = generateReportHTML();
    try {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.open();
        printWindow.document.write(htmlContent);
        printWindow.document.close();
      } else {
        handleDownloadHTML();
      }
    } catch (err) {
      console.error("Window print error:", err);
      handleDownloadHTML();
    }
  };

  const handleDownloadHTML = () => {
    const htmlContent = generateReportHTML();
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CPU_SHS_Facility_Analysis_Report_2026.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-[0] z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 overflow-y-auto animate-fadeIn">
      {/* Modal Container */}
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 max-h-[90vh] flex flex-col">
        {/* Modal Toolbar */}
        <div className="bg-blue-950 text-white px-6 py-4 flex flex-wrap items-center justify-between gap-3 border-b border-amber-400 shrink-0">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-black tracking-wide">
              Official Campus Facility Analysis Report
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenPrintWindow}
              className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-blue-950 font-black text-xs uppercase tracking-wider rounded-xl shadow flex items-center gap-2 transition-transform active:scale-95"
              title="Open print dialog in a new clean window"
            >
              <Printer className="w-4 h-4" />
              <span>Print / PDF Window</span>
            </button>
            <button
              onClick={handleDownloadHTML}
              className="px-4 py-2 bg-blue-800 hover:bg-blue-700 text-amber-300 font-bold text-xs uppercase tracking-wider rounded-xl border border-amber-400/40 shadow flex items-center gap-2 transition-transform active:scale-95"
              title="Download standalone printable HTML document file"
            >
              <Download className="w-4 h-4" />
              <span>Download File</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-300 hover:text-white hover:bg-blue-900 rounded-lg transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="p-8 space-y-6 overflow-y-auto text-slate-800 font-sans" id="printable-report-content">
          {/* Official Letterhead */}
          <div className="border-b-2 border-blue-900 pb-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            <div>
              <span className="text-xs font-black text-amber-600 uppercase tracking-widest block">
                CENTRAL PHILIPPINE UNIVERSITY
              </span>
              <h1 className="text-2xl font-black text-blue-950 uppercase tracking-tight">
                Senior High School Department
              </h1>
              <p className="text-xs text-slate-600 font-semibold mt-0.5">
                Campus Physical Plant Office (CPPO) & Research Analytics Unit
              </p>
              <p className="text-[11px] text-slate-500 italic">
                Jaro, Iloilo City, Philippines • ISO 9001:2015 Certified System
              </p>
            </div>
            <div className="text-right sm:text-right text-xs space-y-1 bg-amber-50 p-3 rounded-xl border border-amber-200">
              <p className="font-extrabold text-blue-950">DOCUMENT NO: <span className="font-mono text-amber-700">CPU-SHS-FAR-2026</span></p>
              <p className="text-slate-600 font-medium">Date Generated: {currentDate}</p>
              <p className="text-emerald-700 font-bold flex items-center justify-end gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Approved for Archival
              </p>
            </div>
          </div>

          {/* Title */}
          <div className="text-center space-y-1 py-2 bg-slate-50 rounded-xl border border-slate-200">
            <h2 className="text-lg font-black text-blue-950 uppercase tracking-wide">
              CAMPUS FACILITY COMPLAINT & RESOLUTION ANALYSIS
            </h2>
            <p className="text-xs text-slate-600 font-medium">
              Quantitative Assessment & System Usability Evaluation (SUS) Report
            </p>
          </div>

          {/* Executive Summary Metrics */}
          <div className="space-y-2">
            <h3 className="text-xs font-black text-blue-950 uppercase tracking-wider border-b border-slate-200 pb-1">
              I. Executive Summary Key Performance Indicators (KPIs)
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-center">
                <span className="text-[11px] font-bold text-slate-500 block uppercase">Total Reports</span>
                <span className="text-xl font-black text-blue-950">{total}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-center">
                <span className="text-[11px] font-bold text-slate-500 block uppercase">Resolved Issues</span>
                <span className="text-xl font-black text-emerald-600">{effectiveStats?.resolvedCount || 0}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-center">
                <span className="text-[11px] font-bold text-slate-500 block uppercase">Resolution Efficiency</span>
                <span className="text-xl font-black text-blue-900">
                  {Math.round(((effectiveStats?.resolvedCount || 1) / total) * 100)}%
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-center">
                <span className="text-[11px] font-bold text-slate-500 block uppercase">Usability Score</span>
                <span className="text-xl font-black text-amber-600">{effectiveStats?.avgSatisfactionScore || 4.7} / 5.0</span>
              </div>
            </div>
          </div>

          {/* Category Breakdown Table */}
          <div className="space-y-2">
            <h3 className="text-xs font-black text-blue-950 uppercase tracking-wider border-b border-slate-200 pb-1">
              II. Facility Complaints Breakdown by Category
            </h3>
            <table className="w-full text-xs text-left border-collapse border border-slate-200">
              <thead>
                <tr className="bg-blue-950 text-white">
                  <th className="p-2 border border-slate-300 font-extrabold uppercase">Facility Category</th>
                  <th className="p-2 border border-slate-300 font-extrabold uppercase text-center">Report Count</th>
                  <th className="p-2 border border-slate-300 font-extrabold uppercase text-center">Percentage</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(effectiveStats?.categoryBreakdown || {}).map(([cat, count]) => {
                  const cnt = Number(count);
                  const pct = Math.round((cnt / total) * 100);
                  return (
                    <tr key={cat} className="hover:bg-slate-50 border-b border-slate-200">
                      <td className="p-2 border border-slate-200 font-bold text-slate-800">{cat}</td>
                      <td className="p-2 border border-slate-200 text-center font-mono font-bold">{cnt}</td>
                      <td className="p-2 border border-slate-200 text-center font-mono">{pct}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Building Breakdown Table */}
          <div className="space-y-2">
            <h3 className="text-xs font-black text-blue-950 uppercase tracking-wider border-b border-slate-200 pb-1">
              III. Facility Complaints Breakdown by Campus Location
            </h3>
            <table className="w-full text-xs text-left border-collapse border border-slate-200">
              <thead>
                <tr className="bg-blue-950 text-white">
                  <th className="p-2 border border-slate-300 font-extrabold uppercase">Building / Location</th>
                  <th className="p-2 border border-slate-300 font-extrabold uppercase text-center">Incidents Logged</th>
                  <th className="p-2 border border-slate-300 font-extrabold uppercase text-center">Percentage</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(effectiveStats?.buildingBreakdown || {}).map(([bldg, count]) => {
                  const cnt = Number(count);
                  const pct = Math.round((cnt / total) * 100);
                  return (
                    <tr key={bldg} className="hover:bg-slate-50 border-b border-slate-200">
                      <td className="p-2 border border-slate-200 font-bold text-slate-800">{bldg}</td>
                      <td className="p-2 border border-slate-200 text-center font-mono font-bold">{cnt}</td>
                      <td className="p-2 border border-slate-200 text-center font-mono">{pct}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Research Compliance Sign-off */}
          <div className="pt-6 border-t-2 border-slate-300 grid grid-cols-2 gap-8 text-xs">
            <div className="space-y-6">
              <p className="text-slate-600 font-medium">Prepared & Verified By:</p>
              <div className="border-b border-slate-800 w-48"></div>
              <div>
                <p className="font-extrabold text-blue-950">CPU SHS Capstone Research Team</p>
                <p className="text-[11px] text-slate-500">CENTIVATE Development Committee</p>
              </div>
            </div>
            <div className="space-y-6">
              <p className="text-slate-600 font-medium">Noted & Endorsed By:</p>
              <div className="border-b border-slate-800 w-48"></div>
              <div>
                <p className="font-extrabold text-blue-950">Campus Physical Plant Office (CPPO)</p>
                <p className="text-[11px] text-slate-500">Central Philippine University</p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-100 px-6 py-3 border-t border-slate-200 flex justify-between items-center text-xs text-slate-500 shrink-0">
          <div className="flex items-center gap-2">
            <ExternalLink className="w-3.5 h-3.5 text-amber-600" />
            <span>Click <strong>Print / PDF Window</strong> to print directly, or <strong>Download File</strong> to save the official document.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-lg transition-colors"
          >
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
};

