import React, { useState } from 'react';
import {
  Mail,
  Bot,
  FileCheck,
  FileText,
  Languages,
  ScanSearch,
  BrainCircuit,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowRight,
  Database,
  Wand2,
  ShieldCheck,
  ChevronRight,
  Code2,
  Cpu,
  RefreshCw,
  UserCog,
  CloudCog,
  Sparkles
} from 'lucide-react';

export default function FlowInfo() {
  const [activeAiTab, setActiveAiTab] = useState('classification');

  return (
    <div className="min-h-screen bg-background text-text-primary font-sans">

      {/* Hero Section */}
      <div className="relative border-b border-gray-100 py-16 px-4 sm:px-6 lg:px-12 overflow-hidden bg-white">
        <div className="max-w-screen-2xl mx-auto relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-6">
            <Wand2 className="w-3 h-3" />
            <span>Behind the scenes</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-[#1A1A1A] mb-4 tracking-tight">
            How Your Document Becomes <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-orange-600">Customs Data</span>
          </h1>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">
            From a simple email attachment to structured, validated JSON in seconds.
          </p>
        </div>

        {/* Background Decorations */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-10 pointer-events-none">
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary rounded-full blur-3xl mix-blend-multiply"></div>
          <div className="absolute top-1/2 -right-24 w-64 h-64 bg-orange-300 rounded-full blur-3xl mix-blend-multiply"></div>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-12 space-y-20 py-12">

        {/* SECTION 1: The Process Playground */}
        <section>
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-[#1A1A1A]">The Automation Pipeline</h2>
            <p className="text-gray-400 text-sm mt-1">End-to-end flow from your inbox to our database.</p>
          </div>

          <div className="relative bg-white border border-gray-200 rounded-2xl p-8 md:p-12 shadow-sm overflow-hidden">
            {/* Background Grid Pattern for "Playground" feel */}
            <div className="absolute inset-0 opacity-[0.03]"
              style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
            </div>

            {/* Connecting Line */}
            <div className="absolute top-[35%] md:top-1/2 left-[10%] w-[80%] h-0.5 bg-gray-100 -z-0 -translate-y-1/2"></div>

            <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8 md:gap-0">
              <PipelineStep
                icon={<Mail className="w-5 h-5" />}
                title="1. Email Sent"
                desc="Standard Outlook flow"
              />
              <PipelineArrow label="Auto-Forward" />
              <PipelineStep
                icon={<CloudCog className="w-5 h-5" />}
                title="2. Azure Function"
                desc="Secure cloud intake"
              />
              <PipelineArrow label="Trigger" />
              <PipelineStep
                icon={<BrainCircuit className="w-5 h-5" />}
                title="3. AI Extraction"
                desc="Mistral & OLED Models"
              />
              <PipelineArrow label="Verify" />
              <PipelineStep
                icon={<Database className="w-5 h-5" />}
                title="4. Streamliner"
                desc="Document Ready"
                isLast
              />
            </div>
          </div>
        </section>

        {/* SECTION 2: Tailored Extraction Logic */}
        <section>
          <div className="flex items-center gap-4 mb-8">
            <h2 className="text-2xl font-bold text-[#1A1A1A] flex items-center gap-3">
              <Code2 className="w-6 h-6 text-primary" />
              Custom-Tailored Extraction Logic
            </h2>
            <div className="h-px bg-gray-200 flex-1"></div>
          </div>

          <div className="bg-surface rounded-2xl shadow-sm border border-border overflow-hidden flex flex-col md:flex-row min-h-[450px]">
            {/* Tabs */}
            <div className="w-full md:w-1/3 bg-[#FAFAFA] border-r border-border flex flex-col p-2 gap-2">
              <AiTab
                active={activeAiTab === 'classification'}
                onClick={() => setActiveAiTab('classification')}
                icon={<FileText className="w-5 h-5" />}
                title="Smart Classification"
                subtitle="It knows your specific formats"
              />
              <AiTab
                active={activeAiTab === 'extraction'}
                onClick={() => setActiveAiTab('extraction')}
                icon={<Sparkles className="w-5 h-5" />}
                title="Multi-Model AI"
                subtitle="Mistral, Azure, and Python Regex"
              />
              <AiTab
                active={activeAiTab === 'intervention'}
                onClick={() => setActiveAiTab('intervention')}
                icon={<UserCog className="w-5 h-5" />}
                title="Manual Intervention"
                subtitle="When things get tricky"
              />
            </div>

            {/* Content Area */}
            <div className="w-full md:w-2/3 p-8 bg-white">
              {activeAiTab === 'classification' && (
                <div className="animate-fade-in">
                  <h3 className="text-xl font-bold text-[#1A1A1A] mb-4">We know your files.</h3>
                  <p className="text-gray-600 mb-8 leading-relaxed">
                    We don't just use a generic "one-size-fits-all" model.
                    Each client and file type has a <span className="font-semibold text-primary">dedicated extraction method</span> tuned to get the best accuracy possible.
                  </p>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="p-5 bg-gray-50 rounded-xl border border-gray-100 opacity-60">
                      <div className="text-[10px] font-bold uppercase text-gray-400 mb-2">Standard</div>
                      <div className="font-medium text-gray-900">Generic PDF Parser</div>
                      <p className="text-xs text-gray-500 mt-2">Prone to errors on complex layouts.</p>
                    </div>
                    <div className="p-5 bg-primary/5 rounded-xl border border-primary/20 relative overflow-hidden ring-1 ring-primary/30 shadow-[0_4px_12px_-4px_rgba(229,76,55,0.1)]">
                      <div className="absolute right-0 top-0 bg-primary text-white text-[10px] uppercase font-bold px-3 py-1 rounded-bl">We use this</div>
                      <div className="text-[10px] font-bold uppercase text-primary mb-2">Precision</div>
                      <div className="font-medium text-[#1A1A1A]">Client-Specific Logic</div>
                      <p className="text-xs text-gray-600 mt-2">Checking specific coordinates and keywords unique to your business.</p>
                    </div>
                  </div>
                </div>
              )}
              {activeAiTab === 'extraction' && (
                <div className="animate-fade-in">
                  <h3 className="text-xl font-bold text-[#1A1A1A] mb-4">A Symphony of Technologies</h3>
                  <p className="text-gray-600 mb-8 leading-relaxed">
                    We combine powerful tools. Start with Python REGEX for perfect pattern matching, layer on Azure AI for structure, and use LLMs for context.
                  </p>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <TechItem name="Azure Form Recognizer" desc="Structural extraction for invoices & tables." />
                    <TechItem name="Mistral AI & OCR" desc="High-precision text recognition for dense documents." />
                    <TechItem name="OpenAI GPT Models" desc="Contextual understanding of complex descriptions." />
                    <TechItem name="Custom Python Regex" desc="100% accurate pattern matching for IDs and codes." />
                  </div>
                </div>
              )}
              {activeAiTab === 'intervention' && (
                <div className="animate-fade-in">
                  <h3 className="text-xl font-bold text-[#1A1A1A] mb-4">Safety Net Protocol</h3>
                  <p className="text-gray-600 mb-8">
                    If the AI is confused, the system doesn't guess. It pauses.
                  </p>
                  <div className="p-6 bg-amber-50 border border-amber-100 rounded-xl shadow-sm">
                    <div className="flex gap-5">
                      <AlertTriangle className="w-8 h-8 text-amber-500 flex-shrink-0" />
                      <div>
                        <h4 className="font-bold text-amber-900 text-xs uppercase mb-2">Human Loop Triggered</h4>
                        <p className="text-sm text-amber-800 leading-relaxed mb-4 italic">
                          "I can't categorize this file 100% confidently."
                        </p>
                        <div className="text-xs font-mono bg-white/60 p-2 rounded border border-amber-200/50 text-amber-900 inline-block">
                          Action: Alert Ops Team &rarr; Manual Review
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* SECTION 3: The Engine Room & Cleaning */}
        <section className="grid md:grid-cols-2 gap-12 items-start">
          {/* Models */}
          <div>
            <h2 className="text-xl font-bold text-[#1A1A1A] mb-6 flex items-center gap-3">
              <Database className="w-5 h-5 text-gray-400" />
              Our Tech Stack
            </h2>
            <div className="space-y-4">
              <ModelItem
                title="Azure Functions"
                desc='Serverless orchestration handling the flow of documents securely.'
                titleColor="text-blue-600"
                bgColor="bg-blue-50"
              />
              <ModelItem
                title="Mistral & OpenAI"
                desc='Advanced Large Language Models for cognitive text understanding.'
                titleColor="text-primary"
                bgColor="bg-primary/5"
              />
              <ModelItem
                title="Python Regex"
                desc='Hard-coded pattern matching for zero-error data extraction.'
                titleColor="text-gray-700"
                bgColor="bg-gray-100"
              />
            </div>
          </div>

          {/* Cleaning Rules */}
          <div>
            <h2 className="text-xl font-bold text-[#1A1A1A] mb-6 flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-gray-400" />
              Auto-Cleaning Rules
            </h2>
            <div className="bg-white border border-border rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-sm">
                <thead className="bg-[#FAFAFA] text-gray-500 font-medium border-b border-border">
                  <tr>
                    <th className="px-5 py-3 text-left uppercase text-[10px] tracking-wider">Data Type</th>
                    <th className="px-5 py-3 text-left uppercase text-[10px] tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <RuleRow type="Dates" action="Standardized to dd/mm/yyyy" />
                  <RuleRow type="Weights" action="Cleaned to pure float (kg)" />
                  <RuleRow type="Currency" action="Symbols removed, numbers only" />
                  <RuleRow type="Country Codes" action="Mapped to ISO (UK -> GB)" />
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* SECTION 4: Statuses */}
        <section>
          <div className="flex items-center gap-4 mb-10 text-center justify-center">
            <div className="h-px bg-gray-200 flex-1 max-w-[100px]"></div>
            <h2 className="text-xl font-bold text-[#1A1A1A]">Possible Outcomes</h2>
            <div className="h-px bg-gray-200 flex-1 max-w-[100px]"></div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Success */}
            <div className="bg-white p-6 rounded-2xl border border-green-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-green-500"></div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                </div>
                <h3 className="font-bold text-[#1A1A1A]">Success</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Data extracted and verified.
              </p>
              <div className="inline-block px-2 py-0.5 bg-green-50 rounded text-[10px] font-bold text-green-700 tracking-wide uppercase">
                Status: Ready
              </div>
            </div>

            {/* Needs Eyes */}
            <div className="bg-white p-6 rounded-2xl border border-amber-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500"></div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
                  <UserCog className="w-5 h-5 text-amber-600" />
                </div>
                <h3 className="font-bold text-[#1A1A1A]">Manual Check</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Confidence low. Human review needed.
              </p>
              <div className="inline-block px-2 py-0.5 bg-amber-50 rounded text-[10px] font-bold text-amber-700 tracking-wide uppercase">
                Status: Review
              </div>
            </div>

            {/* Rejection */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-[#1A1A1A]"></div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                  <XCircle className="w-5 h-5 text-[#1A1A1A]" />
                </div>
                <h3 className="font-bold text-[#1A1A1A]">Error</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Critical failure or timeout.
              </p>
              <div className="inline-block px-2 py-0.5 bg-gray-100 rounded text-[10px] font-bold text-gray-700 tracking-wide uppercase">
                Status: Failed
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}

// --- Subcomponents ---

function PipelineStep({ icon, title, desc, isLast }) {
  return (
    <div className="flex flex-col items-center relative z-10 bg-white p-2 rounded-xl">
      <div className="w-12 h-12 rounded-xl bg-white border border-gray-200 shadow-sm flex items-center justify-center text-primary mb-3">
        {icon}
      </div>
      <div className="text-center">
        <h4 className="text-sm font-bold text-[#1A1A1A]">{title}</h4>
        <p className="text-[10px] text-gray-500 uppercase tracking-wide mt-1">{desc}</p>
      </div>
    </div>
  )
}

function PipelineArrow({ label }) {
  return (
    <div className="hidden md:flex flex-col items-center justify-center mx-4 flex-1">
      <div className="text-[10px] font-mono text-gray-400 mb-1 uppercase tracking-wider bg-white px-2 relative z-10">{label}</div>
      {/* Dotted Line */}
      <div className="w-full border-t-2 border-dotted border-gray-200 relative -top-3"></div>
      <ChevronRight className="w-4 h-4 text-gray-300 relative -top-5 left-1/2" />
    </div>
  )
}

function AiTab({ active, onClick, icon, title, subtitle }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-4 p-4 rounded-xl text-left transition-all border ${active ? 'bg-white border-primary/20 shadow-md ring-1 ring-primary/5' : 'border-transparent hover:bg-white hover:border-gray-200'}`}
    >
      <div className={`p-2.5 rounded-lg ${active ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'bg-gray-100 text-gray-400'}`}>
        {icon}
      </div>
      <div>
        <div className={`font-semibold text-sm ${active ? 'text-[#1A1A1A]' : 'text-gray-500'}`}>{title}</div>
        <div className="text-[11px] text-gray-400">{subtitle}</div>
      </div>
      {active && <ChevronRight className="w-4 h-4 text-primary ml-auto" />}
    </button>
  )
}

function TechItem({ name, desc }) {
  return (
    <div className="flex items-start gap-4 p-4 rounded-lg bg-gray-50 border border-gray-100 hover:border-primary/20 transition-colors">
      <div className="mt-1 w-2 h-2 rounded-full bg-primary flex-shrink-0 shadow-[0_0_8px_rgba(229,76,55,0.6)]"></div>
      <div>
        <span className="font-bold text-[#1A1A1A] text-sm block mb-1">{name}</span>
        <p className="text-gray-500 text-xs leading-relaxed">{desc}</p>
      </div>
    </div>
  )
}

function ModelItem({ title, desc, titleColor, bgColor }) {
  return (
    <div className="flex items-start gap-4 p-4 bg-white rounded-xl border border-border shadow-sm hover:border-primary/20 transition-all">
      <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${titleColor} ${bgColor} mt-0.5`}>
        {title.split(' ')[0]}
      </div>
      <div>
        <h4 className="font-bold text-[#1A1A1A] text-sm">{title}</h4>
        <p className="text-xs text-gray-500 mt-1">{desc}</p>
      </div>
    </div>
  )
}

function RuleRow({ type, action }) {
  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-5 py-3 font-medium text-[#1A1A1A] text-xs">{type}</td>
      <td className="px-5 py-3 text-gray-500 font-mono text-[10px]">{action}</td>
    </tr>
  )
}