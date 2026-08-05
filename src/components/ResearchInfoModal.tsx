import React, { useState } from 'react';
import {
  X,
  BookOpen,
  GraduationCap,
  Star,
  CheckCircle2,
  Send,
  Sparkles,
  Award,
  Layers,
  FileCheck,
  Layout,
} from 'lucide-react';

interface ResearchInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  avgSatisfactionScore?: number;
  surveyCount?: number;
  onSurveySubmitted?: () => void;
}

export const ResearchInfoModal: React.FC<ResearchInfoModalProps> = ({
  isOpen,
  onClose,
  avgSatisfactionScore = 4.7,
  surveyCount = 3,
  onSurveySubmitted,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'paper' | 'survey'>('paper');

  // Survey state
  const [role, setRole] = useState<'Student' | 'Faculty/Admin' | 'Maintenance Staff'>('Student');
  const [q1, setQ1] = useState(5);
  const [q2, setQ2] = useState(5);
  const [q3, setQ3] = useState(5);
  const [q4, setQ4] = useState(5);
  const [q5, setQ5] = useState(5);
  const [comments, setComments] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSurveySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/surveys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role,
          susQ1: q1,
          susQ2: q2,
          susQ3: q3,
          susQ4: q4,
          susQ5: q5,
          feedbackComments: comments,
        }),
      });

      if (res.ok) {
        setSubmitted(true);
        if (onSurveySubmitted) onSurveySubmitted();
      }
    } catch (err) {
      console.error('Survey submission error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-blue-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full border border-blue-200 overflow-hidden animate-fadeIn my-6 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-900 text-white px-6 py-4 flex items-center justify-between border-b-2 border-amber-400">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-400 text-blue-950 rounded-xl font-bold">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-lg">SHS Capstone Research Context</h3>
              <p className="text-xs text-blue-200">
                System Evaluation & Academic Documentation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-blue-200 hover:text-white p-1 rounded-lg hover:bg-blue-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub-Tab Navigation */}
        <div className="bg-blue-50 border-b border-blue-200 px-6 py-2 flex items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveSubTab('paper')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeSubTab === 'paper'
                  ? 'bg-blue-900 text-amber-300 shadow'
                  : 'text-slate-600 hover:text-blue-900'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Research Overview</span>
            </button>
            <button
              onClick={() => setActiveSubTab('survey')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeSubTab === 'survey'
                  ? 'bg-amber-400 text-blue-950 shadow'
                  : 'text-slate-600 hover:text-blue-900'
              }`}
            >
              <Star className="w-3.5 h-3.5" />
              <span>Usability Evaluation Survey</span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs font-bold text-blue-950 bg-white px-3 py-1 rounded-full border border-blue-200">
            <Award className="w-3.5 h-3.5 text-amber-500" />
            <span>Usability Rating: {avgSatisfactionScore} / 5.0</span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-slate-800 text-xs leading-relaxed">
          {activeSubTab === 'paper' ? (
            <div className="space-y-6">
              {/* Paper Title Block */}
              <div className="bg-blue-50/80 border-l-4 border-amber-400 rounded-r-xl p-4 space-y-1">
                <span className="text-[10px] uppercase tracking-wider font-extrabold text-blue-900">
                  Senior High School Practical Research Project
                </span>
                <h4 className="text-base font-black text-blue-950">
                  CENTIVATE: A Full-Stack Mobile and Web Complaint Reporting and Management System for Campus Facilities
                </h4>
                <p className="text-[11px] text-slate-600 italic">
                  Developed for Senior High School Campus Maintenance & Student Welfare
                </p>
              </div>

              {/* Research Sections Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2">
                  <div className="flex items-center gap-1.5 font-bold text-blue-950 text-sm">
                    <FileCheck className="w-4 h-4 text-amber-500" />
                    <span>Background & Problem Statement</span>
                  </div>
                  <p className="text-slate-600">
                    Traditional paper-based facility complaint reporting in high schools suffers from delays, lost records, and lack of transparency for students. Centivate digitizes facility maintenance workflow to accelerate repairs of broken classroom equipment, lighting, and plumbing hazards.
                  </p>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2">
                  <div className="flex items-center gap-1.5 font-bold text-blue-950 text-sm">
                    <Award className="w-4 h-4 text-amber-500" />
                    <span>Main Objectives</span>
                  </div>
                  <ul className="list-disc list-inside text-slate-600 space-y-1">
                    <li>Provide students an instant mobile interface to file facility complaints with photo evidence.</li>
                    <li>Generate unique tracking codes (`CENT-2026-XXXX`) for real-time status tracking.</li>
                    <li>Equip administrators with an analytical web dashboard for staff assignment and work order archiving.</li>
                  </ul>
                </div>
              </div>

              {/* Architecture & Stack */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center gap-2 font-bold text-blue-950 text-sm">
                  <Layers className="w-4 h-4 text-amber-500" />
                  <span>System Architecture & Technologies</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                  <div className="bg-white p-2 rounded-lg border border-slate-200">
                    <span className="font-extrabold text-blue-900 block">Frontend</span>
                    <span className="text-[10px] text-slate-500">React 19 + Tailwind CSS</span>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-200">
                    <span className="font-extrabold text-blue-900 block">Backend</span>
                    <span className="text-[10px] text-slate-500">Node.js + Express REST API</span>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-200">
                    <span className="font-extrabold text-blue-900 block">AI Logic</span>
                    <span className="text-[10px] text-slate-500">Gemini 3.6 Flash</span>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-200">
                    <span className="font-extrabold text-blue-900 block">Analytics</span>
                    <span className="text-[10px] text-slate-500">System Usability Scale (SUS)</span>
                  </div>
                </div>
              </div>

              <div className="text-center pt-2">
                <button
                  onClick={() => setActiveSubTab('survey')}
                  className="px-6 py-2.5 bg-amber-400 hover:bg-amber-300 text-blue-950 font-extrabold text-xs rounded-xl shadow transition-colors inline-flex items-center gap-2"
                >
                  <Star className="w-4 h-4" />
                  <span>Evaluate Centivate Usability Now</span>
                </button>
              </div>
            </div>
          ) : (
            /* System Usability Scale (SUS) Survey */
            <div>
              {submitted ? (
                <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-8 text-center space-y-3">
                  <div className="w-12 h-12 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto shadow-md">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <h4 className="text-lg font-black text-emerald-950">Thank You for Evaluating Centivate!</h4>
                  <p className="text-xs text-emerald-800 max-w-md mx-auto">
                    Your evaluation response has been recorded into our SHS Research survey database. Your feedback contributes directly to our capstone system evaluation statistics.
                  </p>
                  <button
                    onClick={() => setSubmitted(false)}
                    className="text-xs font-bold text-emerald-900 underline hover:text-emerald-700"
                  >
                    Submit another response
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSurveySubmit} className="space-y-5">
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-blue-950 text-sm">System Usability Questionnaire</h4>
                      <p className="text-[11px] text-slate-600">
                        Rate each parameter on a scale of 1 (Strongly Disagree) to 5 (Strongly Agree).
                      </p>
                    </div>
                    <span className="text-xs font-extrabold text-amber-600 bg-amber-100 px-2.5 py-1 rounded-full border border-amber-300">
                      5 Questions
                    </span>
                  </div>

                  {/* Role Selection */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Your Role in School
                    </label>
                    <select
                      value={role}
                      onChange={(e: any) => setRole(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs font-semibold focus:ring-2 focus:ring-amber-400 focus:outline-none"
                    >
                      <option value="Student">Senior High Student</option>
                      <option value="Faculty/Admin">School Faculty / Administrator</option>
                      <option value="Maintenance Staff">Campus Maintenance Staff</option>
                    </select>
                  </div>

                  {/* Likert Questions */}
                  <div className="space-y-4">
                    {[
                      { state: q1, setter: setQ1, label: '1. Centivate was easy and intuitive to navigate.' },
                      { state: q2, setter: setQ2, label: '2. Submitting a complaint with photos and details was fast.' },
                      { state: q3, setter: setQ3, label: '3. Real-time status tracking provided clarity on repair progress.' },
                      { state: q4, setter: setQ4, label: '4. The blue & yellow school visual theme is clear and accessible.' },
                      { state: q5, setter: setQ5, label: '5. Centivate effectively improves campus maintenance workflow.' },
                    ].map((item, idx) => (
                      <div key={idx} className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                        <label className="block font-bold text-slate-800 text-xs">{item.label}</label>
                        <div className="flex items-center justify-between gap-1 max-w-md">
                          <span className="text-[10px] text-slate-500">1 (Disagree)</span>
                          {[1, 2, 3, 4, 5].map((val) => (
                            <button
                              type="button"
                              key={val}
                              onClick={() => item.setter(val)}
                              className={`w-9 h-9 rounded-lg font-bold text-xs transition-all ${
                                item.state === val
                                  ? 'bg-amber-400 text-blue-950 ring-2 ring-amber-500 scale-105 font-black'
                                  : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
                              }`}
                            >
                              {val}
                            </button>
                          ))}
                          <span className="text-[10px] text-slate-500">5 (Agree)</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Open Comments */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Feedback / Recommendations for SHS Research Team (Optional)
                    </label>
                    <textarea
                      rows={2}
                      value={comments}
                      onChange={(e) => setComments(e.target.value)}
                      placeholder="Share your thoughts or suggestions to improve Centivate..."
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs focus:ring-2 focus:ring-amber-400 focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3 bg-amber-400 hover:bg-amber-300 text-blue-950 font-black text-xs uppercase tracking-wider rounded-xl shadow transition-colors flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    <span>{submitting ? 'Submitting...' : 'Submit System Evaluation'}</span>
                  </button>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-100 px-6 py-3 flex justify-end border-t border-slate-200">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-700 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow transition-colors"
          >
            Close Window
          </button>
        </div>
      </div>
    </div>
  );
};
