'use client';

import React, { useState, useEffect } from 'react';
import {
  FileText,
  HelpCircle,
  ShieldCheck,
  Save,
  Plus,
  Trash2,
  Edit2,
  Eye,
  CheckCircle2,
  Clock,
  Sparkles,
  Search,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Tag,
  RefreshCw,
  X,
  AlertCircle,
} from 'lucide-react';
import { adminApi, CmsDocumentItem, CmsFaqItem } from '@/lib/api';
import { RichTextEditor } from '@/components/admin/RichTextEditor';

type SubmoduleTab = 'faq' | 'privacy' | 'terms';

export default function AdminCmsPage() {
  const [activeTab, setActiveTab] = useState<SubmoduleTab>('faq');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // CMS Documents
  const [faqDoc, setFaqDoc] = useState<CmsDocumentItem | null>(null);
  const [privacyDoc, setPrivacyDoc] = useState<CmsDocumentItem | null>(null);
  const [termsDoc, setTermsDoc] = useState<CmsDocumentItem | null>(null);

  // FAQ management local state
  const [faqCategoryFilter, setFaqCategoryFilter] = useState<string>('all');
  const [faqSearchQuery, setFaqSearchQuery] = useState('');
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>(null);

  // Add / Edit FAQ Modal
  const [faqModalOpen, setFaqModalOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<CmsFaqItem | null>(null);
  const [faqForm, setFaqForm] = useState<{
    id: string;
    category: string;
    category_label: string;
    question: string;
    answer: string;
    tags: string;
  }>({
    id: '',
    category: 'payments',
    category_label: 'Payments & Payouts',
    question: '',
    answer: '',
    tags: '',
  });

  // Privacy Policy local state
  const [privacyViewMode, setPrivacyViewMode] = useState<'editor' | 'preview'>('editor');
  const [privacyForm, setPrivacyForm] = useState({
    title: '',
    version: '',
    effective_date: '',
    rich_text_html: '',
  });

  // Terms local state
  const [termsViewMode, setTermsViewMode] = useState<'editor' | 'preview'>('editor');
  const [termsForm, setTermsForm] = useState({
    title: '',
    version: '',
    effective_date: '',
    rich_text_html: '',
  });

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadAllCmsData = async () => {
    try {
      setLoading(true);
      const docs = await adminApi.getCmsDocuments();
      const faq = docs.find((d) => d.slug === 'vendor-faq') || null;
      const privacy = docs.find((d) => d.slug === 'privacy-policy') || null;
      const terms = docs.find((d) => d.slug === 'terms-and-conditions') || null;

      setFaqDoc(faq);
      if (faq?.faqs && faq.faqs.length > 0) {
        setExpandedFaqId(faq.faqs[0].id);
      }

      setPrivacyDoc(privacy);
      if (privacy) {
        setPrivacyForm({
          title: privacy.title,
          version: privacy.version,
          effective_date: privacy.effective_date,
          rich_text_html: privacy.rich_text_html,
        });
      }

      setTermsDoc(terms);
      if (terms) {
        setTermsForm({
          title: terms.title,
          version: terms.version,
          effective_date: terms.effective_date,
          rich_text_html: terms.rich_text_html,
        });
      }
    } catch (e) {
      showToast('Error loading CMS documents from backend', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllCmsData();
  }, []);

  // ============================================================================
  // FAQ HANDLERS
  // ============================================================================
  const categories = [
    { key: 'payments', label: 'Payments & Payouts' },
    { key: 'courts', label: 'Courts & Slots' },
    { key: 'bookings', label: 'Bookings & Check-in' },
    { key: 'cancellations', label: 'Cancellations & Refunds' },
    { key: 'staff', label: 'Staff & Security' },
  ];

  const handleOpenAddFaq = () => {
    setEditingFaq(null);
    setFaqForm({
      id: `faq-${Date.now()}`,
      category: 'payments',
      category_label: 'Payments & Payouts',
      question: '',
      answer: '<p>Write detailed answer here...</p>',
      tags: 'payout, bank, settlement',
    });
    setFaqModalOpen(true);
  };

  const handleOpenEditFaq = (item: CmsFaqItem) => {
    setEditingFaq(item);
    setFaqForm({
      id: item.id,
      category: item.category,
      category_label: item.category_label,
      question: item.question,
      answer: item.answer,
      tags: Array.isArray(item.tags) ? item.tags.join(', ') : '',
    });
    setFaqModalOpen(true);
  };

  const handleSaveFaqModal = () => {
    if (!faqForm.question.trim()) {
      alert('Please enter a question title.');
      return;
    }
    if (!faqForm.answer.trim()) {
      alert('Please enter an answer.');
      return;
    }

    const currentFaqs = [...(faqDoc?.faqs || [])];
    const categoryMatch = categories.find((c) => c.key === faqForm.category);
    const categoryLabel = categoryMatch ? categoryMatch.label : faqForm.category;

    const rawTags = faqForm.tags || '';
    const tagsArray = (typeof rawTags === 'string' ? rawTags.split(',') : Array.isArray(rawTags) ? rawTags : [])
      .map((t: any) => (typeof t === 'string' ? t.trim() : String(t || '').trim()))
      .filter(Boolean);

    const newFaqItem: CmsFaqItem = {
      id: faqForm.id || `faq-${Date.now()}`,
      category: faqForm.category,
      category_label: categoryLabel,
      question: faqForm.question.trim(),
      answer: faqForm.answer,
      tags: tagsArray,
      order: editingFaq?.order || currentFaqs.length + 1,
    };

    let updatedFaqs: CmsFaqItem[];
    if (editingFaq) {
      updatedFaqs = currentFaqs.map((f) => (f.id === editingFaq.id ? newFaqItem : f));
    } else {
      updatedFaqs = [newFaqItem, ...currentFaqs];
    }

    setFaqDoc((prev) => (prev ? { ...prev, faqs: updatedFaqs } : null));
    setFaqModalOpen(false);
    showToast(editingFaq ? 'FAQ question updated' : 'New FAQ added');
  };

  const handleDeleteFaq = (id: string) => {
    if (!confirm('Are you sure you want to delete this FAQ?')) return;
    const currentFaqs = [...(faqDoc?.faqs || [])];
    const updated = currentFaqs.filter((f) => f.id !== id);
    setFaqDoc((prev) => (prev ? { ...prev, faqs: updated } : null));
    showToast('FAQ removed from draft list');
  };

  const handlePublishFaqs = async () => {
    try {
      setSaving(true);
      const res = await adminApi.updateCmsDocument('vendor-faq', {
        faqs: faqDoc?.faqs || [],
        status: 'PUBLISHED',
      });
      setFaqDoc(res);
      showToast('Vendor FAQs published to Vendor App!');
    } catch {
      showToast('Failed to publish FAQs', 'error');
    } finally {
      setSaving(false);
    }
  };

  // ============================================================================
  // PRIVACY POLICY HANDLERS
  // ============================================================================
  const handlePublishPrivacyPolicy = async () => {
    try {
      setSaving(true);
      const res = await adminApi.updateCmsDocument('privacy-policy', {
        title: privacyForm.title,
        version: privacyForm.version,
        effective_date: privacyForm.effective_date,
        rich_text_html: privacyForm.rich_text_html,
        status: 'PUBLISHED',
      });
      setPrivacyDoc(res);
      showToast('Privacy Policy published to Vendor App!');
    } catch {
      showToast('Failed to publish Privacy Policy', 'error');
    } finally {
      setSaving(false);
    }
  };

  // ============================================================================
  // TERMS & CONDITIONS HANDLERS
  // ============================================================================
  const handlePublishTerms = async () => {
    try {
      setSaving(true);
      const res = await adminApi.updateCmsDocument('terms-and-conditions', {
        title: termsForm.title,
        version: termsForm.version,
        effective_date: termsForm.effective_date,
        rich_text_html: termsForm.rich_text_html,
        status: 'PUBLISHED',
      });
      setTermsDoc(res);
      showToast('Terms & Conditions published to Vendor App!');
    } catch {
      showToast('Failed to publish Terms & Conditions', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Filtered FAQs
  const filteredFaqs = (faqDoc?.faqs || []).filter((f) => {
    const matchesCategory = faqCategoryFilter === 'all' || f.category === faqCategoryFilter;
    const matchesQuery =
      faqSearchQuery === '' ||
      f.question.toLowerCase().includes(faqSearchQuery.toLowerCase()) ||
      f.answer.toLowerCase().includes(faqSearchQuery.toLowerCase()) ||
      (Array.isArray(f.tags) && f.tags.some((t) => t.toLowerCase().includes(faqSearchQuery.toLowerCase())));
    return matchesCategory && matchesQuery;
  });

  return (
    <div className="space-y-6 pb-16">
      {/* Toast Alert */}
      {toastMessage && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-2.5 text-sm font-bold text-white transition-all animate-in slide-in-from-top-4 ${
            toastMessage.type === 'error'
              ? 'bg-rose-600 border-rose-500'
              : 'bg-emerald-600 border-emerald-500'
          }`}
        >
          {toastMessage.type === 'error' ? (
            <AlertCircle className="w-4 h-4" />
          ) : (
            <CheckCircle2 className="w-4 h-4" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Screen Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">
              Vendor CMS & Legal Policies
            </h1>
          </div>
          <p className="text-sm text-slate-500">
            Rich Text Editor CMS to manage, update, and publish Vendor FAQs, Privacy Policy, and Terms & Conditions directly to the Vendor Portal.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/60 text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Live Vendor Sync Active</span>
          </span>
          <button
            onClick={loadAllCmsData}
            disabled={loading}
            className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 active:scale-95 transition-all cursor-pointer"
            title="Reload from backend"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-orange-500' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Submodules Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('faq')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'faq'
              ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/60'
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          <span>Vendor FAQ</span>
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-black ${
              activeTab === 'faq' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            {faqDoc?.faqs?.length || 0}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('privacy')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'privacy'
              ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/60'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Privacy Policy</span>
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-black ${
              activeTab === 'privacy' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            v{privacyForm.version || '2.4'}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('terms')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'terms'
              ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/60'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Terms & Conditions</span>
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-black ${
              activeTab === 'terms' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            v{termsForm.version || '3.0'}
          </span>
        </button>
      </div>

      {/* ======================================================================= */}
      {/* SUBMODULE 1: VENDOR FAQ                                                 */}
      {/* ======================================================================= */}
      {activeTab === 'faq' && (
        <div className="space-y-5">
          {/* Action Header Card */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search FAQ question or tag..."
                  value={faqSearchQuery}
                  onChange={(e) => setFaqSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 rounded-xl text-xs font-medium bg-slate-50 border border-slate-200 focus:outline-none focus:border-orange-500 w-60"
                />
              </div>

              {/* Category Filter */}
              <select
                value={faqCategoryFilter}
                onChange={(e) => setFaqCategoryFilter(e.target.value)}
                className="py-2 px-3 rounded-xl text-xs font-bold bg-slate-50 border border-slate-200 text-slate-700 focus:outline-none focus:border-orange-500"
              >
                <option value="all">All Categories ({faqDoc?.faqs?.length || 0})</option>
                {categories.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.label} ({faqDoc?.faqs?.filter((f) => f.category === c.key).length || 0})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={handleOpenAddFaq}
                className="px-4 py-2 rounded-xl bg-orange-50 text-orange-600 border border-orange-200 hover:bg-orange-100 text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Add Question</span>
              </button>

              <button
                onClick={handlePublishFaqs}
                disabled={saving}
                className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-black flex items-center gap-1.5 shadow-sm shadow-orange-500/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>{saving ? 'Publishing...' : 'Publish FAQs'}</span>
              </button>
            </div>
          </div>

          {/* FAQs List */}
          <div className="space-y-3">
            {filteredFaqs.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-3xl border border-slate-200">
                <HelpCircle className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <h3 className="text-base font-bold text-slate-700">No FAQ Questions Found</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Try changing your search query or click &ldquo;Add Question&rdquo; to create a new one.
                </p>
              </div>
            ) : (
              filteredFaqs.map((faq, index) => {
                const isExpanded = expandedFaqId === faq.id;
                return (
                  <div
                    key={faq.id}
                    className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden transition-all"
                  >
                    <div
                      onClick={() => setExpandedFaqId(isExpanded ? null : faq.id)}
                      className="p-4 flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/60 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-600 text-xs font-black flex items-center justify-center shrink-0">
                          {index + 1}
                        </span>
                        <div className="min-w-0">
                          <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-orange-50 text-orange-600 border border-orange-100 mb-1">
                            {faq.category_label || faq.category}
                          </span>
                          <h3 className="text-sm font-bold text-slate-900 truncate">
                            {faq.question}
                          </h3>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEditFaq(faq);
                          }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-orange-600 hover:bg-orange-50 active:scale-95 transition-all cursor-pointer"
                          title="Edit with Rich Text Editor"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteFaq(faq.id);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 active:scale-95 transition-all cursor-pointer"
                          title="Delete FAQ"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-slate-400">
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="px-5 pb-5 pt-1 border-t border-slate-100 bg-slate-50/40 space-y-3">
                        <div
                          className="text-xs text-slate-700 leading-relaxed prose prose-sm max-w-none pt-2"
                          dangerouslySetInnerHTML={{ __html: faq.answer }}
                        />

                        {faq.tags && faq.tags.length > 0 && (
                          <div className="flex items-center gap-1.5 pt-2 border-t border-slate-200/60">
                            <Tag className="w-3 h-3 text-slate-400" />
                            <span className="text-[10.5px] font-medium text-slate-400">Tags:</span>
                            <div className="flex flex-wrap gap-1">
                              {faq.tags.map((t, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[10px] text-slate-600 font-medium"
                                >
                                  #{t}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ======================================================================= */}
      {/* SUBMODULE 2: PRIVACY POLICY                                             */}
      {/* ======================================================================= */}
      {activeTab === 'privacy' && (
        <div className="space-y-5">
          {/* Metadata Card */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <div>
                  <h2 className="text-base font-black text-slate-900">
                    Partner Privacy Policy Specification
                  </h2>
                  <p className="text-xs text-slate-500">
                    Edit official privacy commitments displayed on vendor legal screen
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center bg-slate-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setPrivacyViewMode('editor')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      privacyViewMode === 'editor'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Rich Text Editor
                  </button>
                  <button
                    type="button"
                    onClick={() => setPrivacyViewMode('preview')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                      privacyViewMode === 'preview'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Vendor Preview</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handlePublishPrivacyPolicy}
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-black flex items-center gap-1.5 shadow-sm shadow-orange-500/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{saving ? 'Publishing...' : 'Save & Publish Policy'}</span>
                </button>
              </div>
            </div>

            {/* Document Attributes */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Document Title
                </label>
                <input
                  type="text"
                  value={privacyForm.title}
                  onChange={(e) => setPrivacyForm({ ...privacyForm, title: e.target.value })}
                  className="w-full text-xs font-semibold px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Version
                </label>
                <input
                  type="text"
                  value={privacyForm.version}
                  onChange={(e) => setPrivacyForm({ ...privacyForm, version: e.target.value })}
                  className="w-full text-xs font-semibold px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Effective Date
                </label>
                <input
                  type="text"
                  value={privacyForm.effective_date}
                  onChange={(e) => setPrivacyForm({ ...privacyForm, effective_date: e.target.value })}
                  className="w-full text-xs font-semibold px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>
          </div>

          {/* Editor or Preview Pane */}
          {privacyViewMode === 'editor' ? (
            <div className="space-y-2">
              <label className="block text-xs font-black uppercase tracking-wider text-slate-500">
                Privacy Policy Rich Text Content
              </label>
              <RichTextEditor
                value={privacyForm.rich_text_html}
                onChange={(html) => setPrivacyForm({ ...privacyForm, rich_text_html: html })}
                minHeight="420px"
              />
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm space-y-6 max-w-4xl mx-auto">
              <div className="border-b border-slate-100 pb-4">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold mb-2">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Official Policy · Version {privacyForm.version}</span>
                </span>
                <h1 className="text-2xl font-black text-slate-900">{privacyForm.title}</h1>
                <p className="text-xs text-slate-500 mt-1">Effective Date: {privacyForm.effective_date}</p>
              </div>

              <div
                className="prose prose-sm sm:prose-base max-w-none text-slate-700 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: privacyForm.rich_text_html }}
              />
            </div>
          )}
        </div>
      )}

      {/* ======================================================================= */}
      {/* SUBMODULE 3: TERMS & CONDITIONS                                         */}
      {/* ======================================================================= */}
      {activeTab === 'terms' && (
        <div className="space-y-5">
          {/* Metadata Card */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-orange-600" />
                <div>
                  <h2 className="text-base font-black text-slate-900">
                    Vendor Partner Agreement & Terms Specification
                  </h2>
                  <p className="text-xs text-slate-500">
                    Configure agreement clauses and policies delivered to vendor console
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center bg-slate-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setTermsViewMode('editor')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      termsViewMode === 'editor'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Rich Text Editor
                  </button>
                  <button
                    type="button"
                    onClick={() => setTermsViewMode('preview')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                      termsViewMode === 'preview'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Vendor Preview</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handlePublishTerms}
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-black flex items-center gap-1.5 shadow-sm shadow-orange-500/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{saving ? 'Publishing...' : 'Save & Publish Terms'}</span>
                </button>
              </div>
            </div>

            {/* Document Attributes */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Agreement Title
                </label>
                <input
                  type="text"
                  value={termsForm.title}
                  onChange={(e) => setTermsForm({ ...termsForm, title: e.target.value })}
                  className="w-full text-xs font-semibold px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Agreement Version
                </label>
                <input
                  type="text"
                  value={termsForm.version}
                  onChange={(e) => setTermsForm({ ...termsForm, version: e.target.value })}
                  className="w-full text-xs font-semibold px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Effective Date
                </label>
                <input
                  type="text"
                  value={termsForm.effective_date}
                  onChange={(e) => setTermsForm({ ...termsForm, effective_date: e.target.value })}
                  className="w-full text-xs font-semibold px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>
          </div>

          {/* Editor or Preview Pane */}
          {termsViewMode === 'editor' ? (
            <div className="space-y-2">
              <label className="block text-xs font-black uppercase tracking-wider text-slate-500">
                Terms & Conditions Rich Text Content
              </label>
              <RichTextEditor
                value={termsForm.rich_text_html}
                onChange={(html) => setTermsForm({ ...termsForm, rich_text_html: html })}
                minHeight="420px"
              />
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm space-y-6 max-w-4xl mx-auto">
              <div className="border-b border-slate-100 pb-4">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-50 text-orange-700 text-xs font-bold mb-2">
                  <FileText className="w-3.5 h-3.5" />
                  <span>Platform Terms · Version {termsForm.version}</span>
                </span>
                <h1 className="text-2xl font-black text-slate-900">{termsForm.title}</h1>
                <p className="text-xs text-slate-500 mt-1">Effective Date: {termsForm.effective_date}</p>
              </div>

              <div
                className="prose prose-sm sm:prose-base max-w-none text-slate-700 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: termsForm.rich_text_html }}
              />
            </div>
          )}
        </div>
      )}

      {/* ======================================================================= */}
      {/* ADD / EDIT FAQ QUESTION MODAL WITH RICH TEXT EDITOR                     */}
      {/* ======================================================================= */}
      {faqModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
                  <HelpCircle className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-black text-slate-900">
                  {editingFaq ? 'Edit FAQ Question' : 'Add New Vendor Question'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setFaqModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Category <span className="text-orange-600">*</span>
                  </label>
                  <select
                    value={faqForm.category}
                    onChange={(e) => {
                      const match = categories.find((c) => c.key === e.target.value);
                      setFaqForm({
                        ...faqForm,
                        category: e.target.value,
                        category_label: match ? match.label : e.target.value,
                      });
                    }}
                    className="w-full text-xs font-semibold px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-orange-500"
                  >
                    {categories.map((c) => (
                      <option key={c.key} value={c.key}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Search Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={faqForm.tags}
                    onChange={(e) => setFaqForm({ ...faqForm, tags: e.target.value })}
                    placeholder="e.g. payout, bank, imps"
                    className="w-full text-xs font-medium px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Question Title <span className="text-orange-600">*</span>
                </label>
                <input
                  type="text"
                  value={faqForm.question}
                  onChange={(e) => setFaqForm({ ...faqForm, question: e.target.value })}
                  placeholder="e.g. How are UPI collections settled into my bank account?"
                  className="w-full text-xs font-bold px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Answer (Rich Text) <span className="text-orange-600">*</span>
                </label>
                <RichTextEditor
                  value={faqForm.answer}
                  onChange={(html) => setFaqForm({ ...faqForm, answer: html })}
                  minHeight="180px"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setFaqModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveFaqModal}
                className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-black shadow-sm shadow-orange-500/20 active:scale-95 transition-all cursor-pointer"
              >
                {editingFaq ? 'Save Changes' : 'Add Question'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
